import React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const movies = [
  {
    id: 157336,
    title: "Interstellar",
    image:
      "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=500&auto=format&fit=crop",
    rating: "9.2",
    year: "2014",
    genre: "Sci-Fi",
    desc: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
  },
  {
    id: 27205,
    title: "Inception",
    image:
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=500&auto=format&fit=crop",
    rating: "8.8",
    year: "2010",
    genre: "Action",
    desc: "A thief who steals corporate secrets through the use of dream-sharing technology.",
  },
  {
    id: 155,
    title: "The Dark Knight",
    image:
      "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=500&auto=format&fit=crop",
    rating: "9.0",
    year: "2008",
    genre: "Drama",
    desc: "When the Joker wreaks havoc and chaos on the people of Gotham.",
  },
  {
    id: 36557,
    title: "The Martian",
    image:
      "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=500&auto=format&fit=crop",
    rating: "8.0",
    year: "2015",
    genre: "Adventure",
    desc: "An astronaut becomes stranded on Mars after his team assume him dead.",
  },
];

const MovieCard = ({
  movie,
  index,
}: {
  movie: { id: number; title: string; image: string; rating: string; year: string; genre: string; desc: string };
  index: number;
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      onClick={() => {
        window.location.assign(`/movies/${movie.id}`);
      }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="group relative h-[400px] sm:h-[450px] w-full cursor-pointer perspective-1000"
    >
      <div className="absolute -inset-2 rounded-[var(--radius)] bg-primary/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative h-full w-full rounded-[var(--radius)] border border-border/20 bg-card overflow-hidden shadow-2xl transition-all group-hover:border-primary/50">
        <img src={movie.image} alt={movie.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        <div className="absolute top-4 right-4 z-20">
          <div className="flex items-center gap-2 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/20 shadow-sm">
            <span className="text-primary text-[10px] font-black italic uppercase">IMDb</span>
            <span className="text-foreground font-bold text-xs">{movie.rating}</span>
          </div>
        </div>

        <div style={{ transform: "translateZ(40px)" }} className="absolute bottom-0 left-0 w-full p-6 sm:p-8 z-20 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-[2px] w-6 sm:w-8 bg-primary shadow-xs transition-all group-hover:w-12" />
            <p className="text-primary text-[10px] font-black uppercase tracking-widest">{movie.genre}</p>
          </div>
          <h4 className="text-2xl sm:text-3xl font-black text-foreground tracking-tighter mb-3 uppercase leading-none italic">{movie.title}</h4>
          <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">{movie.desc}</p>
        </div>
      </div>
    </motion.div>
  );
};

const MovieShowcase = () => {
  return (
    /* Standard block flow guarantees this pushes down whatever comes next */
    <section className="dark relative block w-full bg-background pt-16 pb-20 sm:py-24 md:py-32 px-6 overflow-hidden font-sans antialiased border-b border-border/10 isolate">
      <div className="max-w-7xl mx-auto w-full relative z-10">
        
        <div className="mb-16 sm:mb-20 md:mb-28 flex flex-col lg:flex-row lg:items-end justify-between gap-8 md:gap-12 w-full">
          <div className="relative">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
              <div className="h-[2px] w-8 md:w-12 bg-primary shadow-sm" />
              <span className="text-primary font-black uppercase tracking-[0.4em] text-[9px] md:text-xs">Engine Recommendations</span>
            </motion.div>
            
            <h2 className="text-6xl sm:text-8xl md:text-9xl lg:text-[10rem] font-black text-foreground tracking-tighter leading-[0.85] uppercase">
              TOP <br /> 
              <motion.span animate={{ textShadow: ["0 0 15px rgba(220,38,38,0)", "0 0 40px rgba(220,38,38,0.4)", "0 0 15px rgba(220,38,38,0)"] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="text-transparent bg-clip-text bg-gradient-to-b from-primary via-primary/80 to-primary/40 italic">PICKS</motion.span>
            </h2>
          </div>

          <div className="relative max-w-xl pb-4 md:pb-6 w-full">
            <motion.div initial={{ height: 0 }} whileInView={{ height: "100%" }} transition={{ duration: 1.5, ease: "circOut" }} className="absolute left-0 top-0 w-[2px] bg-gradient-to-b from-primary via-primary/50 to-transparent shadow-sm hidden md:block" />
            <div className="md:pl-12">
              <p className="text-muted-foreground text-lg sm:text-xl md:text-3xl font-light leading-snug tracking-wide italic">"Curated by intelligence, <span className="text-muted-foreground/40 italic">driven by taste.</span> These titles represent the absolute pinnacle of your history."</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-10 w-full">
          {movies.map((movie, index) => <MovieCard key={movie.id} movie={movie} index={index} />)}
        </div>
      </div>
    </section>
  );
};

/* THIS EXPORT IS CRITICAL TO FIX YOUR VITE ERROR */
export default MovieShowcase;
