import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Play, WandSparkles, Users, ThumbsUp, Link2 } from "lucide-react";
import LoadingScreen from "../components/common/LoadingScreen";
import { useAuth } from "../context/AuthContext";
import { useRoomSocket } from "../hooks/useRoomSocket";
import { apiGet, apiPost } from "../utils/apiClient";

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
    logo?: string | null;
  };
  video?: {
    url: string;
    key: string;
    site: string;
  };
  genres?: Array<{ id: number; name: string }>;
  credits?: {
    cast?: Array<{ id: number; name: string; character: string }>;
    crew?: Array<{ id: number; name: string; job: string }>;
  };
  details?: {
    release_date?: string;
    runtime?: number;
  };
  metrics?: {
    vote_average?: number;
  };
};

type RelatedMovie = {
  tmdb_id: number;
  title: string;
  overview?: string;
  images?: {
    poster?: string | null;
    backdrop?: string | null;
  };
};

type RoomLookup = {
  roomId: string;
  movieTmdbId: number;
  shareLink: string;
  aiMode: boolean;
};

const webRoomUrl = import.meta.env.VITE_WEB_ROOM_URL || "http://localhost:5174";

const toEmbedUrl = (url?: string) => {
  if (!url) return "";
  if (!url.startsWith("http")) return `https://www.youtube.com/embed/${url}`;
  const parsed = new URL(url);
  const key = parsed.searchParams.get("v");
  return key ? `https://www.youtube.com/embed/${key}?autoplay=1` : url;
};

export default function MovieInfo() {
  const navigate = useNavigate();
  const { movieId } = useParams();
  const { user, loading } = useAuth();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [relatedMovies, setRelatedMovies] = useState<RelatedMovie[]>([]);
  const [busy, setBusy] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [actionStatus, setActionStatus] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const numericMovieId = useMemo(() => Number(movieId), [movieId]);
  const lobbyRoomId = Number.isFinite(numericMovieId)
    ? `movie-lobby-${numericMovieId}`
    : null;
  const roomSocket = useRoomSocket(lobbyRoomId);

  useEffect(() => {
    if (!Number.isFinite(numericMovieId) || !user) return;

    const run = async () => {
      setBusy(true);
      try {
        const [movieResponse, relatedResponse] = await Promise.all([
          apiGet<ApiResponse<MovieDetails>>(`/movies/${numericMovieId}`),
          apiGet<ApiResponse<RelatedMovie[]>>(`/movies/${numericMovieId}/related`),
        ]);

        setMovie(movieResponse.data);
        setRelatedMovies(relatedResponse.data);

        apiPost("/movies/whenclicked", {
          username: user.username,
          movie: numericMovieId,
        }).catch(() => {});
      } finally {
        setBusy(false);
      }
    };

    run();
  }, [numericMovieId, user]);

  const createRoom = async (aiMode: boolean) => {
    if (!movie) return;

    setActionStatus(aiMode ? "Creating AI room..." : "Creating room...");

    try {
      const response = await apiPost<
        ApiResponse<{ room: RoomLookup; shareLink: string }>
      >("/rooms", {
        movieId: movie.tmdb_id,
        label: aiMode ? `${movie.title} AI Room` : `${movie.title} Watch Party`,
        aiMode,
        visibility: "private",
        maxParticipants: 8,
      });

      window.location.assign(response.data.shareLink);
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : "Room creation failed.");
    }
  };

  const joinRoom = async () => {
    if (!joinCode.trim()) return;

    setActionStatus("Checking room...");

    try {
      const response = await apiGet<ApiResponse<RoomLookup>>(`/rooms/${joinCode.trim()}`);
      window.location.assign(response.data.shareLink);
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : "Room not found.");
    }
  };

  if (loading || busy || !user || !movie) {
    return <LoadingScreen label="Loading movie hub..." />;
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <div className="relative h-[58vh] overflow-hidden">
        <img
          src={
            movie.images?.backdrop ||
            "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=2072&auto=format&fit=crop"
          }
          alt={movie.title}
          className="h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/65 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
        <button
          onClick={() => navigate("/home")}
          className="absolute top-8 left-8 z-20 rounded-full border border-border/20 bg-background/60 px-5 py-3 text-[10px] font-black uppercase tracking-[0.35em]"
        >
          Back Home
        </button>
      </div>

      <div className="relative z-10 mx-auto -mt-40 max-w-7xl px-6 pb-24">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-8">
            <div className="rounded-[var(--radius)] border border-border/20 bg-card/30 p-6 backdrop-blur-xl">
              <div className="text-primary text-[10px] font-black uppercase tracking-[0.45em]">
                Movie Module
              </div>
              <h1 className="mt-4 text-4xl md:text-6xl font-black italic uppercase tracking-tighter">
                {movie.title}
              </h1>
              <p className="mt-5 max-w-3xl text-muted-foreground text-lg leading-relaxed">
                {movie.overview}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {(movie.genres || []).slice(0, 5).map((genre) => (
                  <span
                    key={genre.id}
                    className="rounded-full border border-border/20 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-muted-foreground"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[var(--radius)] border border-border/20 bg-black shadow-2xl">
              <iframe
                title={movie.title}
                src={toEmbedUrl(movie.video?.url)}
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                className="aspect-video w-full"
              />
            </div>

            <div className="rounded-[var(--radius)] border border-border/20 bg-card/20 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-primary text-[10px] font-black uppercase tracking-[0.45em]">
                    Recommendation Shelf
                  </div>
                  <h2 className="mt-3 text-2xl font-black italic">What to watch next</h2>
                </div>
                <div className="rounded-full border border-border/20 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                  Live votes {roomSocket.votes.reduce((sum, vote) => sum + vote.count, 0)}
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {relatedMovies.map((relatedMovie) => {
                  const voteCount =
                    roomSocket.votes.find(
                      (vote) => vote.optionId === String(relatedMovie.tmdb_id),
                    )?.count || 0;

                  return (
                    <div
                      key={relatedMovie.tmdb_id}
                      className="rounded-3xl border border-border/20 bg-background/30 overflow-hidden"
                    >
                      <img
                        src={
                          relatedMovie.images?.poster ||
                          relatedMovie.images?.backdrop ||
                          "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=900&auto=format&fit=crop"
                        }
                        alt={relatedMovie.title}
                        className="h-56 w-full object-cover"
                      />
                      <div className="p-4">
                        <div className="font-black text-lg">{relatedMovie.title}</div>
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                          {relatedMovie.overview}
                        </p>
                        <div className="mt-4 flex gap-3">
                          <button
                            onClick={() => navigate(`/movies/${relatedMovie.tmdb_id}`)}
                            className="rounded-full border border-border/20 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em]"
                          >
                            Open
                          </button>
                          <button
                            onClick={() =>
                              roomSocket.submitVote(
                                String(relatedMovie.tmdb_id),
                                relatedMovie.title,
                              )
                            }
                            className="rounded-full bg-primary px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary-foreground"
                          >
                            Vote {voteCount > 0 ? `(${voteCount})` : ""}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[var(--radius)] border border-border/20 bg-card/30 p-6 backdrop-blur-xl">
              <div className="text-primary text-[10px] font-black uppercase tracking-[0.45em]">
                Actions
              </div>
              <div className="mt-5 grid gap-3">
                <button
                  onClick={() => createRoom(false)}
                  className="flex items-center justify-center gap-3 rounded-full bg-primary px-5 py-4 text-[10px] font-black uppercase tracking-[0.35em] text-primary-foreground"
                >
                  <Play className="h-4 w-4" />
                  Create Room
                </button>
                <button
                  onClick={() => createRoom(true)}
                  className="flex items-center justify-center gap-3 rounded-full border border-border/20 px-5 py-4 text-[10px] font-black uppercase tracking-[0.35em]"
                >
                  <WandSparkles className="h-4 w-4 text-primary" />
                  AI Room
                </button>
              </div>

              <div className="mt-6 rounded-3xl border border-border/20 bg-background/30 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.35em] text-muted-foreground">
                  Join Room
                </div>
                <div className="mt-3 flex gap-3">
                  <input
                    value={joinCode}
                    onChange={(event) => setJoinCode(event.target.value)}
                    placeholder="Paste room id"
                    className="flex-1 rounded-full border border-border/20 bg-card/30 px-4 py-3 outline-none"
                  />
                  <button
                    onClick={joinRoom}
                    className="rounded-full bg-foreground px-4 py-3 text-background text-[10px] font-black uppercase tracking-[0.3em]"
                  >
                    Join
                  </button>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(`${webRoomUrl}/?movieId=${movie.tmdb_id}`)}
                  className="mt-3 flex items-center gap-2 text-sm text-primary"
                >
                  <Link2 className="h-4 w-4" />
                  Copy direct movie room base link
                </button>
              </div>

              {actionStatus && <div className="mt-4 text-sm text-muted-foreground">{actionStatus}</div>}
            </div>

            <div className="rounded-[var(--radius)] border border-border/20 bg-card/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-primary text-[10px] font-black uppercase tracking-[0.45em]">
                    Real-time Chat
                  </div>
                  <h2 className="mt-3 text-2xl font-black italic">Movie lounge</h2>
                </div>
                <div className="rounded-full border border-border/20 px-3 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                  {roomSocket.connected ? "Live" : "Connecting"}
                </div>
              </div>

              <div className="mt-6 space-y-4 max-h-[420px] overflow-y-auto pr-2">
                {roomSocket.messages.map((message) => (
                  <div
                    key={message.id}
                    className="rounded-3xl border border-border/20 bg-background/40 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-black">{message.senderName}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                      {message.text}
                    </p>
                    <button
                      onClick={() => roomSocket.toggleLike(message.id, user._id)}
                      className="mt-4 flex items-center gap-2 text-sm text-primary"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      {message.likes}
                    </button>
                  </div>
                ))}

                {roomSocket.messages.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-border/30 p-6 text-sm text-muted-foreground">
                    Be the first person to start the movie conversation.
                  </div>
                )}
              </div>

              <div className="mt-5 flex gap-3">
                <input
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder="Say something about the movie..."
                  className="flex-1 rounded-full border border-border/20 bg-background/30 px-4 py-3 outline-none"
                />
                <button
                  onClick={() => {
                    if (!chatInput.trim()) return;
                    roomSocket.sendMessage(chatInput.trim(), user._id, user.fullName);
                    setChatInput("");
                  }}
                  className="rounded-full bg-primary px-5 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary-foreground"
                >
                  <Users className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
