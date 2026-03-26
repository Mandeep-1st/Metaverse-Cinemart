import { useState } from "react";

// Placeholder data - later we fetch this from your DB based on movieId
const DUMMY_COMMENTS = [
  {
    id: 1,
    user: "NolanFan99",
    text: "The score by Hans Zimmer in this is absolutely unmatched.",
    time: "2 hours ago",
  },
  {
    id: 2,
    user: "SciFiNerd",
    text: "Visually stunning. I rewatch this every year.",
    time: "5 hours ago",
  },
  {
    id: 3,
    user: "Cinephile_22",
    text: "Can we talk about that docking scene though? Literal chills.",
    time: "1 day ago",
  },
];

export default function CommentsOverlay({
  onClose,
  movieId,
}: {
  onClose: () => void;
  movieId: string;
}) {
  const [newComment, setNewComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    console.log(`Submitting comment for movie ${movieId}:`, newComment);
    setNewComment(""); // Clear input
    // Later: Send POST request to http-server
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-start p-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      {/* Click outside to close (Optional, but good UX) */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* The Comments Panel (Slides in from the left) */}
      <div className="relative w-full max-w-md h-full max-h-[80vh] bg-zinc-900/90 rounded-2xl shadow-2xl overflow-hidden border border-zinc-700/50 flex flex-col animate-in slide-in-from-left-8 duration-300">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-500"
            >
              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
            </svg>
            Community Discussion
          </h2>
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

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {DUMMY_COMMENTS.map((comment) => (
            <div
              key={comment.id}
              className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50"
            >
              <div className="flex items-baseline justify-between mb-2">
                <span className="font-bold text-blue-400 text-sm">
                  {comment.user}
                </span>
                <span className="text-xs text-zinc-500">{comment.time}</span>
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed">
                {comment.text}
              </p>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              className="flex-1 bg-zinc-800 text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-zinc-700"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-lg transition-colors flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
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
