import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

import Hero from "../components/Hero";
import CinematicBackground from "../components/CinematicBackground";
import MovieShowcase from "../components/MovieShowcase";
import Features from "../components/Features";
import BottomCTA from "../components/BottomCTA";

const LandingPage = () => {
  const [showCTA, setShowCTA] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const windowHeight = window.innerHeight;
      setShowCTA(scrollTop > windowHeight * 0.5);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="dark h-screen w-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory scroll-smooth bg-background text-foreground no-scrollbar font-sans antialiased"
    >
      <style dangerouslySetInnerHTML={{ __html: `.no-scrollbar::-webkit-scrollbar { display: none; }` }} />

      {/* FLOATING CTA */}
      <AnimatePresence>
        {showCTA && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100]"
          >
            <motion.button 
              whileHover={{ 
                scale: 1.1, 
                backgroundColor: "var(--primary)",
                boxShadow: "var(--shadow-lg)" 
              }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/login')}
              className="bg-primary text-primary-foreground px-12 py-5 rounded-full font-black uppercase text-[12px] tracking-widest shadow-md border border-white/10 transition-all"
            >
              Get Started →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        {/* HERO: min-h-screen allows it to breathe */}
        <section className="min-h-screen w-full snap-start shrink-0 relative bg-background">
          <Hero />
        </section>

        {/* CINEMATIC BACKGROUND */}
        <section className="min-h-screen w-full snap-start shrink-0 flex items-center justify-center bg-background relative overflow-hidden">
          <CinematicBackground />
        </section>

        {/* CRITICAL FIX 1: Changed h-screen to min-h-screen. 
            Removed 'flex items-center' so tall mobile content starts at the top and scrolls naturally. */}
        <section className="min-h-screen w-full snap-start shrink-0 bg-background relative">
          <MovieShowcase />
        </section>

        {/* CRITICAL FIX 2: Changed h-screen to min-h-screen. */}
        <section className="min-h-screen w-full snap-start shrink-0 bg-background relative">
          <Features />
        </section>

        {/* BOTTOM CTA */}
        <section className="min-h-screen w-full snap-start shrink-0 flex flex-col items-center justify-center relative bg-background">
          <BottomCTA />
          <div className="absolute bottom-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-xl" />
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
