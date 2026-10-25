import { useEffect, useRef, useState } from "react";

// The two edges leave a ramp-shaped opening: the same geometry as the intro.
export function CurbMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`curb-mark ${className}`}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path d="M8 12h19v14L13 40H8V12Z" fill="currentColor" />
      <path d="M56 52H29V38l14-14h13v28Z" fill="currentColor" />
    </svg>
  );
}

export function Splash({ onContinue }: { onContinue: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const completed = useRef(false);
  const onContinueRef = useRef(onContinue);
  onContinueRef.current = onContinue;
  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const leave = window.setTimeout(
      () => setLeaving(true),
      reduced ? 80 : 1650,
    );
    const finish = window.setTimeout(
      () => {
        if (!completed.current) {
          completed.current = true;
          onContinueRef.current();
        }
      },
      reduced ? 100 : 2100,
    );
    return () => {
      window.clearTimeout(leave);
      window.clearTimeout(finish);
    };
  }, []);
  return (
    <div className={`curb-intro${leaving ? " intro-leaving" : ""}`}>
      <div
        className="intro-scene"
        role="img"
        aria-label="Curb. Making a way through."
      >
        <div className="intro-route" aria-hidden="true">
          <span className="intro-edge intro-edge-left" />
          <span className="intro-edge intro-edge-right" />
          <span className="intro-route-line" />
        </div>
        <span className="intro-wordmark">
          curb<span>.</span>
        </span>
      </div>
      <button
        className="intro-skip"
        onClick={() => {
          if (!completed.current) {
            completed.current = true;
            onContinueRef.current();
          }
        }}
      >
        Skip intro
      </button>
    </div>
  );
}
