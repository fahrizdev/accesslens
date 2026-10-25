import { useEffect, useRef, useState } from "react";
import { Camera, ChevronLeft, CircleCheck, Landmark, Lock } from "lucide-react";
import { CurbMark } from "./Brand";
import AreaPicker from "./components/AreaPicker";
import type { Area } from "./area";

const features = [
  {
    icon: Camera,
    title: "Spot a barrier",
    text: "A blocked ramp, a stairs-only entrance or a broken path. Snap a photo or just describe it.",
  },
  {
    icon: Landmark,
    title: "Reach the right office",
    text: "Curb writes the report and addresses it to your representative.",
  },
  {
    icon: CircleCheck,
    title: "See it through",
    text: "Keep track of what you sent and what got fixed.",
  },
];

// Two steps: what Curb does, then who your reports go to.
export default function Welcome({
  onFinish,
}: {
  onFinish: (area: Area | null) => void;
}) {
  const [step, setStep] = useState<"intro" | "area">("intro");
  // Moving between steps replaces the whole screen; start reading at its title.
  const title = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  useEffect(() => {
    if (moved.current) title.current?.focus();
    moved.current = true;
  }, [step]);
  if (step === "area")
    return (
      <main className="welcome" key="area">
        <button
          className="nav-text welcome-back"
          onClick={() => setStep("intro")}
        >
          <ChevronLeft size={24} strokeWidth={2.4} /> Back
        </button>
        <div className="welcome-top enter">
          <span className="welcome-symbol">
            <Landmark size={30} strokeWidth={1.8} />
          </span>
          <h1 ref={title} tabIndex={-1}>
            Who should hear about it?
          </h1>
          <p className="welcome-lede">
            Curb finds the U.S. House representative for your area so every
            report starts addressed to them.
          </p>
        </div>
        <div className="welcome-area enter" style={{ animationDelay: "120ms" }}>
          <AreaPicker onChoose={(area) => onFinish(area)} />
        </div>
        <div className="welcome-bottom">
          <p className="footnote">
            <Lock size={13} aria-hidden="true" /> Your area stays on this phone.
          </p>
          <button className="text-link quiet" onClick={() => onFinish(null)}>
            Not now
          </button>
        </div>
      </main>
    );
  return (
    <main className="welcome" key="intro">
      <div className="welcome-top enter">
        <span className="app-icon">
          <CurbMark className="rolling" />
        </span>
        <h1 ref={title} tabIndex={-1}>
          Welcome to Curb
        </h1>
      </div>
      <ul className="welcome-features">
        {features.map(({ icon: Icon, title, text }, index) => (
          <li
            key={title}
            className="enter"
            style={{ animationDelay: `${200 + index * 90}ms` }}
          >
            <Icon size={30} strokeWidth={1.7} aria-hidden="true" />
            <div>
              <b>{title}</b>
              <p>{text}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="welcome-bottom enter" style={{ animationDelay: "480ms" }}>
        <p className="footnote">
          <Lock size={13} aria-hidden="true" /> Reports and photos stay on this
          phone.
        </p>
        <button className="button-primary full" onClick={() => setStep("area")}>
          Continue
        </button>
      </div>
    </main>
  );
}
