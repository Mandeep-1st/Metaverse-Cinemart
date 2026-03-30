import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Clapperboard, UserRound, KeyRound, MessageSquareMore, LogOut } from "lucide-react";
import type { AuthUser } from "../../context/AuthContext";
import type { CarouselMovie } from "./MovieCarousel";

export default function Navbar({
  user,
  searchValue,
  onSearchChange,
  searchResults,
  onSelectMovie,
  onOpenRooms,
  onOpenProfile,
  onOpenPassword,
  onOpenFeedback,
  onLogout,
}: {
  user: AuthUser;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchResults: CarouselMovie[];
  onSelectMovie: (movieId: number) => void;
  onOpenRooms: () => void;
  onOpenProfile: () => void;
  onOpenPassword: () => void;
  onOpenFeedback: () => void;
  onLogout: () => void;
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const avatarLabel = user.avatar?.slice(0, 2).toUpperCase() || user.fullName.slice(0, 2).toUpperCase();

  return (
    <nav className="fixed top-0 inset-x-0 z-[110] px-4 sm:px-8 md:px-12 py-5">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-full border border-border/20 bg-background/75 px-4 py-3 backdrop-blur-2xl shadow-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenRooms}
            className="flex items-center gap-2 rounded-full border border-border/20 bg-card/40 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-foreground hover:border-primary/50 transition-colors"
          >
            <Clapperboard className="h-4 w-4 text-primary" />
            Rooms
          </button>
        </div>

        <div className="relative flex-1 max-w-xl">
          <div className="flex items-center gap-3 rounded-full border border-border/20 bg-card/30 px-4 py-3">
            <Search className="h-4 w-4 text-primary" />
            <input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search movies, rooms, or moods"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          <AnimatePresence>
            {searchValue.trim() && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute mt-3 w-full overflow-hidden rounded-[var(--radius)] border border-border/20 bg-background/95 shadow-2xl backdrop-blur-2xl"
              >
                {searchResults.slice(0, 6).map((movie) => (
                  <button
                    key={movie.tmdb_id}
                    onClick={() => onSelectMovie(movie.tmdb_id)}
                    className="flex w-full items-center gap-3 border-b border-border/10 px-4 py-3 text-left hover:bg-card/60 transition-colors last:border-b-0"
                  >
                    <img
                      src={movie.images?.poster || movie.images?.backdrop || "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=900&auto=format&fit=crop"}
                      alt={movie.title}
                      className="h-14 w-10 rounded object-cover"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-foreground truncate">{movie.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {movie.overview || "Open the movie hub"}
                      </div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsProfileOpen((previous) => !previous)}
            className="flex items-center gap-3 rounded-full border border-border/20 bg-card/40 px-3 py-2 text-left hover:border-primary/50 transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-black uppercase">
              {avatarLabel}
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold text-foreground">{user.fullName}</div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Profile
              </div>
            </div>
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute right-0 mt-3 w-72 rounded-[var(--radius)] border border-border/20 bg-background/95 p-3 shadow-2xl backdrop-blur-2xl"
              >
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onOpenProfile();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-card/50"
                >
                  <UserRound className="h-4 w-4 text-primary" />
                  <span className="text-sm text-foreground">Profile</span>
                </button>
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onOpenPassword();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-card/50"
                >
                  <KeyRound className="h-4 w-4 text-primary" />
                  <span className="text-sm text-foreground">Change Password</span>
                </button>
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onOpenFeedback();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-card/50"
                >
                  <MessageSquareMore className="h-4 w-4 text-primary" />
                  <span className="text-sm text-foreground">Feedback</span>
                </button>
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onLogout();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-card/50"
                >
                  <LogOut className="h-4 w-4 text-primary" />
                  <span className="text-sm text-foreground">Logout</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}
