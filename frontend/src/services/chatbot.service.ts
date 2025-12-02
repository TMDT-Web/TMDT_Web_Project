import apiClient from './api';

interface ChatMessage {
  id: number;
  message: string;
  sender: 'user' | 'system' | 'admin';
  created_at: string;
}

interface ChatSession {
  id: number;
  session_id: string;
  status: string;
  created_at: string;
}

interface ChatSendResponse {
  user_message: ChatMessage;
  bot_message?: ChatMessage;
}

interface ChatHistoryResponse {
  session: ChatSession;
  messages: ChatMessage[];
}

export const chatbotApi = {
  /**
   * Start a new chat session
   */
  async startSession(): Promise<ChatSession> {
    const response = await apiClient.post<ChatSession>('/chatbot/start');
    return response.data;
  },

  /**
   * Send a message and get bot response
   */
  async sendMessage(sessionId: string, message: string): Promise<ChatSendResponse> {
    const response = await apiClient.post<ChatSendResponse>(
      `/chatbot/${sessionId}/messages`,
      { message }
    );
    return response.data;
  },

  /**
   * Get chat history
   */
  async getHistory(sessionId: string): Promise<ChatHistoryResponse> {
    const response = await apiClient.get<ChatHistoryResponse>(
      `/chatbot/${sessionId}/history`
    );
    return response.data;
  },
};
