import { useState, useRef, useEffect } from 'react'
import { useSocket } from '@/context/SocketContext'
import { useAuth } from '@/context/AuthContext'

export default function ChatWidget() {
  const { user } = useAuth()
  const {
    sessionId,
    messages,
    isConnected,
    createSession,
    connectToSession,
    sendMessage,
    isWidgetOpen,
    toggleWidget,
  } = useSocket()

  // const [isOpen, setIsOpen] = useState(false) // Removed local state
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isWidgetOpen && user && !sessionId) {
      ; (async () => {
        const newId = await createSession()
        connectToSession(newId)
      })()
    }
  }, [isWidgetOpen, user])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    sendMessage(input.trim(), 'user', user?.id)
    setInput('')
  }

  return (
    <>
      {/* Button mở khung chat */}
      {!isWidgetOpen && (
        <button
          onClick={() => toggleWidget(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-blue-700 transition"
        >
          💬 Chat
        </button>
      )}

      {/* KHUNG CHAT */}
      {isWidgetOpen && (
        <div
          className="fixed bottom-6 right-6 bg-white shadow-2xl rounded-2xl border border-gray-200 flex flex-col"
          style={{ width: 380, height: 520 }}
        >
          {/* HEADER */}
          <div
            className="px-4 py-3 flex justify-between items-center rounded-t-2xl"
            style={{ backgroundColor: '#1E40AF', color: 'white' }}
          >
            <div>
              <p className="font-semibold text-lg">Hỗ trợ khách hàng</p>
              <div className="flex items-center gap-2 text-sm">
                <span
                  className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-400'
                    }`}
                />
                <span>{isConnected ? 'Đã kết nối' : 'Đang kết nối...'}</span>
              </div>
            </div>

            <button
              onClick={() => toggleWidget(false)}
              className="text-white/80 hover:text-white text-xl"
            >
              ✕
            </button>
          </div>

          {/* BODY */}
          <div
            className="flex-1 overflow-y-auto px-4 py-3"
            style={{ backgroundColor: '#F9FAFB' }}
          >
            {messages.length === 0 && (
              <p className="text-gray-500 text-center mt-20">
                Bắt đầu cuộc trò chuyện với chúng tôi nhé!
              </p>
            )}

            {messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={`mb-3 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
              >
                <div
                  className={`px-4 py-2 rounded-xl max-w-[70%] text-sm shadow ${msg.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                >
                  {msg.message}
                  <div className="text-[10px] opacity-70 mt-1">
                    {msg.created_at
                      ? new Date(msg.created_at).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                      : ''}
                  </div>
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT */}
          <div className="p-3 border-t bg-white rounded-b-2xl">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={isConnected ? 'Nhập tin nhắn...' : 'Đang kết nối...'}
                disabled={!isConnected}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!isConnected}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
              >
                Gửi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
