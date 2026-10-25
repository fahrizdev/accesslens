import type { RefObject } from "react";
import { FileText, Plus } from "lucide-react";
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
          Reports
        </h1>
        <button className="button-primary compact-button" onClick={newReport}>
          <Plus size={15} /> New
        </button>
      </div>
      {loading ? (
        <div className="empty-state" role="status">
          <span className="spinner" /> Loading reports…
        </div>
      ) : !reports.length ? (
        <p className="quiet-empty">No reports yet</p>
      ) : (
        <div className="report-grid">
          {reports.map((report) => (
            <button
              className="saved-report-card"
              key={report.id}
              onClick={() => openReport(report)}
            >
              <span className="saved-report-photo">
                {report.image ? (
                  <img src={report.image} alt="" />
                ) : (
                  <span className="no-photo">
                    <FileText size={28} />
                  </span>
                )}
              </span>
              <span className="saved-report-heading">
                <b>{report.category}</b>
                <small>{displayDate(report.created)}</small>
              </span>
              <span className="saved-report-status">
                {reportStatusLabel(report)}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
