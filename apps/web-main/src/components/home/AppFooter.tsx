import { motion } from "framer-motion";
import {
  Clapperboard,
  Command,
  Search,
  UserRound,
  type LucideIcon,
} from "lucide-react";

type FooterAction = {
  id: "search" | "rooms" | "profile";
  label: string;
  shortcut: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
};

function FooterActionCard({
  action,
  active,
}: {
  action: FooterAction;
  active: boolean;
}) {
  const Icon = action.icon;

  return (
    <button
      type="button"
      onClick={action.onClick}
      className={`group rounded-[28px] border p-4 text-left transition-all ${
        active
          ? "border-primary/35 bg-primary/10 shadow-[0_20px_45px_rgba(0,0,0,0.28)]"
          : "border-white/10 bg-white/[0.04] hover:border-primary/20 hover:bg-white/[0.07]"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-white/45">
          {action.shortcut}
        </div>
      </div>

      <div className="mt-4 text-sm font-black uppercase tracking-[0.2em] text-white">
        {action.label}
      </div>
      <p className="mt-2 text-sm leading-6 text-white/55">{action.description}</p>
    </button>
  );
}

export default function AppFooter({
  onOpenCommandPalette,
  onOpenRooms,
  onOpenProfile,
  activeAction,
}: {
  onOpenCommandPalette: () => void;
  onOpenRooms: () => void;
  onOpenProfile: () => void;
  activeAction?: FooterAction["id"];
}) {
  const actions: FooterAction[] = [
    {
      id: "search",
      label: "Search & Actions",
      shortcut: "Ctrl + K",
      description: "Open the command palette to search titles or jump through the app.",
      icon: Search,
      onClick: onOpenCommandPalette,
    },
    {
      id: "rooms",
      label: "Rooms",
      shortcut: "Ctrl + R",
      description: "Jump straight into your watch-party dashboard and active share links.",
      icon: Clapperboard,
      onClick: onOpenRooms,
    },
    {
      id: "profile",
      label: "Profile Suite",
      shortcut: "Ctrl + P",
      description: "Open account controls, avatar updates, and feedback from one place.",
      icon: UserRound,
      onClick: onOpenProfile,
    },
  ];

  return (
    <footer className="relative z-20 border-t border-white/10 bg-[linear-gradient(180deg,rgba(10,9,7,0.25),rgba(10,9,7,0.95))]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="mx-auto grid max-w-7xl gap-8 px-6 py-10 sm:px-12 xl:grid-cols-[1.05fr_0.95fr]"
      >
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-[0.34em] text-primary">
            <Command className="h-3.5 w-3.5" />
            Keyboard Footer
          </div>
          <h2 className="mt-5 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
            Navigation lives in the shortcuts now.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/60">
            The top bar is gone, but every key route still stays one shortcut away.
            Use the footer for a mouse-friendly fallback without bringing the navbar
            back.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {actions.map((action) => (
            <FooterActionCard
              key={action.id}
              action={action}
              active={activeAction === action.id}
            />
          ))}
        </div>
      </motion.div>
    </footer>
  );
}
