import type { RefObject } from "react";
import { Camera, ChevronRight, FileText, ShieldCheck } from "lucide-react";
import { displayDate, reportStatusLabel, type BarrierReport } from "../reports";

type Props = {
  reports: BarrierReport[];
  loading: boolean;
  heading: RefObject<HTMLHeadingElement | null>;
  newReport: () => void;
  openReport: (report: BarrierReport) => void;
};

export default function ReportsView({
  reports,
  loading,
  heading,
  newReport,
  openReport,
}: Props) {
  return (
    <section className="reports-view">
      <div className="page-intro">
        <span className="eyebrow">SAVED ON THIS DEVICE</span>
        <h1 ref={heading} tabIndex={-1}>
          Your reports.
        </h1>
        <p>Open a report to edit it or share it again.</p>
      </div>
      <button className="button-primary reports-new" onClick={newReport}>
        <Camera size={17} /> New report
      </button>
      {loading ? (
        <div className="empty-state">
          <span className="spinner" />
          Opening your reports…
        </div>
      ) : reports.length === 0 ? (
        <div className="empty-state">
          <span className="empty-symbol">
            <FileText size={31} strokeWidth={1.1} />
          </span>
          <h2>Nothing here yet.</h2>
          <p>Start with a photo to make your first report.</p>
          <button className="button-primary" onClick={newReport}>
            Take a photo <Camera size={16} />
          </button>
        </div>
      ) : (
        <div className="report-list">
          {reports.map((report) => (
            <button
              className="report-list-item"
              key={report.id}
              onClick={() => openReport(report)}
            >
              {report.image ? (
                <img src={report.image} alt="" />
              ) : (
                <span className="no-photo">
                  <FileText size={25} />
                </span>
              )}
              <span>
                <small>
                  {displayDate(report.created)}
                  <i /> {reportStatusLabel(report)}
                </small>
                <b>{report.category}</b>
                <span>{report.place}</span>
              </span>
              <ChevronRight size={18} />
            </button>
          ))}
        </div>
      )}
      <p className="privacy-caption">
        <ShieldCheck size={13} /> Stored locally. Download important reports
        before clearing browser data.
      </p>
    </section>
  );
}
