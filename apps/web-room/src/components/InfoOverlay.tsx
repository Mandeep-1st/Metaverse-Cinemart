export default function InfoOverlay({
  onClose,
  movieId,
}: {
  onClose: () => void;
  movieId: string;
}) {
  // Placeholder data - later we fetch from TMDB /movie/{movie_id}
  const MOVIE_INFO = {
    title: "Interstellar",
    tagline: "Mankind was born on Earth. It was never meant to die here.",
    releaseDate: "2014",
    runtime: "169 min",
    rating: "8.6/10",
    synopsis:
      "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival as Earth's resources are rapidly depleting.",
    director: "Christopher Nolan",
    cast: [
      "Matthew McConaughey",
      "Anne Hathaway",
      "Jessica Chastain",
      "Michael Caine",
    ],
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-end p-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* The Info Panel (Slides in from the RIGHT) */}
      <div className="relative w-full max-w-md h-full max-h-[80vh] bg-zinc-900/90 rounded-2xl shadow-2xl overflow-hidden border border-zinc-700/50 flex flex-col animate-in slide-in-from-right-8 duration-300">
        {/* Header Image / Title Area */}
        <div className="relative h-48 bg-zinc-800 flex items-end p-6 border-b border-zinc-700">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-red-600 text-white rounded-full transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-1">
              {MOVIE_INFO.title}
            </h2>
            <div className="flex gap-3 text-sm text-zinc-300 font-mono">
              <span>{MOVIE_INFO.releaseDate}</span>
              <span>•</span>
              <span>{MOVIE_INFO.runtime}</span>
              <span>•</span>
              <span className="text-yellow-500 flex items-center gap-1">
                ★ {MOVIE_INFO.rating}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-zinc-300 custom-scrollbar">
          <div>
            <p className="italic text-zinc-400 text-sm mb-3">
              "{MOVIE_INFO.tagline}"
            </p>
            <h3 className="text-white font-bold mb-2">Synopsis</h3>
            <p className="text-sm leading-relaxed">{MOVIE_INFO.synopsis}</p>
          </div>

          <div className="space-y-3 border-t border-zinc-800 pt-4">
            <div>
              <span className="text-zinc-500 text-sm block mb-1">Director</span>
              <span className="text-white font-medium">
                {MOVIE_INFO.director}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 text-sm block mb-1">Top Cast</span>
              <div className="flex flex-wrap gap-2">
                {MOVIE_INFO.cast.map((actor) => (
                  <span
                    key={actor}
                    className="bg-zinc-800 px-3 py-1 rounded-full text-xs text-zinc-300 border border-zinc-700"
                  >
                    {actor}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
