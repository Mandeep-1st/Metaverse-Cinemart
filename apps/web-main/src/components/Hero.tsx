import { LampContainer } from "@repo/ui/components/acternity/lamp";
import { motion } from "framer-motion";

const Hero = () => {
  // Explicit shadow tokens to prevent Framer Motion console errors
  const glowShadow = "0px 0px 50px 0px hsl(0 100% 65% / 0.3)";
  const glowNone = "0px 0px 0px 0px hsl(0 100% 65% / 0)";
  const videoUrl =
    import.meta.env.VITE_HOME_BACKGROUND_VIDEO ||
    "https://cdn.coverr.co/videos/coverr-a-dark-cinema-room-1569769474010?download=1080p";

  return (
    /* 1. ROOT SECTION: Dynamic height and forced dark theme */
    <section className="dark relative min-h-screen w-full bg-background overflow-hidden flex flex-col items-center justify-center font-sans antialiased selection:bg-primary/30">
      
      {/* 2. ATMOSPHERIC CINEMATIC LAYER */}
      <div className="absolute inset-0 z-0">
        <video 
          autoPlay muted loop playsInline 
          className="h-full w-full object-cover opacity-10 scale-105 blur-[3px]" 
          src={videoUrl} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
      </div>

      {/* 3. RESPONSIVE BRANDING: Anchored safely top-left */}
      <div className="absolute top-8 left-8 md:top-12 md:left-14 z-[60]">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_10px_var(--primary)]" />
          <h1 className="text-base md:text-xl font-black tracking-tighter text-foreground uppercase italic">
            Cine<span className="text-primary">Smart</span>
          </h1>
        </motion.div>
      </div>

      {/* 4. CONTENT CORE: Using Lamp with explicit vertical spacing for mobile */}
      <LampContainer className="relative flex items-center justify-center pt-24 md:pt-40 scale-[0.7] sm:scale-85 md:scale-100">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1, ease: "circOut" }}
          /* mt-32 ensures headlines are visible on mobile and not hidden behind the logo */
          className="relative z-10 flex flex-col items-center text-center max-w-7xl px-4 mt-28 sm:mt-36 md:mt-48"
        >
          {/* Headline Group: Scaled down to fit perfectly under the lamp focal point */}
          <div className="flex flex-col gap-2 md:gap-4 mb-12 md:mb-20">
            <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-[5.5rem] font-black tracking-tighter text-foreground leading-[0.9] uppercase">
              Movies that
            </h2>
            <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-[5.5rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-primary via-primary/80 to-primary/40 leading-[0.9] uppercase italic drop-shadow-2xl">
              understand your taste
            </h2>
          </div>

          {/* Description Highlight: Linked to global --radius and --card variables */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, boxShadow: glowNone }}
            whileInView={{ opacity: 1, scale: 1, boxShadow: glowShadow }}
            transition={{ delay: 0.6 }}
            className="relative py-10 md:py-14 px-8 md:px-20 rounded-[var(--radius)] border border-border/10 bg-card/5 backdrop-blur-2xl shadow-2xl overflow-hidden group max-w-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <p className="text-sm sm:text-lg md:text-2xl text-muted-foreground font-light leading-relaxed tracking-wide italic">
              "Experience the next generation of{" "}
              <span className="text-foreground font-bold not-italic">Engine-driven</span> recommendations. 
              Discover cinema curated by your unique{" "}
              <span className="text-primary font-black shadow-sm italic underline underline-offset-8 decoration-primary/40">
                mood and history
              </span>."
            </p>
          </motion.div>

          {/* Downward Scanner Pulse: Locked to --primary variable */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-20 md:mt-28 flex flex-col items-center gap-4"
          >
            <span className="text-[8px] md:text-[10px] uppercase tracking-[0.6em] text-muted-foreground font-black opacity-30">
              Sequence Initialized
            </span>
            
            <div className="relative h-16 w-[1.5px] overflow-hidden bg-border/20 rounded-full">
              <motion.div 
                animate={{ top: ["-100%", "100%"] }} 
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="absolute w-full h-full bg-gradient-to-b from-transparent via-primary to-transparent shadow-[0_0_15px_var(--primary)]" 
              />
            </div>
          </motion.div>
        </motion.div>
      </LampContainer>
    </section>
  );
};

export default Hero;
