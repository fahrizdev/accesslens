import type { RefObject } from "react";
import { ArrowUpRight, ChevronRight, Lock, UserRound } from "lucide-react";
import { officialContactUrl, type Area } from "../area";
import type { SenderProfile } from "../profile";
import type { BarrierReport } from "../reports";
type Props = {
  profile: SenderProfile;
  area: Area | null;
  reports: BarrierReport[];
  heading: RefObject<HTMLHeadingElement | null>;
  onSignature: () => void;
  onArea: () => void;
};
export default function SettingsView({
  profile,
  area,
  reports,
  heading,
  onSignature,
  onArea,
}: Props) {
  const initial = profile.name.trim().charAt(0).toUpperCase();
  const resolved = reports.filter((r) => r.followUp === "resolved").length;
  const waiting = reports.filter(
    (r) => r.status !== "Draft" && r.followUp !== "resolved",
  ).length;
  const stats = [
    { value: reports.length, label: "Reports" },
    { value: waiting, label: "Waiting" },
    { value: resolved, label: "Resolved" },
  ];
  return (
    <section className="you-view">
      <div className="profile-head enter">
        <span className="avatar">
          {initial || <UserRound size={38} strokeWidth={1.6} />}
        </span>
        <h1 ref={heading} tabIndex={-1}>
          {profile.name || "You"}
        </h1>
        <p className="muted">{area?.label || "Choose where you report"}</p>
      </div>

      {reports.length > 0 && (
        <div className="stat-row enter" style={{ animationDelay: "60ms" }}>
          {stats.map(({ value, label }) => (
            <div key={label}>
              <b>{value}</b>
              <small>{label}</small>
            </div>
          ))}
        </div>
      )}

      <section
        className="settings-section enter"
        aria-labelledby="signature-heading"
        style={{ animationDelay: "120ms" }}
      >
        <h2 id="signature-heading">Signature</h2>
        <div className="grouped">
          <button className="settings-row" onClick={onSignature}>
            <span>Name</span>
            <span className="muted">{profile.name || "Add"}</span>
            <ChevronRight size={15} className="chevron" />
          </button>
          <button className="settings-row" onClick={onSignature}>
            <span>Email</span>
            <span className="muted">{profile.email || "Add"}</span>
            <ChevronRight size={15} className="chevron" />
          </button>
        </div>
        <p className="group-footer">
          Added to the end of every report so offices can reply.
        </p>
      </section>

      <section
        className="settings-section enter"
        aria-labelledby="area-heading"
        style={{ animationDelay: "180ms" }}
      >
        <h2 id="area-heading">Where you report</h2>
        <div className="grouped">
          <button className="settings-row" onClick={onArea}>
            <span>Area</span>
            <span className="muted">{area?.label || "Choose"}</span>
            <ChevronRight size={15} className="chevron" />
          </button>
          {area?.representative ? (
            <a
              className="settings-row"
              href={officialContactUrl(area.contactUrl)}
              target="_blank"
              rel="noreferrer"
            >
              <span>Representative</span>
              <span className="muted">{area.representative}</span>
              <ArrowUpRight size={15} className="chevron" />
            </a>
          ) : (
            <button className="settings-row" onClick={onArea}>
              <span>Representative</span>
              <span className="muted">Find</span>
              <ChevronRight size={15} className="chevron" />
            </button>
          )}
        </div>
        <p className="group-footer">
          <Lock size={12} aria-hidden="true" /> Everything stays on this phone.
        </p>
      </section>
    </section>
  );
}
