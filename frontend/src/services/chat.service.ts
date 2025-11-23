/**
 * Chat Service
 */
import api from './api'
import { ChatSession, ChatMessage } from '@/types'
import { WS_URL } from '@/constants/config'

export const chatService = {
  async createSession(): Promise<ChatSession> {
    const response = await api.post<ChatSession>('/api/v1/chat/sessions')
    return response.data
  },

  async getMySessions(): Promise<{ sessions: ChatSession[]; total: number }> {
    const response = await api.get<{ sessions: ChatSession[]; total: number }>(
      '/api/v1/chat/sessions/my'
    )
    return response.data
  },

  async getAllSessions(): Promise<{ sessions: ChatSession[]; total: number }> {
    const response = await api.get<{ sessions: ChatSession[]; total: number }>(
      '/api/v1/chat/sessions'
    )
    return response.data
  },

  async closeSession(sessionId: string): Promise<void> {
    await api.post(`/api/v1/chat/sessions/${sessionId}/close`)
  },

  // WebSocket connection
  connectWebSocket(sessionId: string): WebSocket {
    const ws = new WebSocket(`${WS_URL}/api/v1/chat/ws/${sessionId}`)
    return ws
  },
}
