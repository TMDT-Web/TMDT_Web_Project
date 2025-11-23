/**
 * Chat Widget Component
 * Floating chat button with popup chat window - Real WebSocket Integration
 */
import { useState, useEffect, useRef } from 'react'
import { useSocket } from '@/context/SocketContext'
import { useAuth } from '@/context/AuthContext'

interface Message {
  id?: number
  text: string
  sender: 'user' | 'admin'
  timestamp: Date
}

export default function ChatWidget() {
  const { user } = useAuth()
  const { isConnected, sessionId, messages: socketMessages, sendMessage, createSession, connectToSession, clearMessages } = useSocket()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize chat session when widget opens
  useEffect(() => {
    if (isOpen && !isInitialized) {
      initializeChat()
    }
  }, [isOpen])

  // Sync socket messages to local state
  useEffect(() => {
    const formattedMessages: Message[] = (socketMessages || []).map(msg => ({
      id: msg.id,
      text: msg.message,
      sender: msg.sender,
      timestamp: msg.timestamp || new Date(msg.created_at || Date.now())
    }))
    setMessages(formattedMessages)
  }, [socketMessages])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const initializeChat = async () => {
    try {
      // Create or retrieve session
      let currentSessionId = sessionId || localStorage.getItem('chat_session_id')
      
      if (!currentSessionId) {
        currentSessionId = await createSession()
        localStorage.setItem('chat_session_id', currentSessionId)
      }

      // Connect to WebSocket
      connectToSession(currentSessionId)
      setIsInitialized(true)

      // Add welcome message if no messages
      if (messages.length === 0) {
        setMessages([{
          id: 0,
          text: 'Xin chào! Chúng tôi có thể giúp gì cho bạn?',
          sender: 'admin',
          timestamp: new Date()
        }])
      }
    } catch (error) {
      console.error('Failed to initialize chat:', error)
    }
  }

  const handleSend = () => {
    if (!inputMessage.trim() || !isConnected) return

    // Send via WebSocket
    sendMessage(inputMessage.trim(), 'user', user?.id)
    setInputMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white shadow-2xl rounded-lg overflow-hidden z-50 flex flex-col">
          {/* Header */}
          <div className="bg-[rgb(var(--color-deep-green))] text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">LuxeFurniture</h3>
                <p className="text-xs text-white/80">
                  {isConnected ? '🟢 Trực tuyến' : '⚫ Đang kết nối...'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-[rgb(var(--color-primary))] text-white'
                      : 'bg-white text-gray-800'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                    {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-[rgb(var(--color-primary))] text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!isConnected}
                className="w-10 h-10 bg-[rgb(var(--color-primary))] text-white rounded-full flex items-center justify-center hover:bg-[rgb(var(--color-wood))] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[rgb(var(--color-deep-green))] text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 z-50 flex items-center justify-center"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            {/* Notification dot */}
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></span>
          </>
        )}
      </button>
    </>
  )
}
