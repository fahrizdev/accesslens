import { useEffect, useRef, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, MapPin, UserRound } from "lucide-react";
import type { Area } from "./area";
import type { SenderProfile } from "./profile";
import { CurbMark } from "./Brand";
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
      aria-label="Set up Curb"
    >
      <header className="onboard-header">
        {step > 1 ? (
          <button
            className="icon-button"
            onClick={() => move(step - 1)}
            aria-label="Previous step"
          >
            <ArrowLeft size={21} />
          </button>
        ) : (
          <CurbMark />
        )}
        <div className="setup-progress" aria-label={`Step ${step} of 3`}>
          {[1, 2, 3].map((index) => (
            <span key={index} className={index <= step ? "complete" : ""} />
          ))}
        </div>
      </header>
      <div className={`setup-panel direction-${direction}`} key={step}>
        <div className="setup-heading">
          <h1 ref={heading} tabIndex={-1}>
            {step === 1 ? (
              <>
                Hey, we’re curb<span className="accent-dot">.</span>
              </>
            ) : step === 2 ? (
              <>
                Where’s home<span className="accent-dot">?</span>
              </>
            ) : (
              <>
                You’re in<span className="accent-dot">.</span>
              </>
            )}
          </h1>
          <p>
            {step === 1
              ? "A photo. A report. A step toward better access."
              : step === 2
                ? "Find your area’s representative."
                : "Ready when you notice something."}
          </p>
        </div>
        {step === 1 && (
          <form
            id="onboarding-contact"
            className="setup-form"
            onSubmit={submit}
          >
            <label className="field-label" htmlFor="onboarding-name">
              What should we call you?{" "}
              <span className="optional">optional</span>
              <input
                id="onboarding-name"
                name="name"
                autoComplete="name"
                enterKeyHint="next"
                placeholder="Your name"
                maxLength={80}
                value={draft.name}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
              />
            </label>
          </form>
        )}
        {step === 2 && (
          <div className="setup-area">
            {area ? (
              <>
                <button className="saved-area" onClick={() => move(3)}>
                  <MapPin size={22} />
                  <span>
                    <b>{area.label}</b>
                    <small>Use this area</small>
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
        {step === 3 && (
          <div className="ready-summary">
            <button onClick={() => move(1)}>
              <UserRound size={22} />
              <span>
                <b>{profile.name || "Add a name"}</b>
                <small>Report signature</small>
              </span>
              <ArrowRight size={17} />
            </button>
            <button onClick={() => move(2)}>
              <MapPin size={22} />
              <span>
                <b>{area?.label || "Add your area"}</b>
                <small>
                  {area?.representative || "Find your representative"}
                </small>
              </span>
              <ArrowRight size={17} />
            </button>
          </div>
        )}
        <div className="setup-actions">
          {step === 1 && (
            <button
              className="button-primary full"
              type="submit"
              form="onboarding-contact"
            >
              Continue <ArrowRight size={18} />
            </button>
          )}
          {step === 3 && (
            <button
              className="button-primary full"
              onClick={() => finish(true)}
            >
              Make a report <Check size={18} />
            </button>
          )}
          <button
            className="text-button setup-later"
            onClick={() => {
              if (step === 1) {
                setDraft(profile);
                move(2);
              } else if (step === 3) finish();
              else move(step + 1);
            }}
          >
            {step === 3 ? "Go to home" : "Skip for now"}
          </button>
        </div>
      </div>
    </section>
  );
}
