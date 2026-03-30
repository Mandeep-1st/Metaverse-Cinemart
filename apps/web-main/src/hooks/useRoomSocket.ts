import { useEffect, useMemo, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  likes: number;
  createdAt: number;
};

type VoteState = {
  optionId: string;
  label: string;
  count: number;
};

const defaultWsUrl = "ws://localhost:8000";

export function useRoomSocket(roomId: string | null) {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [votes, setVotes] = useState<VoteState[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const wsUrl = import.meta.env.VITE_WS_URL || defaultWsUrl;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.addEventListener("open", () => {
      setConnected(true);
      socket.send(
        JSON.stringify({
          type: "join-room",
          requestId: crypto.randomUUID(),
          data: { roomId },
        }),
      );
    });

    socket.addEventListener("close", () => {
      setConnected(false);
    });

    socket.addEventListener("message", (event) => {
      const payload = JSON.parse(event.data);

      if (payload.type === "room-bootstrap") {
        setMessages(payload.data?.chatMessages || []);
        setVotes(payload.data?.voteState || []);
      }

      if (payload.type === "chat-message") {
        setMessages((previous) => [...previous, payload.data]);
      }

      if (payload.type === "chat-message-liked") {
        setMessages((previous) =>
          previous.map((message) =>
            message.id === payload.data.messageId
              ? { ...message, likes: payload.data.likes }
              : message,
          ),
        );
      }

      if (payload.type === "vote-state") {
        setVotes(payload.data || []);
      }
    });

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [roomId]);

  const api = useMemo(
    () => ({
      connected,
      messages,
      votes,
      sendMessage: (text: string, senderId: string, senderName: string) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
          return;
        }

        socketRef.current.send(
          JSON.stringify({
            type: "chat-send",
            data: {
              text,
              senderId,
              senderName,
            },
          }),
        );
      },
      toggleLike: (messageId: string, senderId: string) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
          return;
        }

        socketRef.current.send(
          JSON.stringify({
            type: "chat-like",
            data: {
              messageId,
              senderId,
            },
          }),
        );
      },
      submitVote: (optionId: string, label: string) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
          return;
        }

        socketRef.current.send(
          JSON.stringify({
            type: "vote-submit",
            data: {
              optionId,
              label,
            },
          }),
        );
      },
    }),
    [connected, messages, votes],
  );

  return api;
}
