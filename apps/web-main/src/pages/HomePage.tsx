import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/home/Navbar";
import MovieHero, { type HeroMovie } from "../components/home/MovieHero";
import MovieCarousel, {
  type CarouselMovie,
} from "../components/home/MovieCarousel";
import LoadingScreen from "../components/common/LoadingScreen";
import { useAuth } from "../context/AuthContext";
import { apiGet, apiPatch, apiPost } from "../utils/apiClient";

type ApiResponse<T> = {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
};

type RecommendationPayload = {
  recommendations: Array<{
    movie: CarouselMovie;
  }>;
};

type ModalId = "profile" | "password" | "feedback" | null;

const backgroundVideoUrl =
  import.meta.env.VITE_HOME_BACKGROUND_VIDEO ||
  "https://cdn.coverr.co/videos/coverr-a-dark-cinema-room-1569769474010?download=1080p";

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-[var(--radius)] border border-border/20 bg-background/95 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-black italic text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full border border-border/20 px-4 py-2 text-xs font-black uppercase tracking-[0.3em] text-muted-foreground hover:border-primary/40"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user, loading, setSessionUser } = useAuth();
  const [popularMovies, setPopularMovies] = useState<CarouselMovie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<CarouselMovie[]>([]);
  const [recommendedMovies, setRecommendedMovies] = useState<CarouselMovie[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<CarouselMovie[]>([]);
  const [modal, setModal] = useState<ModalId>(null);
  const [busy, setBusy] = useState(true);
  const [passwordState, setPasswordState] = useState({
    currentPassword: "",
    newPassword: "",
    status: "",
  });
  const [feedbackState, setFeedbackState] = useState({
    message: "",
    rating: 5,
    status: "",
  });

  const fetchHomeData = useCallback(async () => {
    if (!user) return;

    setBusy(true);

    try {
      const [popularResponse, topRatedResponse, recommendationResponse] =
        await Promise.all([
          apiGet<ApiResponse<CarouselMovie[]>>("/movies/discover", {
            category: "popular",
          }),
          apiGet<ApiResponse<CarouselMovie[]>>("/movies/discover", {
            category: "top_rated",
          }),
          apiGet<ApiResponse<RecommendationPayload>>("/movies/recommendations", {
            username: user.username,
          }).catch(() => null),
        ]);

      setPopularMovies(popularResponse.data);
      setTopRatedMovies(topRatedResponse.data);
      setRecommendedMovies(
        recommendationResponse?.data?.recommendations?.map((item) => item.movie) ||
          [],
      );
    } finally {
      setBusy(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  useEffect(() => {
    if (!searchValue.trim()) {
      setSearchResults([]);
      return;
    }

    const handle = window.setTimeout(async () => {
      try {
        const response = await apiGet<ApiResponse<CarouselMovie[]>>("/movies/search", {
          query: searchValue.trim(),
        });
        setSearchResults(response.data);
      } catch {
        setSearchResults([]);
      }
    }, 250);

    return () => window.clearTimeout(handle);
  }, [searchValue]);

  const featuredMovies = useMemo<HeroMovie[]>(
    () => popularMovies.slice(0, 4),
    [popularMovies],
  );

  const openMovie = useCallback(
    async (movieId: number) => {
      if (!user) return;
      setSearchValue("");
      setSearchResults([]);

      apiPost("/movies/whenclicked", {
        username: user.username,
        movie: movieId,
      }).catch(() => {});

      navigate(`/movies/${movieId}`);
    },
    [navigate, user],
  );

  const handleLogout = useCallback(async () => {
    await apiGet("/users/logout").catch(() => null);
    setSessionUser(null);
    navigate("/login");
  }, [navigate, setSessionUser]);

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordState((previous) => ({ ...previous, status: "Saving..." }));

    try {
      await apiPatch("/users/password", {
        currentPassword: passwordState.currentPassword,
        newPassword: passwordState.newPassword,
      });
      setPasswordState({
        currentPassword: "",
        newPassword: "",
        status: "Password updated successfully.",
      });
    } catch (error) {
      setPasswordState((previous) => ({
        ...previous,
        status: error instanceof Error ? error.message : "Password update failed.",
      }));
    }
  };

  const handleFeedbackSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedbackState((previous) => ({ ...previous, status: "Sending..." }));

    try {
      await apiPost("/users/feedback", {
        message: feedbackState.message,
        rating: feedbackState.rating,
        category: "experience",
      });
      setFeedbackState({
        message: "",
        rating: 5,
        status: "Feedback submitted. Thank you.",
      });
    } catch (error) {
      setFeedbackState((previous) => ({
        ...previous,
        status: error instanceof Error ? error.message : "Feedback failed.",
      }));
    }
  };

  if (loading || busy || !user) {
    return <LoadingScreen label="Warming up your home screen..." />;
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground overflow-x-hidden flex flex-col font-sans antialiased">
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover opacity-15"
          src={backgroundVideoUrl}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_transparent_0%,_var(--background)_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background" />
      </div>

      <Navbar
        user={user}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchResults={searchResults}
        onSelectMovie={openMovie}
        onOpenRooms={() => navigate("/rooms")}
        onOpenProfile={() => setModal("profile")}
        onOpenPassword={() => setModal("password")}
        onOpenFeedback={() => setModal("feedback")}
        onLogout={handleLogout}
      />

      <main className="relative z-10 flex flex-col">
        <section className="relative h-[86vh] md:h-[92vh] w-full overflow-hidden">
          <MovieHero movies={featuredMovies} onSelect={openMovie} />
          <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-background via-background/80 to-transparent z-10 pointer-events-none" />
        </section>

        <section className="relative z-20 -mt-16 md:-mt-24 pb-32 flex flex-col w-full">
          <div className="flex flex-col gap-20 md:gap-28 w-full items-start">
            {recommendedMovies.length > 0 && (
              <MovieCarousel
                title="For Your Taste"
                category="personal"
                movies={recommendedMovies}
                onMovieSelect={openMovie}
              />
            )}
            <MovieCarousel
              title="Now Trending"
              category="popular"
              movies={popularMovies}
              onMovieSelect={openMovie}
            />
            <MovieCarousel
              title="Top Rated"
              category="top_rated"
              movies={topRatedMovies}
              onMovieSelect={openMovie}
            />
          </div>
        </section>
      </main>

      {modal === "profile" && (
        <ModalShell title="Profile" onClose={() => setModal(null)}>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground font-black uppercase text-lg">
              {(user.avatar || user.fullName).slice(0, 2)}
            </div>
            <div>
              <div className="text-xl font-black text-foreground">{user.fullName}</div>
              <div className="text-sm text-muted-foreground">@{user.username}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </div>
        </ModalShell>
      )}

      {modal === "password" && (
        <ModalShell title="Change Password" onClose={() => setModal(null)}>
          <form className="space-y-4" onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              placeholder="Current password"
              value={passwordState.currentPassword}
              onChange={(event) =>
                setPasswordState((previous) => ({
                  ...previous,
                  currentPassword: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-border/20 bg-card/30 px-4 py-3 outline-none"
            />
            <input
              type="password"
              placeholder="New password"
              value={passwordState.newPassword}
              onChange={(event) =>
                setPasswordState((previous) => ({
                  ...previous,
                  newPassword: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-border/20 bg-card/30 px-4 py-3 outline-none"
            />
            <button className="w-full rounded-full bg-primary px-5 py-3 text-primary-foreground text-[10px] font-black uppercase tracking-[0.35em]">
              Save Password
            </button>
            {passwordState.status && (
              <div className="text-sm text-muted-foreground">{passwordState.status}</div>
            )}
          </form>
        </ModalShell>
      )}

      {modal === "feedback" && (
        <ModalShell title="Feedback" onClose={() => setModal(null)}>
          <form className="space-y-4" onSubmit={handleFeedbackSubmit}>
            <select
              value={feedbackState.rating}
              onChange={(event) =>
                setFeedbackState((previous) => ({
                  ...previous,
                  rating: Number(event.target.value),
                }))
              }
              className="w-full rounded-xl border border-border/20 bg-card/30 px-4 py-3 outline-none"
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} / 5
                </option>
              ))}
            </select>
            <textarea
              value={feedbackState.message}
              onChange={(event) =>
                setFeedbackState((previous) => ({
                  ...previous,
                  message: event.target.value,
                }))
              }
              placeholder="Tell us what would make the product better."
              className="min-h-36 w-full rounded-xl border border-border/20 bg-card/30 px-4 py-3 outline-none"
            />
            <button className="w-full rounded-full bg-primary px-5 py-3 text-primary-foreground text-[10px] font-black uppercase tracking-[0.35em]">
              Send Feedback
            </button>
            {feedbackState.status && (
              <div className="text-sm text-muted-foreground">{feedbackState.status}</div>
            )}
          </form>
        </ModalShell>
      )}
    </div>
  );
}
