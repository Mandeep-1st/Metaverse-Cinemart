import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import socketService from "../services/SocketService";

type SocketServiceType = typeof socketService;
const SocketContext = createContext<SocketServiceType>(socketService);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Connect using Vite Environment Variable
    const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8000";
    socketService.connect(wsUrl);
    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <div className="flex h-screen items-center justify-center text-white bg-black">
        <h1>Connecting to signaling server...</h1>
      </div>
    );
  }

  return (
    <SocketContext.Provider value={socketService}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketServiceType => useContext(SocketContext);
