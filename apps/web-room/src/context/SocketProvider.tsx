import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";

interface SocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  // Keep a ref to prevent unnecessary re-renders during rapid game loops
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const WEBSOCKET_URL =
      import.meta.env.VITE_WEBSOCKET_URL || "ws://localhost:8000";
    let ws: WebSocket;

    // THE FIX: Add a small delay to prevent Strict Mode from spamming connections
    const connectTimeout = setTimeout(() => {
      ws = new WebSocket(WEBSOCKET_URL);

      ws.onopen = () => {
        console.log("✅ Connected to Metaverse Game Server");
        setIsConnected(true);
      };

      ws.onclose = () => {
        console.log("❌ Disconnected from Server");
        setIsConnected(false);
      };

      ws.onerror = (error) => {
        console.error("WebSocket Error:", error);
      };

      socketRef.current = ws;
      setSocket(ws);
    }, 100); // 100ms delay

    return () => {
      clearTimeout(connectTimeout); // Cancel connection if unmounted instantly
      if (ws) {
        ws.close();
      }
      setIsConnected(false);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
