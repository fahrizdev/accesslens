import { useState, type RefObject } from "react";
import { ChevronRight } from "lucide-react";
import { displayDate, reportGroup, type BarrierReport } from "../reports";
import { ReportThumb, StatusTag } from "../Home";
import { CurbMark } from "../Brand";

type Filter = "All" | "Drafts" | "Sent" | "Resolved";
const filters: Filter[] = ["All", "Drafts", "Sent", "Resolved"];

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
  const count = (item: Filter) =>
    item === "All"
      ? reports.length
      : reports.filter((report) => reportGroup(report) === item).length;
  const countText = `${visible.length} ${filter === "All" ? "" : `${filter.toLowerCase()} `}report${visible.length === 1 ? "" : "s"}`;
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
            {reports.length > 0 && (
              <span className="segment-count" aria-hidden="true">
                {count(item)}
              </span>
            )}
          </button>
        ))}
      </div>
      <p className="sr-only" role="status">
        {loading ? "" : countText}
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p className="quiet-empty">
          <span className="spinner" /> Loading reports…
        </p>
      ) : !reports.length ? (
        <div className="empty-state enter">
          <CurbMark className="rolling" />
          <b>No reports yet</b>
          <p>Tap the camera below when you spot a barrier.</p>
        </div>
      ) : !visible.length ? (
        <p className="quiet-empty">
          {filter === "Drafts"
            ? "No drafts. Everything’s been sent."
            : filter === "Sent"
              ? "Nothing waiting on a reply."
              : "Nothing resolved yet. It’ll show here once it’s fixed."}
        </p>
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
                  <span className="report-meta">
                    <StatusTag report={report} />
                    <small>{displayDate(report.created)}</small>
                  </span>
                </span>
                <ChevronRight
                  size={16}
                  className="chevron"
                  aria-hidden="true"
                />
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
