import { useState, type RefObject } from "react";
import { ChevronRight } from "lucide-react";
import { displayDate, reportStatusLabel, type BarrierReport } from "../reports";
import { ReportThumb } from "../Home";
import { CurbMark } from "../Brand";

type Filter = "All" | "Drafts" | "Waiting" | "Resolved";
const filters: Filter[] = ["All", "Drafts", "Waiting", "Resolved"];

function reportGroup(report: BarrierReport): Filter {
  if (report.followUp === "resolved") return "Resolved";
  return report.status === "Draft" ? "Drafts" : "Waiting";
}

type Props = {
  reports: BarrierReport[];
  loading: boolean;
  error: string;
  heading: RefObject<HTMLHeadingElement | null>;
  openReport: (report: BarrierReport) => void;
};
export default function ReportsView({
  reports,
  loading,
  error,
  heading,
  openReport,
}: Props) {
  const [filter, setFilter] = useState<Filter>("All");
  const visible =
    filter === "All"
      ? reports
      : reports.filter((report) => reportGroup(report) === filter);
  return (
    <section className="reports-view">
      <header className="large-title">
        <h1 ref={heading} tabIndex={-1}>
          Reports
        </h1>
      </header>
      <div
        className="segmented enter"
        role="group"
        aria-label="Filter reports"
        style={{ animationDelay: "50ms" }}
      >
        {filters.map((item) => (
          <button
            key={item}
            aria-pressed={filter === item}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p className="quiet-empty" role="status">
          <span className="spinner" /> Loading reports…
        </p>
      ) : !reports.length ? (
        <div className="empty-state enter">
          <CurbMark className="rolling" />
          <b>No reports yet</b>
          <p>Tap the camera below when you spot a barrier.</p>
        </div>
      ) : !visible.length ? (
        <p className="quiet-empty">Nothing here yet.</p>
      ) : (
        <div
          className="grouped report-list enter"
          style={{ animationDelay: "100ms" }}
        >
          {visible.map((report) => (
            <button
              className="report-row"
              key={report.id}
              onClick={() => openReport(report)}
            >
              <span className="thumb">
                <ReportThumb report={report} />
              </span>
              <span className="report-row-body">
                <span className="row-copy">
                  <b>{report.category}</b>
                  <small>{report.place}</small>
                  <small>
                    {reportStatusLabel(report)} · {displayDate(report.created)}
                  </small>
                </span>
                <ChevronRight size={16} className="chevron" />
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
