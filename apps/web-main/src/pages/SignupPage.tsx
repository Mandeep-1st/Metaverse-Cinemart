import { useState } from "react"; 
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, ChevronRight, ScanFace, Eye, EyeOff } from "lucide-react";

const SignupPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="dark min-h-screen w-full bg-background flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden font-sans antialiased selection:bg-primary/30">
      
      {/* 1. ATMOSPHERIC BACKDROP */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2072&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-20 blur-xl scale-125"
          alt="background"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background" />
      </div>

      {/* 2. THE SIGNUP CONSOLE */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "circOut" }}
        className="relative z-10 w-full max-w-6xl grid md:grid-cols-5 bg-card/10 backdrop-blur-3xl border border-border/40 rounded-[var(--radius)] overflow-hidden shadow-2xl"
      >
        
        {/* LEFT PANEL: DYNAMIC VISUAL CORE (Hidden on Mobile) */}
        <div className="hidden md:flex md:col-span-2 bg-background/60 relative items-center justify-center p-12 overflow-hidden">
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            className="absolute w-[400px] h-[400px] border-[1px] border-dashed border-primary/30 rounded-full" 
          />
          <div className="relative z-10 flex flex-col items-center">
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              className="bg-primary/20 p-8 rounded-full border-2 border-primary/50 shadow-sm"
            >
              <ScanFace className="w-16 h-16 text-primary" />
            </motion.div>
            <h3 className="text-foreground font-black uppercase tracking-widest mt-8 text-lg">Identity Grid</h3>
            <span className="text-primary font-mono text-[9px] uppercase tracking-widest mt-2 animate-pulse">Scanning Core...</span>
          </div>
        </div>

        {/* RIGHT PANEL: FORM ACCESS */}
        {/* RESPONSIVE FIX: Reduced padding on mobile (p-6) and scaled up for desktop (md:p-20) */}
        <div className="md:col-span-3 p-6 sm:p-10 md:p-16 lg:p-20 flex flex-col justify-center min-h-[80vh] md:min-h-0">
          
          <div className="flex flex-col gap-3 sm:gap-4 mb-8 sm:mb-12 md:mb-14">
            <motion.span 
              initial={{ x: -20, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              transition={{ delay: 0.3, duration: 0.6 }} 
              className="text-primary font-black uppercase text-[9px] sm:text-[11px] tracking-wider flex items-center gap-3"
            >
              <div className="h-[2px] w-4 sm:w-6 bg-primary shadow-xs" /> Security Protocol
            </motion.span>
            
            {/* RESPONSIVE FIX: Text scaled down to 4xl on mobile to prevent awkward line breaks */}
            <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-foreground tracking-tighter uppercase leading-[0.9] italic">
              Create <br className="hidden sm:block" /> Account
            </h2>
          </div>

          {/* RESPONSIVE FIX: Reduced gap between inputs on mobile */}
          <form className="flex flex-col gap-4 sm:gap-6" onSubmit={(e) => { e.preventDefault(); navigate('/login'); }}>
            
            <div className="relative group">
              <User className="absolute left-4 sm:left-7 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-4 h-4 sm:w-5 sm:h-5" />
              {/* RESPONSIVE FIX: Padding y scaled from py-4 to py-6 */}
              <input type="text" placeholder="IDENT_NAME" className="w-full bg-background/60 border border-border/20 rounded-xl py-4 sm:py-5 md:py-6 pl-12 sm:pl-16 pr-4 sm:pr-8 text-foreground font-bold placeholder:text-muted-foreground tracking-widest text-[10px] sm:text-xs uppercase focus:border-primary/50 focus:outline-none transition-all" />
            </div>

            <div className="relative group">
              <Mail className="absolute left-4 sm:left-7 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-4 h-4 sm:w-5 sm:h-5" />
              <input type="email" placeholder="IDENT_EMAIL" className="w-full bg-background/60 border border-border/20 rounded-xl py-4 sm:py-5 md:py-6 pl-12 sm:pl-16 pr-4 sm:pr-8 text-foreground font-bold placeholder:text-muted-foreground tracking-widest text-[10px] sm:text-xs uppercase focus:border-primary/50 focus:outline-none transition-all" />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 sm:left-7 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-4 h-4 sm:w-5 sm:h-5" />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="ACCESS_KEY" 
                className="w-full bg-background/60 border border-border/20 rounded-xl py-4 sm:py-5 md:py-6 pl-12 sm:pl-16 pr-12 sm:pr-14 text-foreground font-bold placeholder:text-muted-foreground tracking-widest text-[10px] sm:text-xs uppercase focus:border-primary/50 focus:outline-none transition-all" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors z-20"
              >
                {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02, backgroundColor: "var(--primary)", color: "var(--primary-foreground)", boxShadow: "var(--shadow-md)" }}
              whileTap={{ scale: 0.98 }}

              className="mt-4 sm:mt-6 md:mt-10 w-full bg-foreground text-background py-4 sm:py-5 md:py-6 rounded-xl font-black uppercase text-[10px] sm:text-[11px] tracking-widest flex items-center justify-center gap-2 sm:gap-3 transition-all"
            >
              Sign Up
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
          </form>

          <p className="mt-8 sm:mt-12 text-center text-muted-foreground text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
            System Access? <span onClick={() => navigate('/login')} className="text-foreground cursor-pointer hover:text-primary transition-colors underline underline-offset-4 decoration-border">Login Core</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SignupPage;