import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/home/Navbar";
import MovieHero, { type HeroMovie } from "../components/home/MovieHero";
import MovieCarousel, {
  type CarouselMovie,
} from "../components/home/MovieCarousel";
import LoadingScreen from "../components/common/LoadingScreen";
import { useAuth } from "../context/AuthContext";
import { useAppShell } from "../hooks/useAppShell";
import { apiGet, apiPost } from "../utils/apiClient";

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

const backgroundVideoUrl =
  import.meta.env.VITE_HOME_BACKGROUND_VIDEO ||
  "https://cdn.coverr.co/videos/coverr-a-dark-cinema-room-1569769474010?download=1080p";

export default function HomePage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { openCommandPalette, openProfilePanel } = useAppShell();
  const [popularMovies, setPopularMovies] = useState<CarouselMovie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<CarouselMovie[]>([]);
  const [recommendedMovies, setRecommendedMovies] = useState<CarouselMovie[]>([]);
  const [busy, setBusy] = useState(true);

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

  const featuredMovies = useMemo<HeroMovie[]>(
    () => popularMovies.slice(0, 4),
    [popularMovies],
  );

  const openMovie = useCallback(
    async (movieId: number) => {
      if (!user) return;

      apiPost("/movies/whenclicked", {
        username: user.username,
        movie: movieId,
      }).catch(() => {});

      navigate(`/movies/${movieId}`);
    },
    [navigate, user],
  );

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
        onOpenCommandPalette={openCommandPalette}
        onOpenRooms={() => navigate("/rooms")}
        onOpenProfile={() => openProfilePanel("overview")}
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
    </div>
  );
}
