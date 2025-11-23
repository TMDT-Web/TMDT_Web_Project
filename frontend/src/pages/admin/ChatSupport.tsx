/**
 * Admin Chat Support - Real-time WebSocket Integration
 */
import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChatService } from '@/client'
import { useSocket } from '@/context/SocketContext'
import { useAuth } from '@/context/AuthContext'

interface ChatSession {
  session_id: string
  user_id: number
  status: string
  created_at: string
  updated_at: string
}

interface Message {
  id?: number
  sender: 'user' | 'admin'
  text: string
  time: string
}

export default function ChatSupport() {
  const { user } = useAuth()
  const { isConnected, sessionId: activeSessionId, messages: socketMessages, sendMessage, connectToSession } = useSocket()
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch all chat sessions (admin only)
  const { data: sessionsData, refetch: refetchSessions } = useQuery({
    queryKey: ['admin-chat-sessions'],
    queryFn: () => ChatService.getAllSessionsApiV1ChatSessionsGet(),
    refetchInterval: 10000 // Refresh every 10 seconds
  })

  const chatSessions: ChatSession[] = sessionsData?.sessions || []

  // Sync socket messages to local state
  useEffect(() => {
    if (activeSessionId === selectedSession) {
      const formattedMessages: Message[] = (socketMessages || []).map(msg => ({
        id: msg.id,
        sender: msg.sender as 'user' | 'admin',
        text: msg.message,
        time: msg.created_at ? new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Now'
      }))
      setMessages(formattedMessages)
    }
  }, [socketMessages, activeSessionId, selectedSession])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle session selection
  const handleSelectSession = (session: ChatSession) => {
    setSelectedSession(session.session_id)
    setMessages([]) // Clear old messages
    connectToSession(session.session_id)
  }

  const currentSession = chatSessions.find(s => s.session_id === selectedSession)

  const handleSendMessage = () => {
    if (!messageInput.trim() || !isConnected || !selectedSession) return

    sendMessage(messageInput.trim(), 'admin', user?.id)
    setMessageInput('')
  }

  const handleCloseSession = async (sessionId: string) => {
    if (!confirm('Đóng cuộc trò chuyện này?')) return

    try {
      await ChatService.closeSessionApiV1ChatSessionsSessionIdClosePost(sessionId)
      refetchSessions()
      if (selectedSession === sessionId) {
        setSelectedSession(null)
        setMessages([])
      }
    } catch (error) {
      console.error('Failed to close session:', error)
      alert('Không thể đóng cuộc trò chuyện')
    }
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-200px)]">
      {/* Chat Sessions List */}
      <div className="w-80 bg-white rounded-lg shadow-sm flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-slate-800">Cuộc trò chuyện</h3>
          <p className="text-sm text-gray-600 mt-1">
            {chatSessions.filter(s => s.status === 'active').length} đang hoạt động
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {chatSessions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>Chưa có cuộc trò chuyện nào</p>
            </div>
          ) : (
            Array.isArray(chatSessions) && chatSessions.map((session) => (
              <div
                key={session.session_id}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedSession === session.session_id ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleSelectSession(session)}
              >
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      👤
                    </div>
                    {session.status === 'active' && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-medium text-slate-800 truncate">
                        User #{session.user_id}
                      </p>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {new Date(session.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      Session: {session.session_id.substring(0, 12)}...
                    </p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${
                      session.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {session.status === 'active' ? 'Hoạt động' : 'Đã đóng'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 bg-white rounded-lg shadow-sm flex flex-col">
        {selectedSession ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    👤
                  </div>
                  {currentSession?.status === 'active' && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">User #{currentSession?.user_id}</p>
                  <p className="text-xs text-gray-500">
                    {isConnected ? '🟢 Đã kết nối' : '⚫ Đang kết nối...'}
                  </p>
                </div>
              </div>
              <button
                className="text-red-600 hover:text-red-700 px-3 py-1.5 text-sm font-medium"
                onClick={() => handleCloseSession(selectedSession)}
              >
                Đóng chat
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <p>Chưa có tin nhắn nào</p>
                  <p className="text-sm mt-1">Bắt đầu cuộc trò chuyện bằng cách gửi tin nhắn</p>
                </div>
              ) : (
                Array.isArray(messages) && messages.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${msg.sender === 'admin' ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          msg.sender === 'admin'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-800'
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 px-1">{msg.time}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={isConnected ? "Nhập tin nhắn..." : "Đang kết nối..."}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={!isConnected}
                />
                <button
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSendMessage}
                  disabled={!isConnected}
                >
                  Gửi
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <p>Chọn một cuộc trò chuyện để bắt đầu</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
