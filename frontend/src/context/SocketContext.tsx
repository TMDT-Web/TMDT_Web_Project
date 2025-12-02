/* FIXED SocketContext.tsx – One-session-per-user, no guest, no duplicates */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";

interface ChatMessage {
  id?: number;
  sender: "user" | "admin";
  sender_id?: number;
  message: string;
  created_at?: string;
  timestamp?: Date;
}

interface SocketContextType {
  isConnected: boolean;
  sessionId: string | null;
  messages: ChatMessage[];
  sendMessage: (
    content: string,
    sender: "user" | "admin",
    senderId?: number
  ) => void;
  createSession: () => Promise<string>;
  connectToSession: (sessionId: string) => void;
  disconnect: () => void;
  clearMessages: () => void;
  isWidgetOpen: boolean;
  toggleWidget: (isOpen: boolean) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  const toggleWidget = useCallback((isOpen: boolean) => {
    setIsWidgetOpen(isOpen);
  }, []);

  const getWsUrl = (sessionId: string) => {
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    let wsHost: string;
    if (import.meta.env.VITE_WS_URL) {
      wsHost = import.meta.env.VITE_WS_URL.replace(/^(ws:\/\/|wss:\/\/)/, "");
    } else {
      wsHost = `${window.location.hostname}:8000`;
    }

    return `${wsProtocol}//${wsHost}/api/v1/chat/ws/${sessionId}`;
  };

  const connectToSession = useCallback(
    async (newSessionId: string) => {
      if (!newSessionId) return;

      if (socket) socket.close();

      try {
        const { ChatService } = await import("@/client");
        const history =
          await ChatService.getSessionMessagesApiV1ChatSessionsSessionIdMessagesGet(
            newSessionId
          );

        setMessages(
          history.map((m: any) => ({
            id: m.id,
            sender: m.sender,
            sender_id: m.sender_id,
            message: m.message,
            created_at: m.created_at,
            timestamp: new Date(m.created_at),
          }))
        );
      } catch (err) {
        console.error("Failed to load history", err);
      }

      const wsUrl = getWsUrl(newSessionId);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        setSessionId(newSessionId);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "system") return;
          if (data.type === "error") {
            console.error("[WS ERROR]", data.message);
            return;
          }

          const msg: ChatMessage = {
            id: data.id,
            sender: data.sender,
            sender_id: data.sender_id,
            message: data.message,
            created_at: data.created_at,
            timestamp: new Date(data.created_at),
          };

          setMessages((prev) => {
            const withoutOptimistic = prev.filter(
              (m) =>
                !(
                  m.id &&
                  m.id < 0 &&
                  m.message === msg.message &&
                  m.sender === msg.sender
                )
            );

            if (msg.id && withoutOptimistic.some((m) => m.id === msg.id)) {
              return withoutOptimistic;
            }

            return [...withoutOptimistic, msg];
          });
        } catch (e) {
          console.error("WS parse error", e);
        }
      };

      ws.onerror = () => setIsConnected(false);

      ws.onclose = () => {
        setIsConnected(false);
        setSessionId(null);
      };

      setSocket(ws);
    },
    [socket]
  );

  const sendMessage = useCallback(
    (content: string, sender: "user" | "admin", senderId?: number) => {
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      if (!content.trim()) return;

      const actualSenderId = senderId || user?.id || 0;

      const optimistic: ChatMessage = {
        id: -Date.now(),
        sender,
        sender_id: actualSenderId,
        message: content,
        created_at: new Date().toISOString(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, optimistic]);

      socket.send(
        JSON.stringify({
          sender,
          sender_id: actualSenderId,
          message: content,
        })
      );
    },
    [socket, user]
  );

  const createSession = useCallback(async (): Promise<string> => {
    const { ChatService } = await import("@/client");
    const session = await ChatService.createChatSessionApiV1ChatSessionsPost();
    return session.session_id;
  }, []);

  const disconnect = useCallback(() => {
    if (socket) socket.close();
    setSocket(null);
    setIsConnected(false);
    setSessionId(null);
  }, [socket]);

  const clearMessages = useCallback(() => setMessages([]), []);

  useEffect(() => {
    return () => {
      if (socket) socket.close();
    };
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        sessionId,
        messages,
        sendMessage,
        createSession,
        connectToSession,
        disconnect,
        clearMessages,
        isWidgetOpen,
        toggleWidget,
      }}
    >
      {children}
      {/* Import ChatWidget dynamically to show on all pages */}
      {typeof window !== 'undefined' && (
        <ChatWidgetWrapper />
      )}
    </SocketContext.Provider>
  );
}

// Lazy load ChatWidget to avoid circular dependencies
function ChatWidgetWrapper() {
  const [ChatWidget, setChatWidget] = useState<any>(null);
  
  useEffect(() => {
    import('../components/ChatWidget').then((module) => {
      setChatWidget(() => module.default);
    });
  }, []);
  
  if (!ChatWidget) return null;
  return <ChatWidget />;
}
