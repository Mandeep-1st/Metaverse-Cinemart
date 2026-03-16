import { motion } from "framer-motion";
import { Play, Plus, Star, Clock, Calendar, ChevronLeft, Film, Users } from "lucide-react";

// 1. MOCK DATA: In a real app, you would fetch this based on the URL ID (e.g., useParams)
const movieData = {
  title: "INTERSTELLAR",
  tagline: "Mankind was born on Earth. It was never meant to die here.",
  backdrop: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=2072&auto=format&fit=crop",
  poster: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=800&auto=format&fit=crop", // Using Mars as a placeholder poster
  rating: 9.2,
  year: "2014",
  runtime: "2h 49m",
  genres: ["Sci-Fi", "Drama", "Adventure"],
  director: "Christopher Nolan",
  studio: "Paramount Pictures",
  synopsis: "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans. They must travel through a newly discovered wormhole to ensure humanity's survival.",
  cast: [
    { id: 1, name: "Matthew McConaughey", role: "Joseph Cooper", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop" },
    { id: 2, name: "Anne Hathaway", role: "Amelia Brand", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop" },
    { id: 3, name: "Jessica Chastain", role: "Murph Cooper", img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=400&auto=format&fit=crop" },
    { id: 4, name: "Michael Caine", role: "Professor Brand", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop" },
    { id: 5, name: "Matt Damon", role: "Mann", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop" },
  ]
};

const MovieInfo = () => {
  return (
    <div className="dark relative min-h-screen w-full bg-background font-sans antialiased overflow-x-hidden">
      
      {/* 1. CINEMATIC HERO BACKDROP */}
      <div className="relative w-full h-[50vh] sm:h-[60vh] md:h-[75vh] lg:h-[85vh]">
        <div className="absolute top-6 left-6 z-50">
          <button className="flex items-center gap-2 text-foreground/70 hover:text-primary transition-colors bg-background/50 backdrop-blur-md px-4 py-2 rounded-full border border-border/20 shadow-lg group">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Back to Engine</span>
          </button>
        </div>

        <img 
          src={movieData.backdrop} 
          alt="Backdrop" 
          className="w-full h-full object-cover opacity-50 md:opacity-70"
        />
        {/* Gradients to seamlessly blend the image into the background color */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
      </div>

      {/* 2. MAIN CONTENT OVERLAP */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 sm:px-12 -mt-32 sm:-mt-48 md:-mt-64 pb-24">
        <div className="flex flex-col md:flex-row gap-8 md:gap-16">
          
          {/* LEFT COLUMN: Floating Poster */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="w-48 sm:w-64 md:w-80 flex-shrink-0 mx-auto md:mx-0 shadow-[var(--shadow-2xl)] rounded-[var(--radius)] overflow-hidden border border-border/20 bg-card z-30 relative"
          >
            {/* Edge Glow */}
            <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] z-10 pointer-events-none" />
            <img 
              src={movieData.poster} 
              alt={movieData.title} 
              className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
            />
          </motion.div>

          {/* RIGHT COLUMN: Movie Info */}
          <div className="flex flex-col justify-end pt-4 md:pt-20 w-full">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
              
              {/* Tagline & Title */}
              <p className="text-primary font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] text-[10px] sm:text-xs mb-3 md:mb-4 drop-shadow-md">
                {movieData.tagline}
              </p>
              <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-foreground tracking-tighter uppercase italic leading-[0.85] mb-6 md:mb-8 drop-shadow-2xl">
                {movieData.title}
              </h1>

              {/* Quick Stats Row */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-8 mb-8">
                <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-primary text-primary" />
                  <span className="text-foreground font-black text-sm sm:text-lg">{movieData.rating}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground font-bold tracking-widest uppercase text-[10px] sm:text-xs">
                  <Clock className="w-4 h-4" /> {movieData.runtime}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground font-bold tracking-widest uppercase text-[10px] sm:text-xs">
                  <Calendar className="w-4 h-4" /> {movieData.year}
                </div>
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-3 mb-10">
                {movieData.genres.map((genre, i) => (
                  <span key={i} className="px-4 py-1.5 rounded-full border border-border/20 text-muted-foreground text-[10px] sm:text-xs font-black uppercase tracking-widest bg-card/30 backdrop-blur-sm">
                    {genre}
                  </span>
                ))}
              </div>

              {/* Synopsis */}
              <div className="relative border-l-2 border-primary/40 pl-6 mb-12 max-w-3xl">
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed font-light">
                  {movieData.synopsis}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: "var(--shadow-xl)" }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 bg-primary text-primary-foreground px-8 sm:px-12 py-4 rounded-[var(--radius)] font-black uppercase tracking-widest text-[10px] sm:text-xs transition-all shadow-lg"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" /> Initialize Trailer
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05, backgroundColor: "var(--card)" }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 bg-transparent border border-border/40 text-foreground px-8 sm:px-12 py-4 rounded-[var(--radius)] font-black uppercase tracking-widest text-[10px] sm:text-xs hover:border-foreground/50 transition-all"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Add to Queue
                </motion.button>
              </div>

            </motion.div>
          </div>
        </div>

        {/* 3. CAST & CREW SCROLLABLE GRID */}
        <div className="mt-24 sm:mt-32 w-full">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-[2px] w-8 bg-primary shadow-sm" />
            <h3 className="text-foreground font-black uppercase tracking-[0.4em] text-[10px] sm:text-xs flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Verified Subjects // Cast
            </h3>
          </div>

          {/* Horizontal Scroll Container */}
          <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-8 no-scrollbar snap-x snap-mandatory">
            <style dangerouslySetInnerHTML={{ __html: `.no-scrollbar::-webkit-scrollbar { display: none; }` }} />
            {movieData.cast.map((actor, index) => (
              <motion.div 
                key={actor.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex-shrink-0 w-32 sm:w-40 snap-start group cursor-pointer"
              >
                <div className="w-full aspect-[2/3] rounded-[var(--radius)] overflow-hidden bg-card border border-border/20 mb-4 relative shadow-lg group-hover:border-primary/50 transition-colors">
                  <img src={actor.img} alt={actor.name} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60 group-hover:opacity-20 transition-opacity" />
                </div>
                <h4 className="text-foreground font-bold text-xs sm:text-sm tracking-tight leading-tight group-hover:text-primary transition-colors">
                  {actor.name}
                </h4>
                <p className="text-muted-foreground text-[10px] sm:text-xs mt-1 truncate">
                  {actor.role}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 4. TECHNICAL SPECS GRID */}
        <div className="mt-16 sm:mt-24 w-full">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-[2px] w-8 bg-primary shadow-sm" />
            <h3 className="text-foreground font-black uppercase tracking-[0.4em] text-[10px] sm:text-xs flex items-center gap-2">
              <Film className="w-4 h-4 text-primary" /> Engine Data // Specs
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-card/5 border border-border/10 p-6 rounded-[var(--radius)] backdrop-blur-sm">
              <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-2">Director</p>
              <p className="text-foreground font-bold text-sm sm:text-base">{movieData.director}</p>
            </div>
            <div className="bg-card/5 border border-border/10 p-6 rounded-[var(--radius)] backdrop-blur-sm">
              <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-2">Studio</p>
              <p className="text-foreground font-bold text-sm sm:text-base">{movieData.studio}</p>
            </div>
            <div className="bg-card/5 border border-border/10 p-6 rounded-[var(--radius)] backdrop-blur-sm">
              <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-2">Release Format</p>
              <p className="text-foreground font-bold text-sm sm:text-base">IMAX / 70mm</p>
            </div>
            <div className="bg-card/5 border border-border/10 p-6 rounded-[var(--radius)] backdrop-blur-sm">
              <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-2">Engine Confidence</p>
              <p className="text-primary font-black text-sm sm:text-base italic">98.5% MATCH</p>
            </div>
          </div>
        </div>

        {/* 5. DISCUSSION THREAD SLOT
          Import and place your <DiscussionThread /> component right here!
          <div className="mt-32">
            <DiscussionThread />
          </div>
        */}

      </div>
    </div>
  );
};

export default MovieInfo;