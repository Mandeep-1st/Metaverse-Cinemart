import { useEffect, useRef } from "react";
import { LoadingSpinner } from "@repo/ui/components/loading-spinner";

declare global {
  interface Window {
    google?: any;
  }
}

type GoogleSignInButtonProps = {
  onCredential: (credential: string) => void;
  disabled?: boolean;
};

export default function GoogleSignInButton({
  onCredential,
  disabled = false,
}: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !buttonRef.current || disabled) {
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-google-identity="true"]',
    );

    const initGoogle = () => {
      if (!window.google || !buttonRef.current) return;

      buttonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: { credential: string }) => {
          if (response.credential) {
            onCredential(response.credential);
          }
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "filled_black",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width: 320,
      });
    };

    if (existingScript) {
      if (window.google) {
        initGoogle();
      } else {
        existingScript.addEventListener("load", initGoogle, { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "true";
    script.addEventListener("load", initGoogle, { once: true });
    document.head.appendChild(script);

    return () => {
      script.removeEventListener("load", initGoogle);
    };
  }, [clientId, disabled, onCredential]);

  if (!clientId) {
    return (
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        Add `VITE_GOOGLE_CLIENT_ID` to enable Google sign-in.
      </div>
    );
  }

  if (disabled) {
    return (
      <div className="flex min-h-[44px] w-full max-w-[320px] items-center justify-center gap-2 rounded-full border border-border/20 bg-card/20 px-4 py-3 text-[10px] font-black uppercase tracking-[0.32em] text-muted-foreground">
        <LoadingSpinner className="h-3.5 w-3.5" />
        Processing
      </div>
    );
  }

  return <div ref={buttonRef} className="min-h-[44px]" />;
}
