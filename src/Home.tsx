import { useEffect, useState, type RefObject } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  ChevronRight,
  FileText,
  MapPin,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  UserRound,
} from "lucide-react";
import type { Area, BarrierReport } from "./data";
import { greetingFor } from "./greeting";
import Character from "./Character";

type Props = {
  name: string;
  area: Area | null;
  reports: BarrierReport[];
  loading: boolean;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onReport: () => void;
  onProfile: () => void;
  onArea: () => void;
  onReports: () => void;
  onOpenReport: (report: BarrierReport) => void;
};

export default function HomeDashboard({
  name,
  area,
  reports,
  loading,
  headingRef,
  onReport,
  onProfile,
  onArea,
  onReports,
  onOpenReport,
}: Props) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  const greeting = greetingFor(now);
  const firstName = name.trim().split(/\s+/)[0];
  const DayIcon =
    { morning: Sunrise, afternoon: Sun, evening: Sunset, night: Moon }[
      greeting.period
    ] || Sun;
  return (
    <section className={`dashboard home-studio period-${greeting.period}`}>
      <header className="dashboard-heading">
        <div>
          <p className="dashboard-date">
            {now.toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 ref={headingRef} tabIndex={-1}>
            {greeting.text}
            {firstName ? "," : "."}
            {firstName && (
              <>
                <br />
                <span>{firstName}.</span>
              </>
            )}
          </h1>
          {!firstName && (
            <button className="home-personalize" onClick={onProfile}>
              <UserRound size={14} /> Make yourself at home{" "}
              <ArrowRight size={13} />
            </button>
          )}
        </div>
        <div className="daylight-orb" aria-hidden="true">
          <DayIcon size={34} strokeWidth={1.2} />
        </div>
      </header>

      <div className="home-workspace">
        <button
          className="report-launch"
          aria-label="Make a report"
          aria-describedby="report-launch-hint"
          onClick={onReport}
        >
          <span className="report-launch-copy">
            <span className="home-action-label">
              <Camera size={16} /> A PHOTO IS A START
            </span>
            <strong>Make a report</strong>
            <span id="report-launch-hint">See a barrier? Capture it.</span>
            <span className="home-camera-link">
              Open camera <ArrowUpRight size={18} />
            </span>
          </span>
          <span className="home-camera-art" aria-hidden="true">
            <svg viewBox="0 0 260 270" fill="none">
              <ellipse
                cx="132"
                cy="239"
                rx="94"
                ry="16"
                fill="#9d87ae"
                opacity=".09"
              />
              <g transform="translate(140 231) scale(1.13)">
                <Character />
              </g>
              <path
                d="M45 64V48H61M210 64V48H194M45 199V215H61M210 199V215H194"
                stroke="#c8b6d9"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </button>
        <div className="home-side">
          <button className="neighborhood-card" onClick={onArea}>
            <span className="neighborhood-label">
              <MapPin size={17} /> YOUR NEIGHBORHOOD
            </span>
            <strong>{area?.label || "Keep it local."}</strong>
            <span className="neighborhood-detail">
              {area?.representative || "Find your representative"}
            </span>
            <span className="neighborhood-edit">
              {area ? "Manage" : "Choose an area"}
              <ArrowRight size={15} />
            </span>
          </button>
          <div className="home-note">
            <span className="home-note-mark" aria-hidden="true">
              ✳
            </span>
            <p>
              Your perspective
              <br />
              <span>belongs here.</span>
            </p>
          </div>
        </div>
      </div>

      <section
        className="dashboard-reports"
        aria-labelledby="recent-reports-heading"
      >
        <div className="dashboard-section-heading">
          <h2 id="recent-reports-heading">Recent reports</h2>
          {reports.length > 0 && (
            <button className="text-button" onClick={onReports}>
              View all <ArrowRight size={14} />
            </button>
          )}
        </div>
        {loading ? (
          <div className="dashboard-empty" role="status">
            <span className="spinner" />
            <p>Opening your reports…</p>
          </div>
        ) : reports.length ? (
          <div className="dashboard-report-list">
            {reports.slice(0, 3).map((report) => (
              <button
                className="dashboard-report"
                key={report.id}
                onClick={() => onOpenReport(report)}
              >
                {report.image ? (
                  <img src={report.image} alt="" />
                ) : (
                  <span className="dashboard-report-placeholder">
                    <FileText size={22} />
                  </span>
                )}
                <span>
                  <b>{report.category}</b>
                  <small>{report.place}</small>
                  <span className="dashboard-report-meta">
                    {new Date(report.created).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                    <i />
                    {report.status === "Shared" ? "Shared to an app" : "Draft"}
                  </span>
                </span>
                <ChevronRight size={17} />
              </button>
            ))}
          </div>
        ) : (
          <div className="dashboard-empty">
            <div className="empty-report-lines" aria-hidden="true">
              <FileText size={25} strokeWidth={1.2} />
            </div>
            <div>
              <h3>No reports yet</h3>
              <p>Your first one will appear here.</p>
            </div>
          </div>
        )}
        <p className="dashboard-local">Saved on this device.</p>
      </section>
    </section>
  );
}
