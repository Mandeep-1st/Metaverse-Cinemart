import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star, Calendar } from "lucide-react";

export type CarouselMovie = {
  tmdb_id: number;
  title: string;
  overview?: string;
  images?: {
    poster?: string | null;
    backdrop?: string | null;
  };
  metrics?: {
    vote_average?: number;
  };
  details?: {
    release_date?: string;
  };
};

const fallbackPoster =
  "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=900&auto=format&fit=crop";

export default function MovieCarousel({
  title,
  category,
  movies,
  onMovieSelect,
}: {
  title: string;
  category?: string;
  movies: CarouselMovie[];
  onMovieSelect: (movieId: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;

    const { scrollLeft, clientWidth } = scrollRef.current;
    const scrollTo =
      direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
    scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
  };

  return (
    <section className="dark relative block w-full bg-background py-16 md:py-24 border-b border-border/10 overflow-hidden font-sans">
      <div className="flex flex-col gap-8 md:gap-10 group/section relative w-full">
        <div className="flex flex-col items-start text-left gap-3 px-6 md:px-12 relative z-50 w-full">
          <div className="flex items-center gap-4">
            <div className="h-[2px] w-8 md:w-12 bg-primary shadow-sm" />
            <span className="text-primary font-black uppercase tracking-[0.4em] md:tracking-[0.6em] text-[9px] md:text-[12px]">
              Engine Core // {category?.toUpperCase() || "DISCOVERY"}
            </span>
          </div>
          <h3 className="text-4xl sm:text-6xl md:text-8xl font-black text-foreground tracking-tighter uppercase leading-none italic">
            {title}
          </h3>
        </div>

        <div className="hidden sm:flex absolute top-[60%] -translate-y-1/2 inset-x-0 justify-between px-4 z-[60] pointer-events-none">
          <button
            onClick={() => scroll("left")}
            className="pointer-events-auto opacity-0 group-hover/section:opacity-100 transition-all bg-background/80 backdrop-blur-xl p-4 rounded-full border border-border/20 hover:bg-primary hover:border-primary/50 shadow-xl group"
          >
            <ChevronLeft className="text-foreground group-hover:text-primary-foreground w-6 h-6 md:w-8 md:h-8" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="pointer-events-auto opacity-0 group-hover/section:opacity-100 transition-all bg-background/80 backdrop-blur-xl p-4 rounded-full border border-border/20 hover:bg-primary hover:border-primary/50 shadow-xl group"
          >
            <ChevronRight className="text-foreground group-hover:text-primary-foreground w-6 h-6 md:w-8 md:h-8" />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-6 md:gap-8 overflow-x-auto pb-16 pt-6 px-6 md:px-12 no-scrollbar snap-x snap-mandatory scroll-smooth items-center"
        >
          <style
            dangerouslySetInnerHTML={{
              __html: `.no-scrollbar::-webkit-scrollbar { display: none; }`,
            }}
          />

          {movies.map((movie) => {
            const poster =
              movie.images?.poster || movie.images?.backdrop || fallbackPoster;
            const isOpen = hoveredId === movie.tmdb_id;
            const releaseYear = movie.details?.release_date
              ? new Date(movie.details.release_date).getFullYear()
              : "N/A";

            return (
              <motion.button
                key={movie.tmdb_id}
                layout
                type="button"
                onMouseEnter={() => setHoveredId(movie.tmdb_id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onMovieSelect(movie.tmdb_id)}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                className={`relative group/card rounded-[var(--radius)] overflow-hidden shadow-2xl snap-center cursor-pointer flex-shrink-0 transition-colors duration-500 bg-card border text-left ${
                  isOpen
                    ? "w-[85vw] sm:w-[450px] h-[380px] sm:h-[450px] border-primary/50"
                    : "w-[65vw] sm:w-[260px] h-[320px] sm:h-[380px] border-border/20"
                }`}
              >
                <img
                  src={poster}
                  alt={movie.title}
                  className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
                    isOpen ? "scale-105 grayscale-0 opacity-100" : "grayscale-[0.5] opacity-60"
                  }`}
                  loading="lazy"
                />

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent flex flex-col justify-end p-6 md:p-10 z-40"
                    >
                      <div className="flex items-center gap-3 mb-3 md:mb-4">
                        <span className="bg-primary text-primary-foreground text-[9px] md:text-[10px] font-black px-3 py-1 rounded-sm uppercase tracking-widest">
                          Live Analysis
                        </span>
                        <div className="h-px flex-1 bg-border/40" />
                      </div>

                      <h4 className="text-foreground font-black text-3xl sm:text-4xl md:text-5xl uppercase tracking-tighter leading-none mb-4 md:mb-6 italic">
                        {movie.title}
                      </h4>

                      <p className="text-sm text-muted-foreground leading-relaxed mb-5 line-clamp-3">
                        {movie.overview || "Open the movie hub to watch, chat, and launch a room."}
                      </p>

                      <div className="flex items-center justify-between gap-2 md:gap-4">
                        <div className="flex items-center gap-4 md:gap-8">
                          <div className="flex flex-col">
                            <span className="text-primary font-black italic text-xl md:text-2xl flex items-center gap-1">
                              <Star className="w-4 h-4 md:w-5 md:h-5 fill-primary" />
                              {movie.metrics?.vote_average?.toFixed(1) || "N/A"}
                            </span>
                            <span className="text-[8px] md:text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-1">
                              Global Score
                            </span>
                          </div>

                          <div className="flex flex-col">
                            <span className="text-foreground font-black text-xl md:text-2xl flex items-center gap-1 uppercase tracking-tighter">
                              <Calendar className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                              {releaseYear}
                            </span>
                            <span className="text-[8px] md:text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-1">
                              Release
                            </span>
                          </div>
                        </div>

                        <div className="h-10 w-10 md:h-14 md:w-14 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all transform hover:rotate-90 shadow-lg">
                          <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
