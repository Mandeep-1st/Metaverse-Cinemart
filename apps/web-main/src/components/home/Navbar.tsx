import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // This would be your real auth state later
  
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 w-full z-[100] px-6 sm:px-8 md:px-12 py-6 md:py-8 flex justify-between items-start pointer-events-none">
      
      {/* LEFT: ROOMS BUTTON */}
      <div className="flex flex-col items-center gap-1.5 sm:gap-2 pointer-events-auto">
        <motion.button 
          onClick={() => navigate("/rooms")}
          whileHover={{ scale: 1.05 }}
          className="bg-background/80 backdrop-blur-xl border border-border/20 px-5 sm:px-6 py-2 sm:py-2.5 rounded-[var(--radius)] text-[9px] sm:text-[10px] font-black tracking-[0.3em] sm:tracking-[0.4em] uppercase text-foreground hover:border-primary/50 transition-colors shadow-2xl"
        >
          Rooms
        </motion.button>
        {/* THEME FIX: Mapped to --primary and uses global shadow-sm */ }
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: "2rem" }}
          className="h-[2px] bg-primary shadow-sm" 
        />
      </div>

      {/* RIGHT SECTION: Navigation to SignupPage */}
      <div className="pointer-events-auto flex flex-col items-end gap-4">
        {!isLoggedIn ? (
          <motion.button 
            onClick={() => navigate("/signup")} 
            /* THEME FIX: Hooks into your awesome red global --shadow-2xl on hover */
            whileHover={{ scale: 1.05, boxShadow: "var(--shadow-2xl)" }}
            /* THEME FIX: Uses bg-primary and text-primary-foreground */
            className="bg-primary px-6 sm:px-8 py-2 sm:py-2.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-primary-foreground shadow-lg transition-all"
          >
            Sign In
          </motion.button>
        ) : (
          <div className="relative">
            {/* ... Profile Icon & Dropdown Menu logic here ... */}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;