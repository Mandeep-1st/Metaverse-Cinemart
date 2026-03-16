import { motion } from "framer-motion";

const BottomCTA = () => {
  return (
    /* 1. ROOT SECTION: Forces 'dark' theme and pulls from Geist font (--font-sans) */
    <section className="dark relative py-32 md:py-60 bg-background overflow-hidden flex items-center justify-center font-sans antialiased">
      
      {/* 2. DYNAMIC TOP DIVIDER: Uses --primary and shadow-sm variables */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent shadow-sm" />

      {/* 3. THEME GLOW: Driven by --shadow-color and oklch primary values */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1200px] h-[500px] bg-primary/5 blur-[160px] rounded-full pointer-events-none opacity-50" />

      <div className="max-w-5xl mx-auto px-6 text-center relative z-10">

        {/* 4. STATUS PILL: Fully mapped to --card, --border, and --shadow-2xl */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-4 mb-10 md:mb-16 px-7 py-2.5 rounded-full border border-border/30 bg-card/20 backdrop-blur-3xl shadow-2xl"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary shadow-[0_0_10px_var(--primary)]"></span>
          </span>
          <span className="text-[10px] md:text-[12px] uppercase tracking-widest text-muted-foreground font-black">
            System Analysis Complete
          </span>
        </motion.div>

        {/* 5. HERO HEADLINE: Using --tracking-tighter and --primary-foreground */}
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-5xl md:text-8xl font-black text-foreground tracking-tighter leading-[0.9] uppercase mb-10"
        >
          Discover films <br />
          <motion.span 
            animate={{ 
              textShadow: [
                "0 0 20px rgba(220,38,38,0)", 
                "0 0 50px rgba(220,38,38,0.6)", 
                "0 0 20px rgba(220,38,38,0)"
              ] 
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="text-transparent bg-clip-text bg-gradient-to-b from-primary via-primary/80 to-primary/40 italic"
          >
            that stay with you.
          </motion.span>
        </motion.h2>

        {/* 6. RESPONSIVE DESCRIPTION: Mapped to --muted-foreground */}
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
          viewport={{ once: true }}
          className="text-base md:text-2xl text-muted-foreground font-light leading-relaxed tracking-wide italic max-w-3xl mx-auto"
        >
          "CineSmart helps you spend less time searching and more time watching 
          movies that <span className="text-foreground font-bold not-italic decoration-primary/40 underline underline-offset-8">actually resonate</span> with you."
        </motion.p>

      </div>

      {/* 7. BOTTOM FLOOR GLOW: Mapped to --primary and --shadow-xl */}
      <div className="absolute bottom-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-xl opacity-30" />
    </section>
  );
};

export default BottomCTA;