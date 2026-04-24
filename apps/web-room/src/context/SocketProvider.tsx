/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  useRef,
} from "react";
import { config } from "@repo/config";
import socketService from "../services/SocketService";

type SocketServiceType = typeof socketService;
const SocketContext = createContext<SocketServiceType>(socketService);

export const SocketProvider: React.FC<{
  children: ReactNode;
  enabled?: boolean;
}> = ({ children, enabled = true }) => {
  const [isReady, setIsReady] = useState(false);
  const connectTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      socketService.disconnect();
      // Avoid sync setState within effect (React lint rule).
      window.setTimeout(() => setIsReady(false), 0);
      return;
    }

    // CRITICAL: React 18 StrictMode can mount/unmount twice in dev.
    // Debounce the actual connect call and clear it on cleanup to prevent ghost duplicates.
    const readyState = socketService.getReadyState();
    if (readyState !== null) {
      window.setTimeout(() => setIsReady(true), 0);
      return;
    }

    window.setTimeout(() => setIsReady(false), 0);
    connectTimeoutRef.current = window.setTimeout(() => {
      socketService.connect(config.socketUrl);
      setIsReady(true);
    }, 250);

    return () => {
      if (connectTimeoutRef.current) {
        window.clearTimeout(connectTimeoutRef.current);
        connectTimeoutRef.current = null;
      }
      // Do NOT disconnect on cleanup; StrictMode will remount immediately and we don't want reconnect churn.
    };
  }, [enabled]);

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
