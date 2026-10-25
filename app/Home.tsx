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
} from "lucide-react";
import {
  displayDate,
  reportStatusLabel,
  type Area,
  type BarrierReport,
} from "./reports";
import { greetingFor } from "./greeting";

type Props = {
  name: string;
  area: Area | null;
  reports: BarrierReport[];
  loading: boolean;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onReport: () => void;
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
    <section className={`dashboard period-${greeting.period}`}>
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
        </div>
        <div className="daylight-orb" aria-hidden="true">
          <DayIcon size={34} strokeWidth={1.2} />
        </div>
      </header>

      <div className="dashboard-top">
        <button
          className="report-launch"
          aria-label="Make a report"
          aria-describedby="report-launch-hint"
          onClick={onReport}
        >
          <span className="report-launch-icon">
            <Camera size={31} strokeWidth={1.4} />
          </span>
          <span className="report-launch-copy">
            <strong>Make a report</strong>
            <span id="report-launch-hint">
              Add a photo of an access barrier.
              <br />
              Then add where it is.
            </span>
          </span>
          <span className="report-launch-arrow">
            <ArrowUpRight size={23} strokeWidth={1.5} />
          </span>
        </button>
        <button className="neighborhood-card" onClick={onArea}>
          <span className="neighborhood-label">
            <MapPin size={14} /> YOUR AREA
          </span>
          <strong>{area?.label || "Where’s home?"}</strong>
          <span className="neighborhood-detail">
            {area?.representative ||
              (area
                ? "Find your representative"
                : "Choose an area for your reports")}
          </span>
          <span className="neighborhood-edit">
            {area ? "Manage area" : "Set your area"}
            <ArrowRight size={15} />
          </span>
        </button>
      </div>

      <section
        className="dashboard-reports"
        aria-labelledby="recent-reports-heading"
      >
        <div className="dashboard-section-heading">
          <h2 id="recent-reports-heading">Recent reports</h2>
          <button className="text-button" onClick={onReports}>
            View all <ArrowRight size={14} />
          </button>
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
                    {displayDate(report.created)}
                    <i />
                    {reportStatusLabel(report)}
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
              <p>
                Your reports show up here,
                <br className="empty-break" /> on this device.
              </p>
            </div>
          </div>
        )}
        <p className="dashboard-local">
          Reports are saved in this browser. Sharing opens another app; you
          choose whether to send.
        </p>
      </section>
    </section>
  );
}
