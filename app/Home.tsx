import { useEffect, useState, type RefObject } from "react";
import {
  ArrowUpRight,
  Camera,
  ChevronRight,
  FileText,
  MapPin,
  Plus,
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
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  const firstName = name.trim().split(/\s+/)[0];
  return (
    <section className="dashboard">
      <header className="dashboard-heading">
        <p className="dashboard-date">
          {now.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1 ref={headingRef} tabIndex={-1}>
          {firstName ? (
            <>
              Hey, {firstName}
              <span className="accent-dot">.</span>
            </>
          ) : (
            <>
              {greetingFor(now).text}
              <span className="accent-dot">.</span>
            </>
          )}
        </h1>
      </header>
      <button className="report-launch" onClick={onReport}>
        <span className="report-launch-copy">
          <strong>
            Report a<br />
            barrier<span className="accent-dot">.</span>
          </strong>
          <span className="launch-cta">
            <Camera size={19} /> New report <ArrowUpRight size={19} />
          </span>
        </span>
        <span className="street-art" aria-hidden="true">
          <span className="street-upper" />
          <span className="street-ramp" />
          <span className="street-lower" />
          <span className="street-dash dash-one" />
          <span className="street-dash dash-two" />
          <span className="street-marker">
            <Plus size={25} strokeWidth={2.5} />
          </span>
        </span>
      </button>
      <button className="home-area" onClick={onArea}>
        <MapPin size={20} />
        <span>
          <b>{area?.label || "Add your area"}</b>
          <small>{area?.representative || "Find your representative"}</small>
        </span>
        <ChevronRight size={18} />
      </button>
      <section
        className="dashboard-reports"
        aria-labelledby="recent-reports-heading"
      >
        <div className="section-heading">
          <h2 id="recent-reports-heading">Recent reports</h2>
          <button className="text-button" onClick={onReports}>
            See all <ChevronRight size={15} />
          </button>
        </div>
        {loading ? (
          <div className="empty-state" role="status">
            <span className="spinner" /> Loading reports…
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
                  <span className="no-photo">
                    <FileText size={24} />
                  </span>
                )}
                <span className="report-row-copy">
                  <span className="report-row-meta">
                    {displayDate(report.created)}
                    <i />
                    {reportStatusLabel(report)}
                  </span>
                  <b>{report.category}</b>
                  <small>{report.place}</small>
                </span>
                <ChevronRight size={18} />
              </button>
            ))}
          </div>
        ) : (
          <button className="home-empty" onClick={onReport}>
            <span className="empty-stack" aria-hidden="true">
              <FileText size={25} />
            </span>
            <span>
              <b>Your first report starts here.</b>
              <small>Notice something? Take a photo.</small>
            </span>
            <Plus size={20} />
          </button>
        )}
      </section>
    </section>
  );
}
