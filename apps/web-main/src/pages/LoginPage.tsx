import { useState } from "react"; 
import { motion } from "framer-motion"; 
import { useNavigate } from "react-router-dom";
import { Lock, Mail, ChevronRight, ScanFace, Database, Eye, EyeOff } from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  // FIX: Explicit HSL strings to prevent the Framer Motion "boxShadow" error
  const shadowNone = "0px 0px 0px 0px hsl(0 100% 65% / 0)";
  const shadowActive = "0px 0px 40px 0px hsl(0 100% 65% / 0.4)";

  return (
    /* 1. ROOT CONTAINER: Forced 'dark' class and semantic background */
    <div className="dark min-h-screen w-full bg-background flex items-center justify-center p-4 md:p-10 relative overflow-hidden font-sans antialiased selection:bg-primary/30">
      
      {/* 2. BACKGROUND ATMOSPHERE: Uses your primary red accent variable */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2072&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-10 blur-2xl scale-125"
          alt="background"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-background via-primary/5 to-background" />
      </div>

      {/* 3. THE LOGIN CONSOLE: Fully responsive grid architecture */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "circOut" }}
        /* Uses global --radius and --shadow-2xl from your CSS */
        className="relative z-10 w-full max-w-6xl grid grid-cols-1 md:grid-cols-5 bg-card/5 backdrop-blur-3xl border border-border/20 rounded-[var(--radius)] overflow-hidden shadow-2xl"
      >
        
        {/* LEFT PANEL: FACE RECOGNITION (Desktop Only) */}
        <div className="hidden md:flex md:col-span-2 bg-background/40 relative items-center justify-center p-12 overflow-hidden border-r border-border/10">
          <motion.div 
            animate={{ rotate: -360 }} 
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            className="absolute w-[450px] h-[450px] border-[1px] border-dashed border-primary/20 rounded-full" 
          />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative">
              <motion.div 
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }} 
                transition={{ repeat: Infinity, duration: 3 }}
                className="bg-primary/10 p-12 rounded-full border-2 border-primary/30 shadow-sm"
              >
                <ScanFace className="w-24 h-24 text-primary" />
              </motion.div>
              
              <motion.div 
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="absolute left-0 right-0 h-[2px] bg-primary shadow-sm z-20"
              />
            </div>

            <h3 className="text-foreground font-black uppercase tracking-widest mt-12 text-lg italic">System key</h3>
            <span className="text-primary font-mono text-[10px] uppercase tracking-widest mt-3 animate-pulse">Analyzing Biometrics...</span>
          </div>
        </div>

        {/* RIGHT PANEL: FORM ACCESS */}
        <div className="col-span-1 md:col-span-3 p-8 md:p-20 flex flex-col justify-center relative bg-background/20">
          
          <div className="flex flex-col gap-4 mb-12">
            <motion.span 
              initial={{ x: -20, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              transition={{ delay: 0.2, duration: 0.6 }} 
              className="text-primary font-black uppercase text-[10px] md:text-[11px] tracking-widest flex items-center gap-3"
            >
              <div className="h-[2px] w-6 bg-primary shadow-xs" /> Verification Protocol
            </motion.span>
            
            <h2 className="text-5xl md:text-8xl font-black text-foreground tracking-tighter uppercase leading-none italic">
              Login<br/>Core
            </h2>
          </div>

          <form className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); navigate('/home'); }}>
            <div className="relative group">
              <Mail className="absolute left-7 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-5 h-5" />
              <input 
                type="email" 
                placeholder="SYSTEM_ID_EMAIL" 
                className="w-full bg-background/40 border border-border/20 rounded-xl py-5 md:py-6 pl-16 pr-8 text-foreground font-bold placeholder:text-muted-foreground tracking-widest text-xs uppercase focus:border-primary/50 focus:outline-none transition-all" 
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-7 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-5 h-5" />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="ACCESS_RESTORE_KEY" 
                className="w-full bg-background/40 border border-border/20 rounded-xl py-5 md:py-6 pl-16 pr-14 text-foreground font-bold placeholder:text-muted-foreground tracking-widest text-xs uppercase focus:border-primary/50 focus:outline-none transition-all" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors z-20"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex justify-end">
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest hover:text-primary cursor-pointer transition-colors">Forget key?</span>
            </div>

            {/* ACTION BUTTON: Corrected shadow animation to prevent warnings */}
            <motion.button 
              initial={{ boxShadow: shadowNone }}
              whileHover={{ 
                scale: 1.02, 
                backgroundColor: "var(--primary)", 
                color: "var(--primary-foreground)", 
                boxShadow: shadowActive 
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/home')}
              className="mt-6 w-full bg-foreground text-background py-6 md:py-7 rounded-2xl md:rounded-3xl font-black uppercase text-[11px] md:text-[12px] tracking-widest flex items-center justify-center gap-4 transition-all group"
            >
              Login <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </motion.button>
          </form>

          <p className="mt-14 text-center text-muted-foreground text-[10px] font-black uppercase tracking-widest">
            Unrecognized ID? <span onClick={() => navigate('/signup')} className="text-foreground cursor-pointer hover:text-primary transition-colors underline underline-offset-4 decoration-border">Initialize New Core</span>
          </p>
        </div>
      </motion.div>

      {/* 4. FOOTER METADATA */}
      <div className="absolute bottom-10 flex gap-10 opacity-10 pointer-events-none">
        <span className="text-foreground text-[9px] font-mono tracking-widest flex items-center gap-2">
          <Database className="w-3 h-3" /> NODE_VER: 2.0.26
        </span>
        <span className="text-foreground text-[9px] font-mono tracking-widest">SSL_TUNNEL: ACTIVE</span>
      </div>
    </div>
  );
};

export default LoginPage;