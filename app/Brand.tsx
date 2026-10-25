import { useEffect, useState } from "react";
import { LAUNCH_KEY, readPreference, writePreference } from "./preferences";

// A curb cut: the sidewalk steps down a ramp to the street, with a wheel
// resting at the bottom. The wheel is its own element so it can roll.
export function CurbMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`curb-mark ${className}`}
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      <g transform="translate(0 -5)">
        <path
          className="curb-ramp"
          d="M7 28H19L37 41H57V47H7Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <g className="curb-wheel">
          <circle
            cx="47"
            cy="31.5"
            r="5.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
          />
          <circle cx="47" cy="31.5" r="1.7" fill="currentColor" />
        </g>
      </g>
    </svg>
  );
}

const today = () => new Date().toDateString();
const reducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

// The wheel rolls down the ramp, then the mark zooms through into the app.
// Shown once a day so opening the app in the moment stays instant.
export function Launch() {
  const [phase, setPhase] = useState<"in" | "out" | "done">(() =>
    readPreference(LAUNCH_KEY) === today() || reducedMotion() ? "done" : "in",
  );
  useEffect(() => {
    if (phase !== "in") return;
    writePreference(LAUNCH_KEY, today());
    const leave = window.setTimeout(() => setPhase("out"), 1050);
    const done = window.setTimeout(() => setPhase("done"), 1450);
    return () => {
      clearTimeout(leave);
      clearTimeout(done);
    };
    // Runs once: the phase only moves forward from here.
  }, []);
  if (phase === "done") return null;
  return (
    <div className={`launch launch-${phase}`} aria-hidden="true">
      <CurbMark />
    </div>
  );
}
