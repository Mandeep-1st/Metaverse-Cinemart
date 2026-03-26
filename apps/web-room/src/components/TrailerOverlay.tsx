import { useEffect, useState } from "react";

// Use the token from your useTmdb.ts file
const TMDB_READ_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxMDE4ZTJkYzhlN2Y4NDkwOGE4NjM0NjkyM2QwMjAzMyIsIm5iZiI6MTc2OTcyNjIxNi4zMjYwMDAyLCJzdWIiOiI2OTdiZTEwODEwOTgzOTk3YmYyYTMxOTkiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.J1Y7fClU2HMLWbOeKGNBM-kLcFty7gA9KE6P9jiRIKE";

export default function TrailerOverlay({
  onClose,
  movieId,
}: {
  onClose: () => void;
  movieId: string;
}) {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrailer = async () => {
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}/videos?language=en-US`,
          {
            method: "GET",
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${TMDB_READ_TOKEN}`,
            },
          },
        );

        const data = await response.json();

        // Find the official YouTube trailer
        const trailer = data.results?.find(
          (vid: any) => vid.site === "YouTube" && vid.type === "Trailer",
        );

        if (trailer) {
          setTrailerKey(trailer.key);
        }
      } catch (error) {
        console.error("Failed to fetch trailer from TMDB:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrailer();
  }, [movieId]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-6xl aspect-video bg-black rounded-xl shadow-[0_0_50px_rgba(0,100,255,0.15)] overflow-hidden border border-zinc-800">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-3 bg-black/50 hover:bg-red-600 text-white rounded-full transition-all hover:scale-110"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        {/* Video Player or Loading State */}
        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-xl animate-pulse">Connecting to TMDB...</p>
          </div>
        ) : trailerKey ? (
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&controls=1&rel=0&showinfo=0&modestbranding=1`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 bg-zinc-900">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="mb-4"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-xl">No Trailer Available</p>
          </div>
        )}
      </div>
    </div>
  );
}
