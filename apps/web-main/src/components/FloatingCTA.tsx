import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";

const FloatingCTA = () => {
  const { scrollYProgress } = useScroll();
  
  // Fades in after scrolling 10% of the page
  const opacity = useTransform(scrollYProgress, [0, 0.1], [0, 1]);
  // Scales up slightly as the user nears the bottom
  const scale = useTransform(scrollYProgress, [0.1, 0.9], [0.9, 1.1]);

  return (
    /* 1. ANIMATED WRAPPER: Forced dark mode for theme consistency */
    <motion.div
      style={{ opacity, scale }}
      className="dark fixed bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto font-sans antialiased"
    >
      <Link to="/home">
        {/* 2. CORE BUTTON: Fully mapped to --primary and --shadow variables */}
        <button
          className="group relative h-14 md:h-16 px-10 md:px-14 overflow-hidden rounded-full bg-primary text-base md:text-lg font-black uppercase tracking-widest text-primary-foreground shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          {/* Animated Shimmer Effect: Integrated with theme-safe colors */}
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          
          <span className="relative flex items-center gap-3">
            Get Started
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              →
            </motion.span>
          </span>

          {/* 3. DYNAMIC GLOW: Mapped to --primary and shadow-md */}
          <div className="absolute inset-0 rounded-full shadow-[0_0_30px_var(--primary)] opacity-40 group-hover:opacity-70 transition-opacity" />
        </button>
      </Link>

      {/* Global CSS for the shimmer animation if not in your tailwind config */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </motion.div>
  );
};

export default FloatingCTA;