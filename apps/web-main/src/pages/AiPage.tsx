import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Bot, ChevronLeft } from "lucide-react";
import { AiModePanel, type AiModeId } from "@repo/ui/components/ai-mode-panel";
import LoadingScreen from "../components/common/LoadingScreen";
import { useAuth } from "../context/AuthContext";
import { apiGet, apiPost } from "../utils/apiClient";
import { toast } from "../utils/toast";

type ApiResponse<T> = {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
};

type MovieDetails = {
  tmdb_id: number;
  title: string;
  overview: string;
  images?: {
    poster?: string | null;
    backdrop?: string | null;
  };
};

type AiMessage = {
  role: "user" | "ai";
  content: string;
};

const introByMode: Record<AiModeId, string> = {
  suggest:
    "Tell me what feeling, tone, or element you want to keep from this movie and I will recommend one next watch.",
  context:
    "Ask me anything about this movie, its themes, cast, direction, or story choices.",
  chat:
    "Start a simple movie conversation, ask for a genre pick, or just chat casually.",
};

export default function AiPage() {
  const navigate = useNavigate();
  const { movieId } = useParams();
  const { user, loading } = useAuth();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [busy, setBusy] = useState(true);
  const [selectedMode, setSelectedMode] = useState<AiModeId | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      role: "ai",
      content:
        "Choose one of the three AI modes below and I will adapt to that style of help.",
    },
  ]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  const numericMovieId = useMemo(() => Number(movieId), [movieId]);

  useEffect(() => {
    if (!Number.isFinite(numericMovieId) || !user) return;

    const loadMovie = async () => {
      setBusy(true);
      try {
        const response = await apiGet<ApiResponse<MovieDetails>>(
          `/movies/${numericMovieId}`,
        );
        setMovie(response.data);
      } finally {
        setBusy(false);
      }
    };

    loadMovie();
  }, [numericMovieId, user]);

  const handleModeSelect = (mode: AiModeId) => {
    setSelectedMode(mode);
    setInput("");
    setStatus("");
    setMessages([
      {
        role: "ai",
        content: introByMode[mode],
      },
    ]);
  };

  const handleSubmit = async () => {
    if (!selectedMode) {
      toast.info("Pick an AI mode before sending a prompt.");
      return;
    }

    if (!input.trim()) {
      toast.info("Enter a prompt for the AI assistant.");
      return;
    }

    if (!Number.isFinite(numericMovieId)) {
      toast.error("We couldn't load this movie for AI right now.");
      return;
    }

    const prompt = input.trim();
    setSending(true);
    setStatus("");
    setInput("");
    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: prompt,
      },
    ]);

    try {
      let nextMessage = "The AI did not return a response.";

      if (selectedMode === "suggest") {
        const response = await apiPost<
          ApiResponse<{ movieTitle?: string; reason?: string }>
        >("/ai/suggest", {
          movieId: numericMovieId,
          feedback: prompt,
        });
        nextMessage = response.data.movieTitle
          ? `${response.data.movieTitle}\n\n${response.data.reason || ""}`.trim()
          : response.message;
      } else if (selectedMode === "context") {
        const response = await apiPost<ApiResponse<{ content?: string }>>(
          "/ai/context-chat",
          {
            movieId: numericMovieId,
            question: prompt,
          },
        );
        nextMessage = response.data.content || response.message;
      } else {
        const response = await apiPost<ApiResponse<{ content?: string }>>(
          "/ai/chat",
          {
            message: prompt,
          },
        );
        nextMessage = response.data.content || response.message;
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "ai",
          content: nextMessage,
        },
      ]);
    } catch {
      setStatus("");
    } finally {
      setSending(false);
    }
  };

  if (loading || busy || !user || !movie) {
    return <LoadingScreen label="Opening the AI desk..." />;
  }

  return (
    <div className="dark relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0">
        <img
          src={
            movie.images?.backdrop ||
            "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?q=80&w=1800&auto=format&fit=crop"
          }
          alt={movie.title}
          className="h-full w-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(244,182,61,0.18),_transparent_35%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/85 to-background" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-10 md:px-10">
        <button
          onClick={() => navigate(`/movies/${movie.tmdb_id}`)}
          className="inline-flex items-center gap-2 rounded-full border border-border/20 bg-background/50 px-5 py-3 text-[10px] font-black uppercase tracking-[0.35em]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back To Movie
        </button>

        <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[36px] border border-white/10 bg-black/35 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.38em] text-primary">
              <Bot className="h-4 w-4" />
              Direct AI Access
            </div>
            <h1 className="mt-4 text-4xl font-black italic tracking-tight md:text-6xl">
              {movie.title}
            </h1>
            <p className="mt-5 text-base leading-8 text-white/65">
              Ask for a follow-up recommendation, dive into the movie itself, or
              just chat naturally. You no longer need to create a room first to
              use the AI flow.
            </p>
            <div className="mt-8 overflow-hidden rounded-[28px] border border-white/10">
              <img
                src={
                  movie.images?.poster ||
                  movie.images?.backdrop ||
                  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop"
                }
                alt={movie.title}
                className="h-[420px] w-full object-cover"
              />
            </div>
          </div>

          <AiModePanel
            title="Choose how the AI should help"
            subtitle={`All three AI behaviors are available for ${movie.title}. Select a mode first, then send your prompt.`}
            selectedMode={selectedMode}
            onSelectMode={handleModeSelect}
            messages={messages}
            input={input}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            loading={sending}
            status={status}
          />
        </div>
      </div>
    </div>
  );
}
