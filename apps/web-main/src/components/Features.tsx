import { motion } from "framer-motion";

const features = [
  {
    title: "Understands your taste",
    description: "CineSmart learns what you actually enjoy watching — not just what’s trending — and adapts recommendations over time.",
    icon: "🧠",
  },
  {
    title: "Curated, not crowded",
    description: "Instead of endless scrolling, you get a refined selection of films picked for your mood, genre preferences, and watch history.",
    icon: "🎬",
  },
  {
    title: "Designed for cinema lovers",
    description: "Every interaction is crafted to stay out of the way, so the focus remains on stories, visuals, and the experience of film.",
    icon: "❤️",
  },
];

const Features = () => {
  return (
    /* Standard block flow guarantees it renders exactly where you place it */
    <section className="dark relative block w-full bg-background pt-24 pb-24 sm:pt-32 sm:pb-32 px-6 overflow-hidden font-sans antialiased border-t border-border/10 isolate">
      
      {/* Background glow clamped to top of section */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-primary/5 blur-[120px] rounded-full pointer-events-none opacity-40" />

      <div className="max-w-7xl mx-auto w-full relative z-10">

        <div className="max-w-3xl mb-16 sm:mb-20 md:mb-24 flex flex-col items-start w-full">
          <motion.div 
            initial={{ opacity: 0, x: -15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-3 md:gap-4 mb-8"
          >
            <div className="h-[2px] w-10 bg-primary shadow-sm" />
            <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px] md:text-xs">
              Engine Core
            </span>
          </motion.div>

          <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-foreground tracking-tighter leading-[1.05] uppercase italic">
            A smarter way <br />
            <span className="text-muted-foreground not-italic opacity-40">to discover cinema.</span>
          </h2>
        </div>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover="hover"
              className="group relative p-8 md:p-10 rounded-[var(--radius)] bg-card/5 border border-border/10 backdrop-blur-3xl transition-all duration-500 hover:border-primary/40 hover:bg-card/10 shadow-2xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <motion.div 
                variants={{ hover: { scale: 1.1, rotate: [0, -5, 5, 0] } }}
                className="mb-8 h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-background border border-border/20 flex items-center justify-center text-2xl sm:text-3xl group-hover:border-primary/30 transition-all shadow-inner relative z-10"
              >
                {feature.icon}
              </motion.div>

              <motion.h3 
                variants={{ hover: { x: 2 } }}
                className="text-xl md:text-2xl font-black text-foreground mb-4 tracking-tight uppercase group-hover:text-primary transition-colors relative z-10"
              >
                {feature.title}
              </motion.h3>

              <motion.p 
                className="text-muted-foreground text-sm md:text-base leading-relaxed font-light tracking-wide transition-colors relative z-10 group-hover:text-foreground/80"
              >
                {feature.description}
              </motion.p>

              <div className="mt-10 overflow-hidden h-px w-full bg-border/10 relative z-10">
                <motion.div 
                  variants={{ 
                    hover: { 
                      x: ["-100%", "100%"],
                      transition: { repeat: Infinity, duration: 2, ease: "linear" } 
                    } 
                  }}
                  initial={{ x: "-100%" }}
                  whileInView={{ x: "0%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                  className="h-full w-full bg-gradient-to-r from-transparent via-primary/60 to-transparent shadow-sm" 
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* THIS EXPORT IS CRITICAL TO FIX YOUR VITE ERROR */
export default Features;
