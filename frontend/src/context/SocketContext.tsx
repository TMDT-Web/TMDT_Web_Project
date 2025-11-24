/**
 * WebSocket Context for Real-time Chat
 * Manages WebSocket connections and message handling
 */
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface ChatMessage {
  id?: number
  sender: 'user' | 'admin'
  sender_id?: number
  message: string
  created_at?: string
  timestamp?: Date
}

interface SocketContextType {
  isConnected: boolean
  sessionId: string | null
  messages: ChatMessage[]
  sendMessage: (content: string, sender: 'user' | 'admin', senderId?: number) => void
  createSession: () => Promise<string>
  connectToSession: (sessionId: string) => void
  disconnect: () => void
  clearMessages: () => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

interface SocketProviderProps {
  children: ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { user } = useAuth()
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])

  // Generate WebSocket URL
  const getWsUrl = (sessionId: string) => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    
    // Determine WebSocket host
    let wsHost: string
    if (import.meta.env.VITE_WS_URL) {
      // Use environment variable if provided
      wsHost = import.meta.env.VITE_WS_URL
      // Remove protocol from WS_URL if present
      wsHost = wsHost.replace(/^(ws:\/\/|wss:\/\/)/, '')
    } else {
      // Construct dynamically using current hostname
      wsHost = `${window.location.hostname}:8000`
    }
    
    return `${wsProtocol}//${wsHost}/api/v1/chat/ws/${sessionId}`
  }

  // Connect to WebSocket
  const connectToSession = useCallback(async (newSessionId: string) => {
    // Disconnect existing connection
    if (socket) {
      socket.close()
    }

    // Load historical messages first
    try {
      console.log('[Chat] Loading historical messages for session:', newSessionId)
      const { ChatService } = await import('@/client')
      const historicalMessages = await ChatService.getSessionMessagesApiV1ChatSessionsSessionIdMessagesGet(newSessionId)
      
      const formattedMessages: ChatMessage[] = historicalMessages.map(msg => ({
        id: msg.id,
        sender: msg.sender as 'user' | 'admin',
        sender_id: msg.sender_id,
        message: msg.message,
        created_at: msg.created_at,
        timestamp: new Date(msg.created_at)
      }))
      
      setMessages(formattedMessages)
      console.log('[Chat] Successfully loaded', formattedMessages.length, 'historical messages')
    } catch (error) {
      console.error('[Chat] Error loading historical messages:', error)
      console.error('[Chat] Error details:', JSON.stringify(error, null, 2))
      // Continue with WebSocket connection even if history load fails
    }

    const wsUrl = getWsUrl(newSessionId)
    console.log('[WebSocket] Connecting to:', wsUrl)

    try {
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('[WebSocket] Successfully connected to session:', newSessionId)
        setIsConnected(true)
        setSessionId(newSessionId)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('[WS DEBUG] Received:', data); // Keep this for debugging

          // Handle error messages
          if (data.type === 'error') {
            console.error('[WS Error]', data.message);
            alert(`Chat Error: ${data.message}`)
            // Remove optimistic message if it exists
            setMessages(prev => prev.filter(msg => msg.id !== undefined && msg.id > 0))
            return
          }

          // Handle system messages
          if (data.type === 'system') {
            console.log('[WebSocket] System message:', data.message)
            return
          }

          // Handle chat messages
          const newMessage: ChatMessage = {
            id: data.id,
            sender: data.sender,
            sender_id: data.sender_id,
            message: data.message,
            created_at: data.created_at,
            timestamp: data.created_at ? new Date(data.created_at) : new Date()
          }

          // Deduplication: Check if message already exists
          setMessages(prev => {
            // Check by ID first (most reliable)
            const existsById = prev.some(msg => msg.id && msg.id === newMessage.id)
            
            if (existsById) {
              console.log('[WebSocket] Duplicate message by ID detected, replacing optimistic')
              // Replace optimistic message (negative ID) with real one
              return prev.map(msg => 
                (msg.id && msg.id < 0 && msg.message === newMessage.message) ? newMessage : msg
              ).filter((msg, index, self) => 
                index === self.findIndex(m => m.id === msg.id)
              )
            }
            
            console.log('[WebSocket] Adding new message to state')
            return [...prev, newMessage]
          })
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error)
          console.error('[WebSocket] Raw message data:', event.data)
        }
      }

      ws.onerror = (error) => {
        console.error('[WebSocket] Connection error:', error)
        console.error('[WebSocket] Error event details:', JSON.stringify(error, null, 2))
        setIsConnected(false)
      }

      ws.onclose = (event) => {
        console.log('[WebSocket] Connection closed')
        console.log('[WebSocket] Close code:', event.code, 'reason:', event.reason)
        setIsConnected(false)
        setSessionId(null)
      }

      setSocket(ws)
    } catch (error) {
      console.error('[WebSocket] Failed to create WebSocket connection:', error)
      console.error('[WebSocket] Connection URL:', wsUrl)
      setIsConnected(false)
    }
  }, [socket])

  // Send message through WebSocket
  const sendMessage = useCallback((content: string, sender: 'user' | 'admin', senderId?: number) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error('[WebSocket] Cannot send message: Not connected')
      alert('Not connected to chat. Please refresh the page.')
      return
    }

    if (!content.trim()) {
      console.error('[WebSocket] Cannot send empty message')
      return
    }

    const actualSenderId = senderId || user?.id || 0
    
    // Optimistic UI: Add message immediately with temporary ID
    const optimisticMessage: ChatMessage = {
      id: -Date.now(), // Negative timestamp as temporary ID
      sender,
      sender_id: actualSenderId,
      message: content,
      timestamp: new Date(),
      created_at: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, optimisticMessage])
    console.log('[WebSocket] Added optimistic message:', optimisticMessage)

    // Send to server
    const messageData = {
      sender,
      sender_id: actualSenderId,
      message: content
    }

    console.log('[WebSocket] Sending message:', messageData)
    socket.send(JSON.stringify(messageData))
  }, [socket, user])

  // Create new chat session
  const createSession = useCallback(async (): Promise<string> => {
    try {
      // Import ChatService dynamically to avoid circular dependency
      const { ChatService } = await import('@/client')
      const response = await ChatService.createChatSessionApiV1ChatSessionsPost()
      const newSessionId = response.session_id
      console.log('[Chat] Created new session:', newSessionId)
      return newSessionId
    } catch (error) {
      console.error('[Chat] Error creating session:', error)
      // Fallback: generate random session ID
      const fallbackSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      console.warn('[Chat] Using fallback session ID:', fallbackSessionId)
      return fallbackSessionId
    }
  }, [])

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (socket) {
      socket.close()
      setSocket(null)
      setIsConnected(false)
      setSessionId(null)
    }
  }, [socket])

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.close()
      }
    }
  }, [socket])

  const value: SocketContextType = {
    isConnected,
    sessionId,
    messages,
    sendMessage,
    createSession,
    connectToSession,
    disconnect,
    clearMessages
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}
