export type ToastTone = "success" | "error" | "info";

export type ToastPayload = {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
  durationMs?: number;
};

type ToastListener = (toast: ToastPayload) => void;

const listeners = new Set<ToastListener>();

function emitToast(toast: Omit<ToastPayload, "id">) {
  const payload: ToastPayload = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    durationMs: 3800,
    ...toast,
  };

  listeners.forEach((listener) => listener(payload));
}

export function subscribeToasts(listener: ToastListener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export const toast = {
  success(title: string, description?: string) {
    emitToast({ tone: "success", title, description });
  },
  error(title: string, description?: string) {
    emitToast({ tone: "error", title, description });
  },
  info(title: string, description?: string) {
    emitToast({ tone: "info", title, description });
  },
};
