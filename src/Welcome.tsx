import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { ArrowRight, Check } from "lucide-react";

function SwipeToStart({
  onProgress,
  onComplete,
}: {
  onProgress: (value: number) => void;
  onComplete: () => void;
}) {
  const [value, setValue] = useState(0);
  const [complete, setComplete] = useState(false);
  const dragging = useRef(false);
  const finished = useRef(false);
  function update(next: number) {
    setValue(next);
    onProgress(next);
  }
  function finish() {
    if (finished.current) return;
    finished.current = true;
    update(100);
    setComplete(true);
    onComplete();
  }
  function release(next: number) {
    dragging.current = false;
    if (next >= 90) finish();
    else if (!finished.current) update(0);
  }
  function keyboard(event: KeyboardEvent<HTMLInputElement>) {
    if (["Enter", " ", "End"].includes(event.key)) {
      event.preventDefault();
      finish();
    } else if (
      ["ArrowRight", "ArrowUp", "ArrowLeft", "ArrowDown", "Home"].includes(
        event.key,
      )
    ) {
      event.preventDefault();
      const next =
        event.key === "Home"
          ? 0
          : Math.min(
              100,
              Math.max(
                0,
                value +
                  (["ArrowRight", "ArrowUp"].includes(event.key) ? 25 : -25),
              ),
            );
      if (next === 100) finish();
      else update(next);
    }
  }
  return (
    <div
      className={`swipe-track${complete ? " swipe-complete" : ""}`}
      style={{ "--swipe": value / 100 } as CSSProperties}
    >
      <div className="swipe-fill" aria-hidden="true" />
      <span className="swipe-label" aria-hidden="true">
        {complete ? "Let’s get started" : "Slide to get started"}
      </span>
      <span className="swipe-destination" aria-hidden="true">
        <ArrowRight size={19} />
      </span>
      <span className="swipe-handle" aria-hidden="true">
        {complete ? (
          <Check size={23} />
        ) : (
          <ArrowRight size={24} strokeWidth={1.7} />
        )}
      </span>
      <input
        className="swipe-range"
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        disabled={complete}
        aria-label="Slide to get started"
        aria-valuetext={
          complete
            ? "Ready"
            : `${value} percent. Slide right, or press Enter to continue.`
        }
        onPointerDown={() => {
          dragging.current = true;
        }}
        onChange={(event) => {
          const next = Number(event.currentTarget.value);
          update(next);
          if (!dragging.current && next === 100) finish();
        }}
        onPointerUp={(event) => release(Number(event.currentTarget.value))}
        onPointerCancel={() => {
          dragging.current = false;
          if (!finished.current) update(0);
        }}
        onBlur={() => {
          dragging.current = false;
          if (!finished.current) update(0);
        }}
        onKeyDown={keyboard}
      />
    </div>
  );
}

export default function Welcome({ onContinue }: { onContinue: () => void }) {
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    return () => window.clearTimeout(timer.current);
  }, []);
  function continueToProfile() {
    setLeaving(true);
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    timer.current = window.setTimeout(onContinue, reduced ? 0 : 480);
  }
  return (
    <div
      className={`welcome-intro${leaving ? " welcome-exiting" : ""}`}
      style={{ "--opening": progress / 100 } as CSSProperties}
    >
      <div className="welcome-message">
        <span className="welcome-kicker">A CLEARER PICTURE OF ACCESS</span>
        <h1 ref={heading} tabIndex={-1}>
          There’s a way
          <br />
          <span>to make it better.</span>
        </h1>
        <p>
          A blocked ramp. An entrance that’s hard to use.
          <br className="welcome-linebreak" /> Capture it, add the details, and
          share a report.
        </p>
      </div>
      <div className="threshold-scene" aria-hidden="true">
        <div className="threshold-halo" />
        <div className="threshold-floor" />
        <div className="threshold-frame">
          <div className="threshold-light" />
          <div className="threshold-door">
            <span />
          </div>
        </div>
        <div className="threshold-caption">
          <span /> A little more open.
        </div>
      </div>
      <div className="welcome-start-area">
        <SwipeToStart onProgress={setProgress} onComplete={continueToProfile} />
        <p>About a minute to make it yours.</p>
      </div>
    </div>
  );
}
