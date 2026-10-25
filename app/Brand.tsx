import { useEffect, useState } from "react";
import { Camera, CircleCheck, FileText, Lock } from "lucide-react";

// Eight rounded spokes, tilted slightly: a friendly spark that doubles as a wheel.
export function CurbMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`curb-mark ${className}`}
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      <g
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
        transform="rotate(12 32 32)"
      >
        <path d="M32 22V6M32 42V58M22 32H6M42 32H58" />
        <path d="M39.1 24.9 45.4 18.6M24.9 24.9 18.6 18.6M39.1 39.1 45.4 45.4M24.9 39.1 18.6 45.4" />
      </g>
    </svg>
  );
}

const reducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

// The logo springs in, holds for a beat, then zooms through into the app.
export function Launch() {
  const [phase, setPhase] = useState<"in" | "out" | "done">("in");
  useEffect(() => {
    const quick = reducedMotion();
    const leave = window.setTimeout(() => setPhase("out"), quick ? 300 : 1000);
    const done = window.setTimeout(() => setPhase("done"), quick ? 600 : 1450);
    return () => {
      clearTimeout(leave);
      clearTimeout(done);
    };
  }, []);
  if (phase === "done") return null;
  return (
    <div className={`launch launch-${phase}`} aria-hidden="true">
      <CurbMark />
    </div>
  );
}

const welcomeFeatures = [
  {
    icon: Camera,
    title: "Snap a barrier",
    text: "A blocked ramp, a stairs-only entrance or a broken path. One photo is enough.",
  },
  {
    icon: FileText,
    title: "Get a ready-to-send report",
    text: "Curb writes it up and finds your local representative.",
  },
  {
    icon: CircleCheck,
    title: "See it through",
    text: "Track every report from sent to resolved.",
  },
];

export function Welcome({ onContinue }: { onContinue: () => void }) {
  return (
    <main className="welcome">
      <div className="welcome-top enter">
        <span className="app-icon">
          <CurbMark />
        </span>
        <h1>Welcome to Curb</h1>
      </div>
      <ul className="welcome-features">
        {welcomeFeatures.map(({ icon: Icon, title, text }, index) => (
          <li
            key={title}
            className="enter"
            style={{ animationDelay: `${150 + index * 100}ms` }}
          >
            <Icon size={32} strokeWidth={1.7} aria-hidden="true" />
            <div>
              <b>{title}</b>
              <p>{text}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="welcome-bottom enter" style={{ animationDelay: "500ms" }}>
        <p className="footnote">
          <Lock size={13} aria-hidden="true" /> Your reports stay on this phone.
        </p>
        <button className="button-primary full" onClick={onContinue}>
          Continue
        </button>
      </div>
    </main>
  );
}
