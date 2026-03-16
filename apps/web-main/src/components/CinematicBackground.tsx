import React from "react";
import { motion } from "framer-motion";

const CinematicBackgroundGrid: React.FC = () => {
  // Filling grid with 48 tiles for the immersive "poster wall" look
  const posterTiles = Array.from({ length: 48 });

  return (
    /* 1. ROOT SECTION: Forces 'dark' theme and pulls from Geist font (--font-sans) */
    <section className="dark relative h-screen w-full flex flex-col items-center justify-center bg-background overflow-hidden font-sans antialiased">
      
      {/* 2. DYNAMIC MOVIE POSTER GRID (The Background) */}
      <div className="absolute inset-0 z-0 opacity-[0.12] pointer-events-none overflow-hidden">
        <div 
          className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4 w-[140%] h-[140%] -translate-x-10 -translate-y-20"
          style={{
            transform: "rotateX(20deg) rotateY(-8deg) rotateZ(-3deg) skewX(2deg)",
            perspective: "1200px"
          }}
        >
          {posterTiles.map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0.05 }}
              animate={{ 
                opacity: [0.05, 0.2, 0.05],
              }}
              transition={{
                duration: Math.random() * 4 + 4,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "easeInOut"
              }}
              /* Uses theme border variable and radius-md */
              className="aspect-[2/3] w-full bg-card/20 rounded-md border border-border/10 shadow-inner"
              style={{
                backgroundImage: `url('https://picsum.photos/seed/${i + 120}/300/450')`,
                backgroundSize: 'cover',
                filter: 'grayscale(100%) brightness(0.7)'
              }}
            />
          ))}
        </div>
      </div>

      {/* 3. GRADIENT OVERLAYS (Focused center look) */}
      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,_transparent_0%,_var(--background)_85%)]" />
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-background via-transparent to-background" />

      {/* 4. CENTER AMBIENT PRIMARY GLOW */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute z-20 h-[300px] md:h-[500px] w-full max-w-[800px] rounded-full bg-primary/20 blur-[120px] md:blur-[150px]"
      />

      {/* 5. CONTENT WRAPPER */}
      <div className="relative z-50 text-center flex flex-col items-center px-6">
        
        {/* Engine Status Pill */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          /* Uses --primary and shadow-sm variables */
          className="mb-8 md:mb-12 flex items-center gap-4 px-6 py-2 rounded-full border border-primary/30 bg-card/10 backdrop-blur-3xl shadow-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="text-foreground font-black uppercase tracking-widest text-[10px] md:text-xs">
            Powered by <span className="text-primary">CineSmart Engine</span>
          </span>
        </motion.div>

        {/* Main Headline: Responsive Scaling & Tracking */}
        <div className="flex flex-col gap-2 md:gap-4">
          <h2 className="text-4xl sm:text-6xl md:text-9xl font-black text-foreground leading-[0.9] tracking-tighter uppercase">
            Personalizing <br /> 
            your
          </h2>
          <h2 className="text-4xl sm:text-6xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-primary via-primary/80 to-primary/40 italic uppercase drop-shadow-2xl">
            cinema <br />
            experience.
          </h2>
        </div>

        {/* Bottom Quote: Mapped to --muted-foreground */}
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 1 }}
          viewport={{ once: true }}
          className="mt-8 md:mt-12 text-muted-foreground text-sm sm:text-base md:text-2xl font-light italic tracking-wide max-w-2xl"
        >
          "Your taste, our intelligence. Redefining how you 
          <span className="text-foreground font-bold not-italic mx-2">discover</span>
          <span className="relative text-primary font-bold not-italic border-b-2 border-primary/50 shadow-sm">
            cinema
          </span> forever."
        </motion.p>
      </div>

    </section>
  );
};

export default CinematicBackgroundGrid;