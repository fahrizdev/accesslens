import type { ChangeEvent, RefObject } from "react";
import {
  Camera,
  ChevronRight,
  FileText,
  Images,
  UserRound,
} from "lucide-react";
import { reportStatusLabel, type BarrierReport } from "./reports";
import PhotoPicker from "./components/PhotoPicker";

type Props = {
  reports: BarrierReport[];
  loading: boolean;
  processing: boolean;
  error: string;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onReport: (event: ChangeEvent<HTMLInputElement>) => void;
  onReports: () => void;
  onProfile: () => void;
  onOpenReport: (report: BarrierReport) => void;
};

export function ReportThumb({ report }: { report: BarrierReport }) {
  return report.image ? (
    <img src={report.image} alt="" />
  ) : (
    <span className="no-photo">
      <FileText size={20} />
    </span>
  );
}

export default function HomeDashboard({
  reports,
  loading,
  processing,
  error,
  headingRef,
  onReport,
  onReports,
  onProfile,
  onOpenReport,
}: Props) {
  const draft = reports.find((report) => report.status === "Draft");
  const recent = reports.filter((report) => report !== draft).slice(0, 6);
  return (
    <section className="home">
      <header className="large-title">
        <h1 ref={headingRef} tabIndex={-1}>
          Home
        </h1>
        <button
          className="glass-circle"
          aria-label="Your profile"
          onClick={onProfile}
        >
          <UserRound size={21} />
        </button>
      </header>

      <section
        className="hero-card enter"
        aria-labelledby="hero-title"
        style={{ animationDelay: "60ms" }}
      >
        <span className="eyebrow">New report</span>
        <h2 id="hero-title">Spot a barrier?</h2>
        <p>Take a photo. Curb writes the report and finds who to send it to.</p>
        <div className="hero-actions">
          <PhotoPicker
            className="button-primary"
            label="New report: take a photo"
            camera
            disabled={processing}
            onPick={onReport}
          >
            {processing ? (
              <>
                <span className="spinner" /> Preparing photo…
              </>
            ) : (
              <>
                <Camera size={19} /> Take a photo
              </>
            )}
          </PhotoPicker>
          <PhotoPicker
            className="glass-circle large"
            label="New report: choose from library"
            disabled={processing}
            onPick={onReport}
          >
            <Images size={21} />
          </PhotoPicker>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>

      {draft && (
        <section
          className="home-section enter"
          aria-labelledby="draft-title"
          style={{ animationDelay: "120ms" }}
        >
          <h2 id="draft-title">Finish your draft</h2>
          <button className="draft-card" onClick={() => onOpenReport(draft)}>
            <span className="thumb">
              <ReportThumb report={draft} />
            </span>
            <span className="row-copy">
              <b>{draft.category}</b>
              <small>{draft.place}</small>
            </span>
            <span className="pill-tag">Finish</span>
          </button>
        </section>
      )}

      <section
        className="home-section enter"
        aria-labelledby="recent-title"
        style={{ animationDelay: "180ms" }}
      >
        {recent.length > 0 ? (
          <button className="section-link" onClick={onReports}>
            <h2 id="recent-title">Recent</h2>
            <ChevronRight size={20} />
          </button>
        ) : (
          <h2 id="recent-title">Recent</h2>
        )}
        {loading ? (
          <p className="quiet-empty" role="status">
            <span className="spinner" /> Loading reports…
          </p>
        ) : recent.length ? (
          <div className="shelf">
            {recent.map((report) => (
              <button
                className="shelf-card"
                key={report.id}
                onClick={() => onOpenReport(report)}
              >
                <span className="shelf-photo">
                  <ReportThumb report={report} />
                  <span className="glass-tag">{reportStatusLabel(report)}</span>
                </span>
                <b>{report.category}</b>
                <small>{report.place}</small>
              </button>
            ))}
          </div>
        ) : (
          <p className="quiet-empty">Reports you send will show up here.</p>
        )}
      </section>
    </section>
  );
}
