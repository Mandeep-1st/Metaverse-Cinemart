import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "../components/common/LoadingScreen";
import { useAuth } from "../context/AuthContext";
import { apiGet, apiPost } from "../utils/apiClient";

type ApiResponse<T> = {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
};

type SearchMovie = {
  tmdb_id: number;
  title: string;
  images?: {
    poster?: string | null;
  };
  metrics?: {
    vote_average?: number;
  };
};

type RoomItem = {
  roomId: string;
  movieTmdbId: number;
  movieTitle: string;
  moviePoster?: string;
  label?: string;
  aiMode: boolean;
  configuration: {
    visibility: "private" | "public";
    maxParticipants: number;
    allowChat: boolean;
    allowVoice: boolean;
    allowVoting: boolean;
  };
  createdAt: string;
  shareLink: string;
};

type CreateRoomResponse = {
  room: RoomItem;
  shareLink: string;
};

export default function RoomsPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [busy, setBusy] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchMovie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<SearchMovie | null>(null);
  const [label, setLabel] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [aiMode, setAiMode] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState(8);
  const [status, setStatus] = useState("");
  const [createdRoom, setCreatedRoom] = useState<CreateRoomResponse | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadRooms = async () => {
      setBusy(true);
      try {
        const response = await apiGet<ApiResponse<RoomItem[]>>("/rooms/mine");
        setRooms(response.data);
      } finally {
        setBusy(false);
      }
    };

    loadRooms();
  }, [user]);

  useEffect(() => {
    if (!showCreate || !query.trim()) {
      setSearchResults([]);
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        const response = await apiGet<ApiResponse<SearchMovie[]>>("/movies/search", {
          query: query.trim(),
        });
        setSearchResults(response.data);
      } catch {
        setSearchResults([]);
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [query, showCreate]);

  const createDisabled = useMemo(
    () => !selectedMovie || !label.trim(),
    [label, selectedMovie],
  );

  const resetCreateState = () => {
    setQuery("");
    setSearchResults([]);
    setSelectedMovie(null);
    setLabel("");
    setVisibility("private");
    setAiMode(false);
    setMaxParticipants(8);
    setStatus("");
    setCreatedRoom(null);
  };

  const handleCreateRoom = async () => {
    if (!selectedMovie) return;

    setStatus("Creating room...");

    try {
      const response = await apiPost<ApiResponse<CreateRoomResponse>>("/rooms", {
        movieId: selectedMovie.tmdb_id,
        label,
        aiMode,
        visibility,
        maxParticipants,
        allowChat: true,
        allowVoice: true,
        allowVoting: true,
      });

      setCreatedRoom(response.data);
      setRooms((previous) => [response.data.room, ...previous]);
      setStatus("Room created successfully.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Room creation failed.");
    }
  };

  if (loading || busy || !user) {
    return <LoadingScreen label="Opening your room dashboard..." />;
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground px-6 py-10 md:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-primary text-[10px] font-black uppercase tracking-[0.45em]">
              Your Rooms
            </div>
            <h1 className="mt-3 text-4xl md:text-6xl font-black uppercase tracking-tighter italic">
              Watch parties you created
            </h1>
            <p className="mt-4 text-muted-foreground max-w-2xl">
              Launch a new room, copy the share link, and send people straight into the synced theatre.
            </p>
          </div>

          <button
            onClick={() => {
              resetCreateState();
              setShowCreate(true);
            }}
            className="rounded-full bg-primary px-8 py-4 text-[10px] font-black uppercase tracking-[0.35em] text-primary-foreground"
          >
            Create Room
          </button>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => (
            <div
              key={room.roomId}
              className="rounded-[var(--radius)] border border-border/20 bg-card/20 overflow-hidden"
            >
              {room.moviePoster && (
                <img
                  src={room.moviePoster}
                  alt={room.movieTitle}
                  className="h-56 w-full object-cover"
                />
              )}
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.35em] text-primary font-black">
                      {room.aiMode ? "AI Room" : "Watch Party"}
                    </div>
                    <h2 className="mt-2 text-2xl font-black italic">{room.label || room.movieTitle}</h2>
                  </div>
                  <span className="rounded-full border border-border/20 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    {room.configuration.visibility}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{room.movieTitle}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={() => window.location.assign(room.shareLink)}
                    className="rounded-full bg-primary px-5 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary-foreground"
                  >
                    Open Room
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(room.shareLink)}
                    className="rounded-full border border-border/20 px-5 py-3 text-[10px] font-black uppercase tracking-[0.3em]"
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
          ))}

          {rooms.length === 0 && (
            <div className="rounded-[var(--radius)] border border-dashed border-border/30 bg-card/10 p-8 text-muted-foreground">
              No rooms yet. Create one and invite your first watch party.
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-3xl rounded-[var(--radius)] border border-border/20 bg-background/95 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">
                  Create Room Flow
                </div>
                <h2 className="mt-3 text-3xl font-black italic">Search, configure, share</h2>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-full border border-border/20 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em]"
              >
                Close
              </button>
            </div>

            {!createdRoom ? (
              <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
                <div>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search a movie title"
                    className="w-full rounded-2xl border border-border/20 bg-card/20 px-5 py-4 outline-none"
                  />

                  <div className="mt-4 grid gap-3 max-h-[360px] overflow-y-auto pr-1">
                    {searchResults.map((movie) => (
                      <button
                        key={movie.tmdb_id}
                        onClick={() => {
                          setSelectedMovie(movie);
                          setLabel(`${movie.title} Watch Party`);
                        }}
                        className={`flex items-center gap-3 rounded-2xl border p-3 text-left ${
                          selectedMovie?.tmdb_id === movie.tmdb_id
                            ? "border-primary bg-card/60"
                            : "border-border/20 bg-card/20"
                        }`}
                      >
                        <img
                          src={movie.images?.poster || "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=900&auto=format&fit=crop"}
                          alt={movie.title}
                          className="h-20 w-14 rounded-lg object-cover"
                        />
                        <div>
                          <div className="font-black">{movie.title}</div>
                          <div className="text-sm text-muted-foreground">
                            Score {movie.metrics?.vote_average?.toFixed(1) || "N/A"}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[var(--radius)] border border-border/20 bg-card/20 p-5">
                  <div className="text-sm font-black uppercase tracking-[0.35em] text-primary">
                    Configuration
                  </div>
                  <div className="mt-5 space-y-4">
                    <input
                      value={label}
                      onChange={(event) => setLabel(event.target.value)}
                      placeholder="Room label"
                      className="w-full rounded-xl border border-border/20 bg-background/30 px-4 py-3 outline-none"
                    />
                    <select
                      value={visibility}
                      onChange={(event) =>
                        setVisibility(event.target.value as "private" | "public")
                      }
                      className="w-full rounded-xl border border-border/20 bg-background/30 px-4 py-3 outline-none"
                    >
                      <option value="private">Private</option>
                      <option value="public">Public</option>
                    </select>
                    <input
                      type="number"
                      min={2}
                      max={50}
                      value={maxParticipants}
                      onChange={(event) => setMaxParticipants(Number(event.target.value))}
                      className="w-full rounded-xl border border-border/20 bg-background/30 px-4 py-3 outline-none"
                    />
                    <label className="flex items-center gap-3 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={aiMode}
                        onChange={(event) => setAiMode(event.target.checked)}
                      />
                      Launch as AI room
                    </label>
                    <button
                      onClick={handleCreateRoom}
                      disabled={createDisabled}
                      className="w-full rounded-full bg-primary px-5 py-3 text-[10px] font-black uppercase tracking-[0.35em] text-primary-foreground disabled:opacity-60"
                    >
                      Create Share Link
                    </button>
                    {status && <div className="text-sm text-muted-foreground">{status}</div>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-8 rounded-[var(--radius)] border border-primary/20 bg-primary/5 p-6">
                <div className="text-primary text-[10px] font-black uppercase tracking-[0.35em]">
                  Share Link Ready
                </div>
                <div className="mt-4 break-all text-lg text-foreground">
                  {createdRoom.shareLink}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => navigator.clipboard.writeText(createdRoom.shareLink)}
                    className="rounded-full border border-border/20 px-5 py-3 text-[10px] font-black uppercase tracking-[0.3em]"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => window.location.assign(createdRoom.shareLink)}
                    className="rounded-full bg-primary px-5 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary-foreground"
                  >
                    Open Room
                  </button>
                  <button
                    onClick={() => {
                      setShowCreate(false);
                      navigate("/rooms");
                    }}
                    className="rounded-full border border-border/20 px-5 py-3 text-[10px] font-black uppercase tracking-[0.3em]"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
