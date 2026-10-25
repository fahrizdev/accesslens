import type { RefObject } from "react";
import { Camera, ChevronRight, FileText } from "lucide-react";
import { displayDate, reportStatusLabel, type BarrierReport } from "./reports";

type Props = {
  reports: BarrierReport[];
  loading: boolean;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onReport: () => void;
  onReports: () => void;
  onOpenReport: (report: BarrierReport) => void;
};

export default function HomeDashboard({
  reports,
  loading,
  headingRef,
  onReport,
  onReports,
  onOpenReport,
}: Props) {
  const latest = reports[0];
  return (
    <section className="dashboard">
      <h1 className="sr-only" ref={headingRef} tabIndex={-1}>
        Home
      </h1>
      <section className="home-capture" aria-labelledby="home-report-heading">
        <h2 className="section-label" id="home-report-heading">
          Report
        </h2>
        <div className="home-capture-grid">
          <button
            className="capture-tile"
            onClick={onReport}
            aria-label="New report"
          >
            <span className="capture-tile-title">New report</span>
            <span className="tile-shutter">
              <Camera size={19} />
            </span>
          </button>
          {latest && (
            <button
              className="home-photo-card"
              onClick={() => onOpenReport(latest)}
            >
              {latest.image ? (
                <img src={latest.image} alt="" />
              ) : (
                <span className="no-photo">
                  <FileText size={24} />
                </span>
              )}
              <span className="home-photo-caption">
                <b>{latest.category}</b>
                <small>{reportStatusLabel(latest)}</small>
              </span>
              <span className="tile-open">
                <ChevronRight size={18} />
              </span>
            </button>
          )}
        </div>
      </section>
      <section
        className="dashboard-reports"
        aria-labelledby="recent-reports-heading"
      >
        <div className="section-heading">
          <h2 className="section-label" id="recent-reports-heading">
            Recent reports
          </h2>
          <button className="text-button" onClick={onReports}>
            See all
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
                    <FileText size={20} />
                  </span>
                )}
                <span className="report-row-copy">
                  <b>{report.category}</b>
                  <small>{report.place}</small>
                  <span className="report-row-meta">
                    {displayDate(report.created)} · {reportStatusLabel(report)}
                  </span>
                </span>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
        ) : (
          <p className="quiet-empty">No reports yet</p>
        )}
      </section>
    </section>
  );
}
