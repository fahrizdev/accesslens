import type { RefObject } from "react";
import {
  ChevronRight,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import type { Area } from "../area";
import type { SenderProfile } from "../profile";
import Representative from "../components/Representative";

type Props = {
  profile: SenderProfile;
  area: Area | null;
  heading: RefObject<HTMLHeadingElement | null>;
  onSignature: () => void;
  onArea: () => void;
  onSetup: () => void;
  onPrivacy: () => void;
};

export default function SettingsView({
  profile,
  area,
  heading,
  onSignature,
  onArea,
  onSetup,
  onPrivacy,
}: Props) {
  return (
    <section className="settings-view">
      <div className="page-intro">
        <span className="eyebrow">YOUR DETAILS</span>
        <h1 ref={heading} tabIndex={-1}>
          Settings.
        </h1>
        <p>Change your contact info or saved area.</p>
      </div>
      <div className="settings-group">
        <button onClick={onSignature}>
          <span className="settings-icon">
            <UserRound size={21} />
          </span>
          <span>
            <b>{profile.name || "Your name & email"}</b>
            <small>{profile.email || "Set up your report signature"}</small>
          </span>
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="settings-group">
        <button onClick={onArea}>
          <span className="settings-icon">
            <MapPin size={21} />
          </span>
          <span>
            <b>Your area</b>
            <small>{area?.label || "Choose your area"}</small>
          </span>
          <ChevronRight size={18} />
        </button>
        <div className="settings-representative">
          <Representative area={area} compact />
        </div>
      </div>
      <div className="settings-group">
        <button onClick={onSetup}>
          <span className="settings-icon">
            <Sparkles size={21} />
          </span>
          <span>
            <b>Go through setup again</b>
            <small>Review your name, email, and area</small>
          </span>
          <ChevronRight size={18} />
        </button>
        <button onClick={onPrivacy}>
          <span className="settings-icon">
            <ShieldCheck size={21} />
          </span>
          <span>
            <b>Privacy & how it works</b>
            <small>Where your photos and reports are saved</small>
          </span>
          <ChevronRight size={18} />
        </button>
      </div>
      <p className="version-note">Via</p>
    </section>
  );
}
