import { useState } from "react";

export default function AiOverlay({
  onClose,
  movieId,
}: {
  onClose: () => void;
  movieId: string;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hello! I'm CineBot. Ask me anything about this movie, its cast, or similar recommendations!",
    },
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const newMessages = [...messages, { role: "user", text: input }];
    setMessages(newMessages);
    setInput("");

    // Mock AI Response (Later: Fetch from your ai-server)
    setTimeout(() => {
      setMessages([
        ...newMessages,
        {
          role: "ai",
          text: `That's a great question about movie #${movieId}. My neural networks are currently in training, but soon I'll connect to the AI Server to answer that properly!`,
        },
      ]);
    }, 1000);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center pb-12 px-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* The AI Panel (Slides up from the BOTTOM) */}
      <div className="relative w-full max-w-2xl h-[600px] max-h-[70vh] bg-zinc-950/95 rounded-2xl shadow-[0_0_40px_rgba(139,92,246,0.15)] overflow-hidden border border-purple-900/50 flex flex-col animate-in slide-in-from-bottom-8 duration-300">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800/50 bg-gradient-to-r from-purple-900/20 to-transparent flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(147,51,234,0.5)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <path d="M12 8V4H8" />
                <rect width="16" height="12" x="4" y="8" rx="2" />
                <path d="M2 14h2" />
                <path d="M20 14h2" />
                <path d="M15 13v2" />
                <path d="M9 13v2" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">
                CineBot AI
              </h2>
              <p className="text-xs text-purple-400">Powered by Gemini</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Chat Log */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar flex flex-col">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-zinc-800 text-zinc-200 border border-zinc-700/50 rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/50">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the movie..."
              className="w-full bg-zinc-950 text-white rounded-xl pl-4 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-zinc-800 shadow-inner"
            />
            <button
              type="submit"
              className="absolute right-2 p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
