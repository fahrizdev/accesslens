import type { ChangeEvent, RefObject } from "react";
import {
  ArrowUpRight,
  Camera,
  ChevronRight,
  FileText,
  Landmark,
  UserRound,
} from "lucide-react";
import { reportStatusLabel, type BarrierReport } from "./reports";
import { officialContactUrl, type Area } from "./area";
import { greetingFor } from "./greeting";
import { CurbMark } from "./Brand";
import PhotoPicker from "./components/PhotoPicker";

type Props = {
  reports: BarrierReport[];
  loading: boolean;
  processing: boolean;
  error: string;
  area: Area | null;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onReport: (event: ChangeEvent<HTMLInputElement>) => void;
  onReports: () => void;
  onProfile: () => void;
  onArea: () => void;
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

function RepresentativeCard({
  area,
  onArea,
}: {
  area: Area | null;
  onArea: () => void;
}) {
  if (!area?.representative)
    return (
      <button className="rep-card rep-card-empty" onClick={onArea}>
        <span className="rep-icon">
          <Landmark size={22} />
        </span>
        <span className="row-copy">
          <b>Who gets your reports?</b>
          <small>Find your representative</small>
        </span>
        <ChevronRight size={18} className="chevron" />
      </button>
    );
  return (
    <div className="rep-card">
      <span className="rep-icon">
        <Landmark size={22} />
      </span>
      <span className="row-copy">
        <small>Your reports go to</small>
        <b>{area.representative}</b>
        {area.district && <small>{area.district}</small>}
      </span>
      <a
        className="glass-circle"
        href={officialContactUrl(area.contactUrl)}
        target="_blank"
        rel="noreferrer"
        aria-label={`${area.representative}’s official page`}
      >
        <ArrowUpRight size={19} />
      </a>
    </div>
  );
}

export default function HomeDashboard({
  reports,
  loading,
  processing,
  error,
  area,
  headingRef,
  onReport,
  onReports,
  onProfile,
  onArea,
  onOpenReport,
}: Props) {
  const draft = reports.find((report) => report.status === "Draft");
  const recent = reports.filter((report) => report !== draft).slice(0, 8);
  const firstRun = !loading && !reports.length;
  return (
    <section className="home">
      <header className="large-title">
        <h1 ref={headingRef} tabIndex={-1}>
          {greetingFor(new Date()).text}
        </h1>
        <button
          className="glass-circle"
          aria-label="Your profile"
          onClick={onProfile}
        >
          <UserRound size={21} />
        </button>
      </header>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {firstRun && (
        <section className="first-run enter" aria-labelledby="first-title">
          <CurbMark className="rolling" />
          <h2 id="first-title">Spot a barrier?</h2>
          <p>
            Take a photo and Curb writes the report for you, ready to send to
            your representative.
          </p>
          <PhotoPicker
            className="button-primary"
            label="Take your first photo"
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
        </section>
      )}

      <div className="home-section enter" style={{ animationDelay: "80ms" }}>
        <RepresentativeCard area={area} onArea={onArea} />
      </div>

      {draft && (
        <section className="home-section" aria-labelledby="draft-title">
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

      {loading && (
        <p className="quiet-empty" role="status">
          <span className="spinner" /> Loading reports…
        </p>
      )}

      {recent.length > 0 && (
        <section className="home-section" aria-labelledby="recent-title">
          <button className="section-link" onClick={onReports}>
            <h2 id="recent-title">Recent</h2>
            <ChevronRight size={20} />
          </button>
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
        </section>
      )}
    </section>
  );
}
