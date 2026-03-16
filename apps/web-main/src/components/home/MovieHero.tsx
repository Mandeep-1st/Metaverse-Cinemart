import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

// 1. DATA DEFINITION: Kept outside to prevent unnecessary re-renders
const heroMovies = [
  {
    id: 1,
    title: "THE DARK KNIGHT",
    backdrop: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2072&auto=format&fit=crop",
    description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham.",
    engine_id: "2 / 3"
  },
  {
    id: 2,
    title: "INTERSTELLAR",
    backdrop: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=2072&auto=format&fit=crop",
    description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    engine_id: "1 / 3"
  },
  {
    id: 3,
    title: "OPPENHEIMER",
    backdrop: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=2072&auto=format&fit=crop",
    description: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
    engine_id: "3 / 3"
  }
];

const MovieHero = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  // 2. SLIDE LOGIC
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroMovies.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    /* ROOT: Now uses your global bg-background and font-sans variables */
    <div className="relative h-full w-full overflow-hidden bg-background font-sans antialiased">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0"
        >
          {/* BACKGROUND: Cinematic Scaling */}
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10 }}
            src={heroMovies[currentIndex].backdrop}
            alt={heroMovies[currentIndex].title}
            className="h-full w-full object-cover opacity-40 md:opacity-50"
          />

          {/* GRADIENTS: Synced with your bg-background for seamless blending */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 sm:via-background/30 to-transparent z-10" />
          <div className="absolute inset-x-0 bottom-0 h-48 sm:h-96 bg-gradient-to-t from-background to-transparent z-10" />

          {/* CONTENT: Fluid Responsive System */}
          <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 sm:px-12 md:px-24 max-w-7xl pb-16 md:pb-0">
            <motion.div>
              
              {/* Technical Indicator */}
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                {/* Synced red accent to your --primary color and global shadow tokens */}
                <div className="h-[2px] w-8 sm:w-12 bg-primary shadow-[0_0_15px_var(--primary)]" />
                <span className="text-primary font-black uppercase tracking-[0.4em] sm:tracking-[0.6em] text-[8px] sm:text-[10px] md:text-[12px]">
                  Engine Selection: {heroMovies[currentIndex].engine_id}
                </span>
              </div>

              {/* Massive Title: Scaled dynamically so it fits gracefully on mobile */}
              <h1 className="text-5xl sm:text-7xl md:text-[8rem] lg:text-[10rem] font-black text-foreground tracking-tighter leading-[0.85] uppercase mb-6 sm:mb-10 drop-shadow-2xl">
                {heroMovies[currentIndex].title}
              </h1>

              {/* Description Quote: Uses muted-foreground for secondary text hierarchy */}
              <div className="relative max-w-xs sm:max-w-xl md:max-w-2xl border-l-2 border-primary/40 pl-4 sm:pl-6 mb-10 sm:mb-14">
                <p className="text-sm sm:text-xl md:text-2xl text-muted-foreground font-light italic leading-relaxed">
                  "{heroMovies[currentIndex].description}"
                </p>
              </div>

              {/* Action Button: Inverted text/bg that highlights to primary on hover */}
              <motion.button 
                whileHover={{ 
                  scale: 1.05, 
                  backgroundColor: "var(--primary)", 
                  color: "var(--primary-foreground)" 
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/trailer/${heroMovies[currentIndex].id}`)}
                className="bg-foreground text-background px-8 sm:px-12 py-3 sm:py-4 rounded-[var(--radius)] font-black uppercase text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em] transition-all shadow-xl"
              >
                Play Trailer
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default MovieHero;