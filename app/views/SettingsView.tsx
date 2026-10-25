import type { RefObject } from "react";
import { ArrowUpRight, ChevronRight, MapPin, UserRound } from "lucide-react";
import { officialContactUrl, type Area } from "../area";
import type { SenderProfile } from "../profile";
type Props = {
  profile: SenderProfile;
  area: Area | null;
  heading: RefObject<HTMLHeadingElement | null>;
  onSignature: () => void;
  onArea: () => void;
};
export default function SettingsView({
  profile,
  area,
  heading,
  onSignature,
  onArea,
}: Props) {
  const initial = profile.name.trim().charAt(0).toUpperCase();
  return (
    <section className="settings-view">
      <div className="page-heading">
        <h1 ref={heading} tabIndex={-1}>
          Profile<span className="accent-dot">.</span>
        </h1>
      </div>
      <button className="profile-identity" onClick={onSignature}>
        <span className="profile-monogram">
          {initial || <UserRound size={30} strokeWidth={1.7} />}
        </span>
        <span>
          <b>{profile.name || "Your profile"}</b>
          <small>{profile.email || "Add your name & email"}</small>
        </span>
        <ChevronRight size={21} />
      </button>
      <div className="settings-group">
        <button onClick={onSignature}>
          <UserRound size={22} />
          <span>
            <b>Personal details</b>
          </span>
          <ChevronRight size={18} />
        </button>
        <button onClick={onArea}>
          <MapPin size={22} />
          <span>
            <b>Your area</b>
            <small>{area?.label || "Choose an area"}</small>
          </span>
          <ChevronRight size={18} />
        </button>
      </div>
      <section
        className="profile-representative"
        aria-labelledby="representative-heading"
      >
        <h2 id="representative-heading">Your representative</h2>
        <div className="representative-profile-card">
          <span className="district-emblem" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <div>
            <b>{area?.representative || "Who represents your area?"}</b>
            <p>{area?.district || "Find your U.S. House representative."}</p>
          </div>
        </div>
        {area?.representative ? (
          <div className="representative-actions">
            <a
              className="text-button"
              href={officialContactUrl(area.contactUrl)}
              target="_blank"
              rel="noreferrer"
            >
              Official page <ArrowUpRight size={15} />
            </a>
            <button className="text-button" onClick={onArea}>
              Change area
            </button>
          </div>
        ) : (
          <button className="text-button" onClick={onArea}>
            Find representative <ArrowUpRight size={16} />
          </button>
        )}
      </section>
    </section>
  );
}
