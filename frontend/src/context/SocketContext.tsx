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
    const wsHost = import.meta.env.VITE_WS_URL || 'localhost:8000'
    return `${wsProtocol}//${wsHost}/api/v1/chat/ws/${sessionId}`
  }

  // Connect to WebSocket
  const connectToSession = useCallback((newSessionId: string) => {
    // Disconnect existing connection
    if (socket) {
      socket.close()
    }

    const wsUrl = getWsUrl(newSessionId)
    console.log('[WebSocket] Connecting to:', wsUrl)

    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('[WebSocket] Connected to session:', newSessionId)
      setIsConnected(true)
      setSessionId(newSessionId)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('[WebSocket] Message received:', data)

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

        setMessages(prev => [...prev, newMessage])
      } catch (error) {
        console.error('[WebSocket] Error parsing message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error)
      setIsConnected(false)
    }

    ws.onclose = () => {
      console.log('[WebSocket] Disconnected')
      setIsConnected(false)
      setSessionId(null)
    }

    setSocket(ws)
  }, [socket])

  // Send message through WebSocket
  const sendMessage = useCallback((content: string, sender: 'user' | 'admin', senderId?: number) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error('[WebSocket] Cannot send message: Not connected')
      return
    }

    const actualSenderId = senderId || user?.id || 0
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
