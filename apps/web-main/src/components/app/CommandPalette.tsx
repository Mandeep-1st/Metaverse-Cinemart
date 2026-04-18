import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Command,
  Film,
  Search,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export type CommandPaletteItem =
  | {
      id: string;
      type: "action";
      icon: LucideIcon;
      label: string;
      description: string;
      shortcut?: string;
      onSelect: () => void;
    }
  | {
      id: string;
      type: "movie";
      label: string;
      description: string;
      poster?: string | null;
      meta?: string;
      onSelect: () => void;
    };

const fallbackPoster =
  "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=900&auto=format&fit=crop";

function CommandPaletteContent({
  query,
  onQueryChange,
  onClose,
  items,
  searching,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  items: CommandPaletteItem[];
  searching: boolean;
}) {
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const activeIndex = useMemo(() => {
    if (!activeItemId) {
      return 0;
    }

    const foundIndex = items.findIndex((item) => item.id === activeItemId);
    return foundIndex >= 0 ? foundIndex : 0;
  }, [activeItemId, items]);

  useEffect(() => {
    const target = itemRefs.current[activeIndex];
    target?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const showEmptyState = !searching && query.trim().length > 0 && items.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.99 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="w-full max-w-3xl overflow-hidden rounded-[32px] border border-white/10 bg-[#11100d]/95 shadow-[0_30px_90px_rgba(0,0,0,0.5)]"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top,_rgba(244,182,61,0.22),_transparent_52%)] px-5 py-5">
        <div className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
          <Search className="h-5 w-5 text-primary" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                const nextIndex = items.length === 0 ? 0 : Math.min(activeIndex + 1, items.length - 1);
                setActiveItemId(items[nextIndex]?.id || null);
                return;
              }

              if (event.key === "ArrowUp") {
                event.preventDefault();
                const previousIndex = Math.max(activeIndex - 1, 0);
                setActiveItemId(items[previousIndex]?.id || null);
                return;
              }

              if (event.key === "Enter") {
                event.preventDefault();
                items[activeIndex]?.onSelect();
                return;
              }

              if (event.key === "Escape") {
                event.preventDefault();
                onClose();
              }
            }}
            placeholder="Search movies, jump to rooms, or open profile actions"
            className="w-full bg-transparent text-base text-white outline-none placeholder:text-white/35"
          />
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-[10px] font-black uppercase tracking-[0.32em] text-white/45 sm:flex">
            <Command className="h-3.5 w-3.5" />
            Ctrl + K
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.3em] text-white/40">
          <span className="rounded-full border border-white/10 px-3 py-2">
            Ctrl + R to open rooms
          </span>
          <span className="rounded-full border border-white/10 px-3 py-2">
            Ctrl + P for profile
          </span>
          <span className="rounded-full border border-white/10 px-3 py-2">
            Arrow keys + Enter
          </span>
        </div>
      </div>

      <div className="max-h-[60vh] overflow-y-auto px-3 py-3">
        {items.map((item, index) => {
          const isActive = index === activeIndex;

          if (item.type === "movie") {
            return (
              <button
                key={item.id}
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                onMouseEnter={() => setActiveItemId(item.id)}
                onClick={item.onSelect}
                className={`mb-2 flex w-full items-center gap-4 rounded-[24px] border px-3 py-3 text-left transition-all ${
                  isActive
                    ? "border-primary/40 bg-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.25)]"
                    : "border-transparent bg-transparent hover:border-white/10 hover:bg-white/5"
                }`}
              >
                <img
                  src={item.poster || fallbackPoster}
                  alt={item.label}
                  className="h-20 w-14 rounded-2xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="truncate text-base font-black text-white">
                      {item.label}
                    </div>
                    {item.meta && (
                      <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-primary">
                        {item.meta}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 line-clamp-2 text-sm leading-6 text-white/55">
                    {item.description}
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-white/30" />
              </button>
            );
          }

          const ItemIcon = item.icon;

          return (
            <button
              key={item.id}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              onMouseEnter={() => setActiveItemId(item.id)}
              onClick={item.onSelect}
              className={`mb-2 flex w-full items-center gap-4 rounded-[24px] border px-4 py-4 text-left transition-all ${
                isActive
                  ? "border-primary/40 bg-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.25)]"
                  : "border-transparent bg-transparent hover:border-white/10 hover:bg-white/5"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <ItemIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-black uppercase tracking-[0.18em] text-white">
                  {item.label}
                </div>
                <div className="mt-1 text-sm text-white/55">{item.description}</div>
              </div>
              {item.shortcut ? (
                <div className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-white/45">
                  {item.shortcut}
                </div>
              ) : (
                <ArrowRight className="h-5 w-5 text-white/30" />
              )}
            </button>
          );
        })}

        {searching && (
          <div className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/5 px-4 py-5 text-sm text-white/55">
            <Search className="h-4 w-4 animate-pulse text-primary" />
            Scanning the catalog...
          </div>
        )}

        {showEmptyState && (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-white/5 px-5 py-8 text-center">
            <Film className="mx-auto h-10 w-10 text-primary/70" />
            <div className="mt-4 text-sm font-black uppercase tracking-[0.25em] text-white">
              No close matches
            </div>
            <p className="mt-3 text-sm leading-6 text-white/50">
              Try another title, or use the quick actions to move around the app.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function CommandPalette({
  isOpen,
  query,
  onQueryChange,
  onClose,
  items,
  searching,
}: {
  isOpen: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  items: CommandPaletteItem[];
  searching: boolean;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="command-palette"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[180] flex items-start justify-center bg-black/70 px-4 pb-8 pt-24 backdrop-blur-md"
          onClick={onClose}
        >
          <CommandPaletteContent
            query={query}
            onQueryChange={onQueryChange}
            onClose={onClose}
            items={items}
            searching={searching}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
