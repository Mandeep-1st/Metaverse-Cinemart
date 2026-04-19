import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type HeroMovie = {
  tmdb_id: number;
  title: string;
  overview?: string;
  images?: {
    backdrop?: string | null;
  };
  details?: {
    release_date?: string;
  };
  metrics?: {
    vote_average?: number;
  };
};

const fallbackBackdrop =
  "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=2072&auto=format&fit=crop";

export default function MovieHero({
  movies,
  onSelect,
}: {
  movies: HeroMovie[];
  onSelect: (movieId: number) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (movies.length <= 1) return;

    const timer = window.setInterval(() => {
      setCurrentIndex((previous) => (previous + 1) % movies.length);
    }, 8000);

    return () => window.clearInterval(timer);
  }, [movies]);

  const activeMovie = movies[currentIndex] ?? movies[0];

  if (!activeMovie) {
    return (
      <div className="h-full w-full bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading banner...</div>
      </div>
    );
  }

  const releaseYear = activeMovie.details?.release_date
    ? new Date(activeMovie.details.release_date).getFullYear()
    : null;

  return (
    <div className="relative h-full w-full overflow-hidden bg-background font-sans antialiased">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeMovie.tmdb_id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1 }}
          className="absolute inset-0"
        >
          <motion.img
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 9 }}
            src={activeMovie.images?.backdrop || fallbackBackdrop}
            alt={activeMovie.title}
            className="h-full w-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/55 to-transparent z-10" />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-background to-transparent z-10" />

          <div className="absolute inset-0 z-20 flex items-center px-6 sm:px-12 md:px-24">
            <div className="max-w-3xl">
              <div className="flex items-center gap-4 mb-5">
                <div className="h-[2px] w-12 bg-primary shadow-[0_0_15px_var(--primary)]" />
                <span className="text-primary font-black uppercase tracking-[0.45em] text-[10px]">
                  Movie Banner
                </span>
              </div>

              <h1 className="text-5xl sm:text-7xl md:text-[7rem] font-black text-foreground tracking-tighter leading-[0.85] uppercase mb-6 italic">
                {activeMovie.title}
              </h1>

              <div className="flex items-center gap-5 text-[10px] uppercase tracking-[0.35em] text-muted-foreground font-black mb-6">
                {releaseYear && <span>{releaseYear}</span>}
                {typeof activeMovie.metrics?.vote_average === "number" && (
                  <span>
                    IMDb {activeMovie.metrics.vote_average.toFixed(1)}
                  </span>
                )}
              </div>

              <div className="max-w-2xl border-l-2 border-primary/40 pl-5 mb-10">
                <p className="text-base sm:text-xl text-muted-foreground font-light italic leading-relaxed">
                  {activeMovie.overview || "Tap in and start a shared cinema session."}
                </p>
              </div>

              <motion.button
                whileHover={{
                  scale: 1.03,
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-foreground)",
                }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelect(activeMovie.tmdb_id)}
                className="bg-foreground text-background px-8 sm:px-12 py-4 rounded-[var(--radius)] font-black uppercase text-[10px] tracking-[0.35em] transition-all shadow-xl"
              >
                Open Movie Hub
              </motion.button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
