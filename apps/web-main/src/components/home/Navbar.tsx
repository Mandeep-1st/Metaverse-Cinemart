import { motion } from "framer-motion";
import { Clapperboard, Search, UserRound, type LucideIcon } from "lucide-react";

function HintChip({
  shortcut,
  label,
  icon: Icon,
  onClick,
}: {
  shortcut: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-2 rounded-full border border-border/15 bg-card/35 px-3 py-2 text-left transition-all hover:border-primary/30 hover:bg-card/55"
    >
      <Icon className="h-3.5 w-3.5 text-primary/85" />
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">
        {shortcut}
      </span>
      <span className="hidden text-xs text-muted-foreground sm:inline">{label}</span>
    </button>
  );
}

export default function Navbar({
  onOpenCommandPalette,
  onOpenRooms,
  onOpenProfile,
}: {
  onOpenCommandPalette: () => void;
  onOpenRooms: () => void;
  onOpenProfile: () => void;
}) {
  return (
    <nav className="fixed inset-x-0 top-0 z-[110] px-4 py-5 sm:px-8 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="mx-auto flex max-w-7xl flex-col gap-3 rounded-[32px] border border-border/15 bg-background/70 px-4 py-4 shadow-2xl backdrop-blur-2xl md:flex-row md:items-center md:justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Clapperboard className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.42em] text-primary">
              Metaverse Cinema
            </div>
            <div className="mt-1 text-sm text-foreground/80">
              Keyboard-first navigation for rooms, search, and profile flow.
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35, ease: "easeOut" }}
          className="flex flex-wrap items-center gap-2"
        >
          <HintChip
            shortcut="Ctrl + K"
            label="to search"
            icon={Search}
            onClick={onOpenCommandPalette}
          />
          <HintChip
            shortcut="Ctrl + R"
            label="Rooms"
            icon={Clapperboard}
            onClick={onOpenRooms}
          />
          <HintChip
            shortcut="Ctrl + P"
            label="Profile"
            icon={UserRound}
            onClick={onOpenProfile}
          />
        </motion.div>
      </motion.div>
    </nav>
  );
}
