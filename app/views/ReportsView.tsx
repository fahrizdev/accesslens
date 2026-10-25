import type { ChangeEvent, RefObject } from "react";
import { FileText, Plus } from "lucide-react";
import { displayDate, reportStatusLabel, type BarrierReport } from "../reports";
import PhotoPicker from "../components/PhotoPicker";
type Props = {
  reports: BarrierReport[];
  loading: boolean;
  processing: boolean;
  error: string;
  heading: RefObject<HTMLHeadingElement | null>;
  newReport: (event: ChangeEvent<HTMLInputElement>) => void;
  openReport: (report: BarrierReport) => void;
};
export default function ReportsView({
  reports,
  loading,
  processing,
  error,
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
        <PhotoPicker
          className="button-primary compact-button"
          label="New report: take or choose a photo"
          disabled={processing}
          onPick={newReport}
        >
          <Plus size={15} /> {processing ? "Preparing…" : "New"}
        </PhotoPicker>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <div className="empty-state" role="status">
          <span className="spinner" /> Loading reports…
        </div>
      ) : !reports.length ? (
        <p className="quiet-empty">Reports you make will appear here.</p>
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
