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

        <div className="pointer-events-none absolute inset-x-0 top-[58%] z-[70] hidden -translate-y-1/2 justify-between px-2 sm:flex md:px-6">
          <div className="pointer-events-auto -m-3 p-3">
            <button
              onClick={() => scroll("left")}
              aria-label="Scroll movies left"
              className="flex h-14 w-14 items-center justify-center rounded-full border border-border/20 bg-background/80 text-foreground shadow-xl backdrop-blur-xl transition-all hover:border-primary/50 hover:bg-primary hover:text-primary-foreground md:h-16 md:w-16"
            >
              <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
            </button>
          </div>
          <div className="pointer-events-auto -m-3 p-3">
            <button
              onClick={() => scroll("right")}
              aria-label="Scroll movies right"
              className="flex h-14 w-14 items-center justify-center rounded-full border border-border/20 bg-background/80 text-foreground shadow-xl backdrop-blur-xl transition-all hover:border-primary/50 hover:bg-primary hover:text-primary-foreground md:h-16 md:w-16"
            >
              <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex items-stretch gap-4 overflow-x-auto px-6 pb-16 pt-6 no-scrollbar snap-x snap-mandatory scroll-smooth sm:gap-6 md:gap-8 md:px-12"
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
                type="button"
                onMouseEnter={() => setHoveredId(movie.tmdb_id)}
                onMouseLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(movie.tmdb_id)}
                onBlur={() => setHoveredId(null)}
                onClick={() => onMovieSelect(movie.tmdb_id)}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`relative group/card snap-center flex-shrink-0 cursor-pointer overflow-hidden rounded-[var(--radius)] border bg-card text-left shadow-2xl transition-[transform,border-color,box-shadow] duration-300 will-change-transform ${
                  isOpen
                    ? "translate-y-[-6px] border-primary/50 shadow-[0_30px_70px_rgba(0,0,0,0.45)]"
                    : "border-border/20"
                }`}
                style={{
                  width: "clamp(240px, 65vw, 320px)",
                  height: "clamp(320px, 58vw, 400px)",
                }}
              >
                <img
                  src={poster}
                  alt={movie.title}
                  className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
                    isOpen
                      ? "scale-105 grayscale-0 opacity-100"
                      : "grayscale-[0.35] opacity-70"
                  }`}
                  loading="lazy"
                />

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute inset-0 z-40 flex flex-col justify-end bg-gradient-to-t from-background via-background/85 to-transparent p-6 md:p-8"
                    >
                      <div className="flex items-center gap-3 mb-3 md:mb-4">
                        <span className="bg-primary text-primary-foreground text-[9px] md:text-[10px] font-black px-3 py-1 rounded-sm uppercase tracking-widest">
                          Live Analysis
                        </span>
                        <div className="h-px flex-1 bg-border/40" />
                      </div>

                      <h4 className="mb-4 text-foreground text-3xl font-black uppercase italic leading-[0.92] tracking-tighter sm:text-4xl md:mb-5 md:text-[2.7rem]">
                        {movie.title}
                      </h4>

                      <p className="mb-5 text-sm leading-6 text-muted-foreground line-clamp-3">
                        {movie.overview || "Open the movie hub to watch, chat, and launch a room."}
                      </p>

                      <div className="flex items-center justify-between gap-3 md:gap-4">
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

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-all hover:rotate-90 hover:bg-primary hover:text-primary-foreground md:h-14 md:w-14">
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
