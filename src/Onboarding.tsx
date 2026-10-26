import { useEffect, useRef, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Mail,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import type { Area } from "./data";
import type { SenderProfile } from "./profile";
import { LensMark } from "./Brand";

type Props = {
  step: number;
  direction: number;
  profile: SenderProfile;
  draft: SenderProfile;
  area: Area | null;
  setDraft: (profile: SenderProfile) => void;
  move: (step: number) => void;
  finish: (camera?: boolean) => void;
  submit: (event: FormEvent<HTMLFormElement>) => void;
  areaPicker: ReactNode;
};

export default function Onboarding({
  step,
  direction,
  profile,
  draft,
  area,
  setDraft,
  move,
  finish,
  submit,
  areaPicker,
}: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [step]);
  return (
    <section
      className={`onboarding onboarding-step-${step}`}
      aria-label="Set up AccessLens"
    >
      <header className="onboard-header">
        {step > 1 ? (
          <button
            className="icon-button"
            onClick={() => move(step - 1)}
            aria-label="Previous step"
          >
            <ArrowLeft size={20} />
          </button>
        ) : (
          <span className="onboard-brand">
            <LensMark />
          </span>
        )}
        {step > 0 && (
          <div className="setup-progress" aria-label={`Step ${step} of 4`}>
            {[1, 2, 3, 4].map((index) => (
              <span key={index} className={index <= step ? "complete" : ""} />
            ))}
          </div>
        )}
      </header>
      {
        <div className={`setup-panel direction-${direction}`} key={step}>
          <div className={`setup-art setup-art-${step}`} aria-hidden="true">
            {step === 1 && <LensMark className="ready-mark" />}
            {step === 2 && (
              <div className="setup-icon">
                <Mail size={43} strokeWidth={1.25} />
              </div>
            )}
            {step === 3 && (
              <div className="setup-icon">
                <MapPin size={43} strokeWidth={1.25} />
              </div>
            )}
            {step === 4 && (
              <>
                <LensMark className="ready-mark" />
                <span className="ready-check">
                  <Check size={16} />
                </span>
              </>
            )}
          </div>
          <div className="setup-heading">
            <span className="eyebrow">
              {
                [
                  "",
                  "A LITTLE INTRODUCTION",
                  "KEEP THE CONVERSATION OPEN",
                  "MAKE IT LOCAL",
                  "THE START OF SOMETHING GOOD",
                ][step]
              }
            </span>
            <h1 ref={heading} tabIndex={-1}>
              {
                [
                  "",
                  "Let’s make it yours.",
                  "A way to reach you.",
                  "Your neighborhood.",
                  profile.name
                    ? `You’re all set, ${profile.name.split(/\s+/)[0]}.`
                    : "You’re all set.",
                ][step]
              }
            </h1>
            <p>
              {
                [
                  "",
                  "Every voice has a name. What’s yours?",
                  "Give your representative a way to reply.",
                  "Choose an area to find your representative.",
                  "One photo. A few details. A voice for better access.",
                ][step]
              }
            </p>
          </div>
          {(step === 1 || step === 2) && (
            <form
              id="onboarding-contact"
              className="setup-form"
              onSubmit={submit}
            >
              {step === 1 ? (
                <label className="field-label" htmlFor="onboarding-name">
                  Your name
                  <input
                    id="onboarding-name"
                    name="name"
                    autoComplete="name"
                    enterKeyHint="next"
                    placeholder="Your name"
                    required
                    maxLength={80}
                    value={draft.name}
                    onChange={(event) => {
                      event.target.setCustomValidity("");
                      setDraft({ ...draft, name: event.target.value });
                    }}
                  />
                </label>
              ) : (
                <label className="field-label" htmlFor="onboarding-email">
                  Email address
                  <input
                    id="onboarding-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    enterKeyHint="next"
                    placeholder="you@example.com"
                    required
                    maxLength={254}
                    value={draft.email}
                    onChange={(event) => {
                      event.target.setCustomValidity("");
                      setDraft({ ...draft, email: event.target.value });
                    }}
                  />
                </label>
              )}
              <p className="contact-hint">
                {step === 1
                  ? "We’ll add this to your report signature. You can change it anytime."
                  : "Only included in reports you choose to share. This saves your contact info; it doesn’t create an account or connect your inbox."}
              </p>
            </form>
          )}
          {step === 3 && (
            <div className="setup-area">
              {area ? (
                <>
                  <button className="saved-area" onClick={() => move(4)}>
                    <MapPin size={20} />
                    <span>
                      <small>USE YOUR SAVED AREA</small>
                      <b>{area.label}</b>
                    </span>
                    <ArrowRight size={18} />
                  </button>
                  <details className="change-neighborhood">
                    <summary>Choose another area</summary>
                    {areaPicker}
                  </details>
                </>
              ) : (
                areaPicker
              )}
            </div>
          )}
          {step === 4 && (
            <div className="ready-summary">
              <div>
                <span className="summary-icon">
                  <Mail size={19} />
                </span>
                <span>
                  <small>YOUR REPORT SIGNATURE</small>
                  <b>{profile.name || "Add your name later"}</b>
                  <p>{profile.email || "Email is optional for now"}</p>
                </span>
                <button className="text-button" onClick={() => move(1)}>
                  Edit
                </button>
              </div>
              <div>
                <span className="summary-icon">
                  <MapPin size={19} />
                </span>
                <span>
                  <small>YOUR NEIGHBORHOOD</small>
                  <b>{area?.label || "Add an area anytime"}</b>
                  <p>
                    {area?.representative ||
                      "Find your representative when you’re ready"}
                  </p>
                </span>
                <button className="text-button" onClick={() => move(3)}>
                  Edit
                </button>
              </div>
            </div>
          )}
          <div className="setup-actions">
            {(step === 1 || step === 2) && (
              <button
                className="button-primary full"
                type="submit"
                form="onboarding-contact"
              >
                Continue <ArrowRight size={18} />
              </button>
            )}
            {step === 4 && (
              <button
                className="button-primary full"
                onClick={() => finish(true)}
              >
                Make my first report <ArrowRight size={18} />
              </button>
            )}
            <button
              className="text-button setup-later"
              onClick={() => (step === 4 ? finish() : move(step + 1))}
            >
              {step === 4 ? "Explore AccessLens first" : "Skip for now"}
            </button>
          </div>
          {step === 4 && (
            <p className="setup-assurance">
              <ShieldCheck size={13} /> You review every report and choose where
              to share it.
            </p>
          )}
        </div>
      }
    </section>
  );
}
