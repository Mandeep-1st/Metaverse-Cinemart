import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { useEffect, useState } from "react";
import { subscribeToasts, type ToastPayload } from "../../utils/toast";

const toneConfig = {
  success: {
    icon: CheckCircle2,
    iconClassName: "text-emerald-300",
    borderClassName: "border-emerald-400/20",
    glowClassName: "from-emerald-400/16 to-transparent",
  },
  error: {
    icon: CircleAlert,
    iconClassName: "text-amber-300",
    borderClassName: "border-amber-400/20",
    glowClassName: "from-amber-400/16 to-transparent",
  },
  info: {
    icon: Info,
    iconClassName: "text-sky-300",
    borderClassName: "border-sky-400/20",
    glowClassName: "from-sky-400/16 to-transparent",
  },
} as const;

export function ToastViewport() {
  const [toasts, setToasts] = useState<ToastPayload[]>([]);

  useEffect(() => {
    return subscribeToasts((toast) => {
      setToasts((previous) => [...previous, toast]);

      window.setTimeout(() => {
        setToasts((previous) => previous.filter((item) => item.id !== toast.id));
      }, toast.durationMs ?? 3800);
    });
  }, []);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[230] flex w-full max-w-sm flex-col gap-3 sm:right-6 sm:top-6">
      <AnimatePresence>
        {toasts.map((toast) => {
          const config = toneConfig[toast.tone];
          const Icon = config.icon;

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 28, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 18, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`pointer-events-auto relative overflow-hidden rounded-[26px] border bg-[#16120e]/96 p-4 text-white shadow-[0_22px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl ${config.borderClassName}`}
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] ${config.glowClassName}`}
              />
              <div className="relative flex items-start gap-3">
                <div className={`mt-0.5 rounded-2xl bg-black/25 p-2 ${config.iconClassName}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-black uppercase tracking-[0.18em] text-white">
                    {toast.title}
                  </div>
                  {toast.description && (
                    <div className="mt-2 text-sm leading-6 text-white/65">
                      {toast.description}
                    </div>
                  )}
                </div>
                <button
                  onClick={() =>
                    setToasts((previous) => previous.filter((item) => item.id !== toast.id))
                  }
                  className="rounded-full border border-white/10 bg-white/5 p-2 text-white/45 transition-colors hover:text-white"
                  aria-label="Dismiss notification"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
