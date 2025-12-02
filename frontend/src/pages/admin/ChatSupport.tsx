/**
 * Admin Chat Support - Real-time WebSocket Integration + Search Bar
 */
import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChatService } from '@/client'
import { useSocket } from '@/context/SocketContext'
import { useAuth } from '@/context/AuthContext'
import { useConfirm } from '@/components/ConfirmModal'

interface ChatSession {
  session_id: string
  user_id?: number | null
  username?: string | null
  vip_tier?: string
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
  const { confirm } = useConfirm()
  const {
    isConnected,
    sessionId: activeSessionId,
    messages: socketMessages,
    sendMessage,
    connectToSession,
  } = useSocket()

  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [searchText, setSearchText] = useState('')   // 🔥 SEARCH STATE

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch all chat sessions (admin only)
  const { data: sessionsData, refetch: refetchSessions } = useQuery({
    queryKey: ['admin-chat-sessions'],
    queryFn: () => ChatService.getAllSessionsApiV1ChatSessionsGet(),
    refetchInterval: 10000,
  })

  const chatSessions: ChatSession[] = sessionsData?.sessions || []

  // 🔥 FILTER SESSIONS
  const filteredSessions = chatSessions.filter((s) => {
    if (!searchText.trim()) return true

    const name = s.username?.toLowerCase() || ''
    const id = String(s.user_id)

    return (
      name.includes(searchText.toLowerCase()) ||
      id.includes(searchText)
    )
  })

  useEffect(() => {
    if (activeSessionId && activeSessionId === selectedSession) {
      const formatted: Message[] = socketMessages.map((msg) => ({
        id: msg.id,
        sender: msg.sender as 'user' | 'admin',
        text: msg.message,
        time: new Date(msg.created_at).toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      }))

      setMessages(formatted)
    }
  }, [socketMessages, activeSessionId, selectedSession])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSelectSession = (session: ChatSession) => {
    setSelectedSession(session.session_id)
    setMessages([])
    connectToSession(session.session_id)
  }

  const currentSession = chatSessions.find((s) => s.session_id === selectedSession)

  const handleSendMessage = () => {
    if (!messageInput.trim() || !isConnected || !selectedSession) return
    sendMessage(messageInput.trim(), 'admin', user?.id)
    setMessageInput('')
  }

  const handleCloseSession = async (sessionId: string) => {
    const confirmed = await confirm({
      title: 'Đóng cuộc trò chuyện',
      message: 'Bạn có chắc muốn đóng cuộc trò chuyện này?',
      type: 'warning',
      confirmText: 'Đóng',
      cancelText: 'Hủy'
    })
    if (!confirmed) return
    await ChatService.closeSessionApiV1ChatSessionsSessionIdClosePost({ sessionId })
    refetchSessions()
    if (selectedSession === sessionId) {
      setSelectedSession(null)
      setMessages([])
    }
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-200px)]">

      {/* LEFT PANEL */}
      <div className="w-80 bg-white rounded-lg shadow-sm flex flex-col">

        {/* 🔥 SEARCH BAR */}
        <div className="p-3 border-b bg-gray-50">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Tìm theo tên người dùng..."
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
        </div>

        {/* TITLE */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-slate-800">Cuộc trò chuyện</h3>
          <p className="text-sm text-gray-600 mt-1">
            {chatSessions.filter((s) => s.status === 'active').length} đang hoạt động
          </p>
        </div>

        {/* SESSION LIST */}
        <div className="flex-1 overflow-y-auto">
          {filteredSessions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Không tìm thấy người dùng</div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.session_id}
                onClick={() => handleSelectSession(session)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedSession === session.session_id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    👤
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800 truncate">
                        {session.username || `User #${session.user_id}`}
                      </p>
                      {session.vip_tier && session.vip_tier !== 'member' && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          session.vip_tier === 'diamond' ? 'bg-cyan-100 text-cyan-700' :
                          session.vip_tier === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-200 text-gray-700'
                        }`}>
                          {session.vip_tier === 'diamond' ? '💎' : session.vip_tier === 'gold' ? '🥇' : '🥈'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      Session: {session.session_id.substring(0, 10)}...
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL — CHAT */}
      <div className="flex-1 bg-white rounded-lg shadow-sm flex flex-col">
        {!selectedSession ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Chọn một cuộc trò chuyện để bắt đầu
          </div>
        ) : (
          <>
            {/* HEADER */}
            <div className="p-4 border-b flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  👤
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800">
                      {currentSession?.username || `User #${currentSession?.user_id}`}
                    </p>
                    {currentSession?.vip_tier && currentSession.vip_tier !== 'member' && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        currentSession.vip_tier === 'diamond' ? 'bg-cyan-100 text-cyan-700 border border-cyan-300' :
                        currentSession.vip_tier === 'gold' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                        'bg-gray-200 text-gray-700 border border-gray-400'
                      }`}>
                        {currentSession.vip_tier === 'diamond' ? '💎 Diamond' : currentSession.vip_tier === 'gold' ? '🥇 Gold' : '🥈 Silver'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {isConnected ? '🟢 Đã kết nối' : '⚫ Mất kết nối'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleCloseSession(selectedSession)}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Đóng chat
              </button>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={msg.id || idx}
                  className={`flex ${
                    msg.sender === 'admin' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-2 rounded-lg ${
                      msg.sender === 'admin'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-800'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* INPUT */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  className="flex-1 px-4 py-2 border rounded-lg"
                  value={messageInput}
                  placeholder="Nhập tin nhắn..."
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg"
                >
                  Gửi
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
