import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Bot, Link2, Play } from "lucide-react";
import { MovieRichDetails } from "@repo/ui/components/movie-rich-details";
import { PersistentCommentsPanel } from "@repo/ui/components/persistent-comments-panel";
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

type MoviePerson = {
  id: number;
  name: string;
  character?: string;
  job?: string;
  profile_path?: string | null;
  order?: number;
};

type MovieVideo = {
  url: string;
  key: string;
  site: string;
  embedUrl?: string;
  name?: string;
  type?: string;
  official?: boolean;
  published_at?: string;
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
  video?: MovieVideo;
  videos?: MovieVideo[];
  genres?: Array<{ id: number; name: string }>;
  credits?: {
    cast?: MoviePerson[];
    crew?: MoviePerson[];
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

type MovieComment = {
  _id: string;
  username: string;
  fullName: string;
  avatar?: string;
  profilePhoto?: string;
  text: string;
  createdAt: string;
};

const webRoomUrl = import.meta.env.VITE_WEB_ROOM_URL || "http://localhost:5174";

const toEmbedUrl = (video?: MovieVideo | null) => {
  if (!video) return "";

  if (video.embedUrl) {
    const parsed = new URL(video.embedUrl);
    parsed.searchParams.set("autoplay", "1");
    return parsed.toString();
  }

  if (!video.url) return "";

  if (!video.url.startsWith("http")) {
    return `https://www.youtube.com/embed/${video.url}?autoplay=1`;
  }

  const parsed = new URL(video.url);

  if (parsed.hostname.includes("youtube.com")) {
    if (parsed.pathname.includes("/embed/")) {
      parsed.searchParams.set("autoplay", "1");
      return parsed.toString();
    }

    const key = parsed.searchParams.get("v");
    return key ? `https://www.youtube.com/embed/${key}?autoplay=1` : video.url;
  }

  if (parsed.hostname.includes("youtu.be")) {
    return `https://www.youtube.com/embed/${parsed.pathname.replace("/", "")}?autoplay=1`;
  }

  if (
    parsed.hostname.includes("vimeo.com") &&
    !parsed.hostname.includes("player.")
  ) {
    return `https://player.vimeo.com/video/${parsed.pathname.replace("/", "")}?autoplay=1`;
  }

  if (parsed.hostname.includes("player.vimeo.com")) {
    parsed.searchParams.set("autoplay", "1");
    return parsed.toString();
  }

  return video.url;
};

export default function MovieInfo() {
  const navigate = useNavigate();
  const { movieId } = useParams();
  const { user, loading } = useAuth();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [relatedMovies, setRelatedMovies] = useState<RelatedMovie[]>([]);
  const [comments, setComments] = useState<MovieComment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [busy, setBusy] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentStatus, setCommentStatus] = useState("");
  const [actionStatus, setActionStatus] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [selectedVideoKey, setSelectedVideoKey] = useState<string | null>(null);

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
          apiGet<ApiResponse<RelatedMovie[]>>(
            `/movies/${numericMovieId}/related`,
          ),
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

  useEffect(() => {
    if (!Number.isFinite(numericMovieId)) return;

    const loadComments = async () => {
      setCommentsLoading(true);
      try {
        const response = await apiGet<ApiResponse<MovieComment[]>>(
          `/movies/${numericMovieId}/comments`,
        );
        setComments(response.data);
      } catch {
        setComments([]);
      } finally {
        setCommentsLoading(false);
      }
    };

    loadComments();
  }, [numericMovieId]);

  const createRoom = async () => {
    if (!movie) return;

    setActionStatus("Creating room...");

    try {
      const response = await apiPost<
        ApiResponse<{ room: RoomLookup; shareLink: string }>
      >("/rooms", {
        movieId: movie.tmdb_id,
        label: `${movie.title} Watch Party`,
        aiMode: false,
        visibility: "private",
        maxParticipants: 8,
      });

      window.location.assign(response.data.shareLink);
    } catch (error) {
      setActionStatus(
        error instanceof Error ? error.message : "Room creation failed.",
      );
    }
  };

  const joinRoom = async () => {
    if (!joinCode.trim()) return;

    setActionStatus("Checking room...");

    try {
      const response = await apiGet<ApiResponse<RoomLookup>>(
        `/rooms/${joinCode.trim()}`,
      );
      window.location.assign(response.data.shareLink);
    } catch (error) {
      setActionStatus(
        error instanceof Error ? error.message : "Room not found.",
      );
    }
  };

  const submitComment = async () => {
    if (!commentInput.trim() || !Number.isFinite(numericMovieId)) return;

    setCommentSubmitting(true);
    setCommentStatus("");

    try {
      const response = await apiPost<ApiResponse<MovieComment>>(
        `/movies/${numericMovieId}/comments`,
        {
          text: commentInput.trim(),
        },
      );
      setComments((previous) => [response.data, ...previous]);
      setCommentInput("");
    } catch (error) {
      setCommentStatus(
        error instanceof Error ? error.message : "Comment creation failed.",
      );
    } finally {
      setCommentSubmitting(false);
    }
  };

  const actors = useMemo(
    () =>
      (movie?.credits?.cast || [])
        .slice()
        .sort((left, right) => (left.order || 0) - (right.order || 0))
        .slice(0, 5)
        .map((actor) => ({
          id: actor.id,
          name: actor.name,
          subtitle: actor.character || "Cast",
          image: actor.profile_path,
        })),
    [movie],
  );

  const director = useMemo(() => {
    const nextDirector = (movie?.credits?.crew || []).find(
      (crewMember) => crewMember.job === "Director",
    );

    if (!nextDirector) return null;

    return {
      id: nextDirector.id,
      name: nextDirector.name,
      subtitle: "Director",
      image: nextDirector.profile_path,
    };
  }, [movie]);

  const availableVideos = useMemo(() => {
    const rawVideos =
      movie?.videos && movie.videos.length > 0
        ? movie.videos
        : movie?.video
          ? [movie.video]
          : [];

    const deduped = new Map<string, MovieVideo>();

    rawVideos.forEach((video) => {
      if (!video?.key || deduped.has(video.key)) return;
      deduped.set(video.key, video);
    });

    return Array.from(deduped.values());
  }, [movie]);

  useEffect(() => {
    setSelectedVideoKey(movie?.video?.key ?? null);
  }, [movie?.tmdb_id, movie?.video?.key]);

  const selectedVideo = useMemo(
    () =>
      availableVideos.find((video) => video.key === selectedVideoKey) || null,
    [availableVideos, selectedVideoKey],
  );

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
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/45 to-transparent" />
        <button
          onClick={() => navigate("/home")}
          className="absolute left-8 top-8 z-20 rounded-full border border-border/20 bg-background/60 px-5 py-3 text-[10px] font-black uppercase tracking-[0.35em]"
        >
          Back Home
        </button>
      </div>

      <div className="relative z-10 mx-auto -mt-40 max-w-7xl px-6 pb-24">
        <div className="grid items-start gap-8 xl:grid-cols-[1.08fr_0.8fr]">
          <div className="min-w-0 space-y-8">
            <MovieRichDetails
              title={movie.title}
              overview={movie.overview}
              genres={(movie.genres || []).map((genre) => genre.name)}
              releaseDate={movie.details?.release_date}
              rating={movie.metrics?.vote_average}
              runtime={movie.details?.runtime}
              director={director}
              actors={actors}
              poster={movie.images?.poster}
            />
          </div>

          <div className="space-y-6">
            <div className="rounded-[var(--radius)] border border-border/20 bg-card/30 p-6 backdrop-blur-xl">
              <div className="text-primary text-[10px] font-black uppercase tracking-[0.45em]">
                Actions
              </div>
              <div className="mt-5 grid gap-3">
                <button
                  onClick={createRoom}
                  className="flex items-center justify-center gap-3 rounded-full bg-primary px-5 py-4 text-[10px] font-black uppercase tracking-[0.35em] text-primary-foreground"
                >
                  <Play className="h-4 w-4" />
                  Create Room
                </button>
                <button
                  onClick={() => navigate(`/movies/${movie.tmdb_id}/ai`)}
                  className="flex items-center justify-center gap-3 rounded-full border border-border/20 px-5 py-4 text-[10px] font-black uppercase tracking-[0.35em]"
                >
                  <Bot className="h-4 w-4 text-primary" />
                  Open AI Page
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
                    className="rounded-full bg-foreground px-4 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-background"
                  >
                    Join
                  </button>
                </div>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(
                      `${webRoomUrl}/?movieId=${movie.tmdb_id}`,
                    )
                  }
                  className="mt-3 flex items-center gap-2 text-sm text-primary"
                >
                  <Link2 className="h-4 w-4" />
                  Copy direct movie room base link
                </button>
              </div>

              {actionStatus && (
                <div className="mt-4 text-sm text-muted-foreground">
                  {actionStatus}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[var(--radius)] border border-border/20 bg-card/25 p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-primary text-[10px] font-black uppercase tracking-[0.45em]">
                Videos
              </div>
              <h2 className="mt-3 text-2xl font-black italic">
                Watch the available clips
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
                If TMDB marks an explicit trailer, it opens here automatically.
                Otherwise, choose the video you want instead of relying on an
                inaccurate default.
              </p>
            </div>
            <div className="rounded-full border border-border/20 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
              {availableVideos.length} available
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[32px] border border-border/20 bg-black shadow-2xl">
            {selectedVideo ? (
              <iframe
                key={selectedVideo.key}
                title={`${movie.title} - ${selectedVideo.name || selectedVideo.type || "video"}`}
                src={toEmbedUrl(selectedVideo)}
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                className="aspect-video w-full"
              />
            ) : availableVideos.length > 0 ? (
              <div className="flex aspect-video items-center justify-center bg-black/80 px-6 text-center">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">
                    No automatic trailer selected
                  </div>
                  <div className="mt-4 text-2xl font-black italic text-white">
                    Choose a video below
                  </div>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-white/60">
                    This movie has video results, but none were explicitly tagged
                    as a trailer. Pick the clip you want to play.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex aspect-video items-center justify-center bg-black/80 px-6 text-center text-sm leading-7 text-white/60">
                No playable videos are available for this title yet.
              </div>
            )}
          </div>

          {availableVideos.length > 0 && (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {availableVideos.map((video, index) => {
                const isSelected = video.key === selectedVideoKey;

                return (
                  <button
                    key={video.key}
                    type="button"
                    onClick={() => setSelectedVideoKey(video.key)}
                    className={`rounded-[28px] border p-4 text-left transition-all ${
                      isSelected
                        ? "border-primary/60 bg-primary/10 shadow-[0_18px_50px_rgba(244,182,61,0.12)]"
                        : "border-border/20 bg-background/35 hover:border-border/40"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-border/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-primary">
                        {video.type || "Video"}
                      </span>
                      {video.official && (
                        <span className="rounded-full border border-border/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-muted-foreground">
                          Official
                        </span>
                      )}
                    </div>
                    <div className="mt-4 text-lg font-black leading-6 text-white">
                      {video.name || `${movie.title} clip ${index + 1}`}
                    </div>
                    <div className="mt-2 text-sm leading-6 text-muted-foreground">
                      {video.site}
                      {video.published_at
                        ? ` • ${new Date(video.published_at).getFullYear()}`
                        : ""}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8 grid items-start gap-8 xl:grid-cols-[1.04fr_0.82fr]">
          <div className="min-w-0">
            <PersistentCommentsPanel
              comments={comments}
              input={commentInput}
              onInputChange={setCommentInput}
              onSubmit={submitComment}
              submitting={commentSubmitting}
              commentsClassName="max-h-[780px] overflow-y-auto pr-1"
              currentUser={{
                username: user.username,
                fullName: user.fullName,
                avatar: user.avatar,
                profilePhoto: user.profilePhoto,
              }}
              title="Movie discussion"
              subtitle="Persistent comments tied to this movie. This is stored discussion, not live room chat."
              emptyMessage={
                commentsLoading
                  ? "Loading comments..."
                  : "No comments yet. Start the discussion."
              }
            />
            {commentStatus && (
              <div className="mt-4 text-sm text-amber-200">{commentStatus}</div>
            )}
          </div>

          <div className="min-w-0 xl:sticky xl:top-6">
            <div className="rounded-[var(--radius)] border border-border/20 bg-card/20 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-primary text-[10px] font-black uppercase tracking-[0.45em]">
                    Recommendation Shelf
                  </div>
                  <h2 className="mt-3 text-2xl font-black italic">
                    What to watch next
                  </h2>
                </div>
                <div className="rounded-full border border-border/20 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                  Live votes{" "}
                  {roomSocket.votes.reduce((sum, vote) => sum + vote.count, 0)}
                </div>
              </div>

              <div className="mt-6 max-h-[780px] space-y-4 overflow-y-auto pr-1">
                {relatedMovies.map((relatedMovie) => {
                  const voteCount =
                    roomSocket.votes.find(
                      (vote) => vote.optionId === String(relatedMovie.tmdb_id),
                    )?.count || 0;

                  return (
                    <div
                      key={relatedMovie.tmdb_id}
                      className="overflow-hidden rounded-3xl border border-border/20 bg-background/30"
                    >
                      <div className="grid gap-0 md:grid-cols-[120px_1fr]">
                        <img
                          src={
                            relatedMovie.images?.poster ||
                            relatedMovie.images?.backdrop ||
                            "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=900&auto=format&fit=crop"
                          }
                          alt={relatedMovie.title}
                          className="h-full min-h-40 w-full object-cover"
                        />
                        <div className="p-4">
                          <div className="text-lg font-black leading-6 text-white">
                            {relatedMovie.title}
                          </div>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground line-clamp-3">
                            {relatedMovie.overview}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-3">
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
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
