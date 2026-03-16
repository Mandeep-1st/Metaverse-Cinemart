import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star, Calendar } from "lucide-react";

interface Movie {
  id: number;
  title: string;
  rating: string;
  year: string;
  img: string;
}

interface MovieCarouselProps {
  title: string;
  category?: string;
  movies: Movie[];
}

const MovieCarousel = ({ title, category, movies }: MovieCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  return (
    /* 1. ROOT SECTION: Uses bg-background and block flow */
    <section className="dark relative block w-full bg-background py-16 md:py-24 border-b border-border/10 overflow-hidden font-sans">
      <div className="flex flex-col gap-8 md:gap-10 group/section relative w-full">
        
        {/* 2. DYNAMIC HEADER: Removed max-w-7xl and mx-auto, forced items-start and text-left so it aligns perfectly with the cards below */}
        <div className="flex flex-col items-start text-left gap-3 px-6 md:px-12 relative z-50 w-full">
          <div className="flex items-center gap-4">
            <div className="h-[2px] w-8 md:w-12 bg-primary shadow-sm" />
            <span className="text-primary font-black uppercase tracking-[0.4em] md:tracking-[0.6em] text-[9px] md:text-[12px]">
              Engine Core // {category?.toUpperCase() || "ANALYSIS"}
            </span>
          </div>
          <h3 className="text-4xl sm:text-6xl md:text-8xl font-black text-foreground tracking-tighter uppercase leading-none italic">
            {title}
          </h3>
        </div>
        
        {/* 3. NAVIGATION OVERLAYS: Hidden on small mobile, visible on tablet/desktop */}
        <div className="hidden sm:flex absolute top-[60%] -translate-y-1/2 inset-x-0 justify-between px-4 z-[60] pointer-events-none">
          <button onClick={() => scroll("left")} className="pointer-events-auto opacity-0 group-hover/section:opacity-100 transition-all bg-background/80 backdrop-blur-xl p-4 rounded-full border border-border/20 hover:bg-primary hover:border-primary/50 shadow-xl group">
            <ChevronLeft className="text-foreground group-hover:text-primary-foreground w-6 h-6 md:w-8 md:h-8" />
          </button>
          <button onClick={() => scroll("right")} className="pointer-events-auto opacity-0 group-hover/section:opacity-100 transition-all bg-background/80 backdrop-blur-xl p-4 rounded-full border border-border/20 hover:bg-primary hover:border-primary/50 shadow-xl group">
            <ChevronRight className="text-foreground group-hover:text-primary-foreground w-6 h-6 md:w-8 md:h-8" />
          </button>
        </div>

        {/* 4. DYNAMIC SCROLLABLE GRID: Responsive layout morphing */}
        <div 
          ref={scrollRef} 
          className="flex gap-4 sm:gap-6 md:gap-8 overflow-x-auto pb-16 pt-6 px-6 md:px-12 no-scrollbar snap-x snap-mandatory scroll-smooth items-center"
        >
          <style dangerouslySetInnerHTML={{ __html: `.no-scrollbar::-webkit-scrollbar { display: none; }` }} />
          
          {movies.map((movie) => (
            <motion.div 
              key={movie.id}
              layout // Magically animates the width/height changes
              onMouseEnter={() => setHoveredId(movie.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => setHoveredId(hoveredId === movie.id ? null : movie.id)} // Touch toggle for mobile
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              /* RESPONSIVE SCALING LOGIC:
                Mobile: w-[65vw] expands to w-[85vw]
                Tablet/Desktop: w-[260px] expands to w-[450px]
                Theme: Uses global --radius and --shadow-2xl (red glow)
              */
              className={`relative group/card rounded-[var(--radius)] overflow-hidden shadow-2xl snap-center cursor-pointer flex-shrink-0 transition-colors duration-500 bg-card border ${
                hoveredId === movie.id 
                  ? "w-[85vw] sm:w-[450px] h-[380px] sm:h-[450px] border-primary/50" 
                  : "w-[65vw] sm:w-[260px] h-[320px] sm:h-[380px] border-border/20"
              }`}
            >
              {/* Background Image */}
              <img 
                src={movie.img} 
                alt={movie.title} 
                className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${hoveredId === movie.id ? 'scale-105 grayscale-0 opacity-100' : 'grayscale-[0.5] opacity-60'}`} 
                loading="lazy" 
              />

              {/* DYNAMIC DATA OVERLAY (Only visible when expanded) */}
              <AnimatePresence>
                {hoveredId === movie.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    // Uses global background gradient for smooth text fading
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

                    <div className="flex items-center justify-between gap-2 md:gap-4">
                      <div className="flex items-center gap-4 md:gap-8">
                        {/* Rating Stat */}
                        <div className="flex flex-col">
                          <span className="text-primary font-black italic text-xl md:text-2xl flex items-center gap-1">
                            <Star className="w-4 h-4 md:w-5 md:h-5 fill-primary" /> {movie.rating}
                          </span>
                          <span className="text-[8px] md:text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-1">Global Score</span>
                        </div>
                        
                        {/* Year Stat */}
                        <div className="flex flex-col">
                          <span className="text-foreground font-black text-xl md:text-2xl flex items-center gap-1 uppercase tracking-tighter">
                            <Calendar className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" /> {movie.year}
                          </span>
                          <span className="text-[8px] md:text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-1">Release</span>
                        </div>
                      </div>
                      
                      {/* Action Button */}
                      <div className="h-10 w-10 md:h-14 md:w-14 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all transform hover:rotate-90 shadow-lg">
                        <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MovieCarousel;