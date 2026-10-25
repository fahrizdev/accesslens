import { useEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";

export function LensMark({ className = "" }: { className?: string }) {
  return (
    <span className={`lens-mark ${className}`} aria-hidden="true">
      <span className="lens-aura" />
      <svg viewBox="0 0 100 100" fill="none">
        <path
          d="M50 9C47 30 38 39 17 42C34 44 43 39 50 27C57 39 66 44 83 42C62 39 53 30 50 9Z"
          fill="currentColor"
        />
        <path
          d="M50 91C47 70 38 61 17 58C34 56 43 61 50 73C57 61 66 56 83 58C62 61 53 70 50 91Z"
          fill="currentColor"
        />
        <circle cx="50" cy="50" r="9" fill="currentColor" />
      </svg>
    </span>
  );
}

export function Splash({ onContinue }: { onContinue: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const [buttonReady, setButtonReady] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const exitTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    const reveal = window.setTimeout(() => setButtonReady(true), 1100);
    return () => {
      window.clearTimeout(reveal);
      window.clearTimeout(exitTimer.current);
    };
  }, []);

  function enterApp() {
    if (leaving) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onContinue();
      return;
    }
    setLeaving(true);
    exitTimer.current = window.setTimeout(onContinue, 300);
  }

  return (
    <div className={`launch-screen${leaving ? " launch-leaving" : ""}`}>
      <div className="launch-center" role="img" aria-label="Via">
        <LensMark className="launch-mark" />
        <span className="launch-wordmark">Via</span>
      </div>
      {buttonReady && (
        <button
          className="launch-enter gradient-circle"
          aria-label="Open Via"
          onClick={enterApp}
          disabled={leaving}
        >
          <ArrowDown size={28} strokeWidth={1.7} />
        </button>
      )}
    </div>
  );
}
