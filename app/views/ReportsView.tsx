import type { RefObject } from "react";
import { ChevronRight, FileText, Plus } from "lucide-react";
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
      <div className="page-heading">
        <h1 ref={heading} tabIndex={-1}>
          Reports<span className="accent-dot">.</span>
        </h1>
        <button
          className="icon-button new-report-button"
          aria-label="New report"
          onClick={newReport}
        >
          <Plus size={24} />
        </button>
      </div>
      {loading ? (
        <div className="empty-state" role="status">
          <span className="spinner" /> Loading reports…
        </div>
      ) : !reports.length ? (
        <div className="empty-state reports-empty">
          <span className="empty-stack" aria-hidden="true">
            <FileText size={34} />
          </span>
          <h2>No reports yet.</h2>
          <button className="button-primary" onClick={newReport}>
            <Plus size={18} /> New report
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
                  <FileText size={26} />
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
      )}
    </section>
  );
}
