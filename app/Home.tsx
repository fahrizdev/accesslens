import type { ChangeEvent, RefObject } from "react";
import { Camera, ChevronRight, FileText } from "lucide-react";
import { displayDate, reportStatusLabel, type BarrierReport } from "./reports";
import PhotoPicker from "./components/PhotoPicker";

type Props = {
  reports: BarrierReport[];
  loading: boolean;
  processing: boolean;
  error: string;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onReport: (event: ChangeEvent<HTMLInputElement>) => void;
  onReports: () => void;
  onOpenReport: (report: BarrierReport) => void;
};

export default function HomeDashboard({
  reports,
  loading,
  processing,
  error,
  headingRef,
  onReport,
  onReports,
  onOpenReport,
}: Props) {
  const firstRun = !loading && !reports.length;
  return (
    <section className="dashboard">
      <h1 className="sr-only" ref={headingRef} tabIndex={-1}>
        Home
      </h1>
      <section className="home-hero" aria-labelledby="home-hero-heading">
        <h2 id="home-hero-heading">Spot a barrier? Report it.</h2>
        {firstRun && (
          <p className="home-hero-copy">
            Photograph a blocked ramp, a stairs-only entrance, or a broken path.
            Curb turns it into a ready-to-send report and helps you find who to
            send it to.
          </p>
        )}
        <PhotoPicker
          className="button-primary full"
          label="New report: take or choose a photo"
          disabled={processing}
          onPick={onReport}
        >
          {processing ? (
            <>
              <span className="spinner" /> Preparing photo…
            </>
          ) : (
            <>
              <Camera size={18} /> Take or choose a photo
            </>
          )}
        </PhotoPicker>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>
      <section
        className="dashboard-reports"
        aria-labelledby="recent-reports-heading"
      >
        <div className="section-heading">
          <h2 className="section-label" id="recent-reports-heading">
            Recent reports
          </h2>
          {reports.length > 3 && (
            <button className="text-button" onClick={onReports}>
              See all
            </button>
          )}
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
          <p className="quiet-empty">Reports you make will appear here.</p>
        )}
      </section>
    </section>
  );
}
