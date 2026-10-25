import type { RefObject } from "react";
import {
  ArrowUpRight,
  Camera,
  Copy,
  Download,
  FileText,
  MapPin,
  Send,
  Trash2,
} from "lucide-react";
import {
  displayDate,
  followUpLabels,
  isFollowUpStatus,
  type BarrierReport,
  type FollowUpStatus,
} from "../reports";
import { officialContactUrl, type Area } from "../area";
import { downloadPhoto, downloadReport } from "../reportFiles";
import Representative from "../components/Representative";
import { CurbMark } from "../Brand";
type Props = {
  current: BarrierReport;
  summary: string;
  reportArea: Area | null;
  sharing: boolean;
  error: string;
  heading: RefObject<HTMLHeadingElement | null>;
  sendPanel: RefObject<HTMLDivElement | null>;
  setSummary: (value: string) => void;
  saveReview: () => void;
  chooseArea: () => void;
  share: () => Promise<void>;
  copy: () => Promise<void>;
  updateFollowUp: (value: FollowUpStatus) => Promise<void>;
  newReport: () => void;
  deleteCurrent: () => void;
};
export default function ReportReview({
  current,
  summary,
  reportArea,
  sharing,
  error,
  heading,
  sendPanel,
  setSummary,
  saveReview,
  chooseArea,
  share,
  copy,
  updateFollowUp,
  newReport,
  deleteCurrent,
}: Props) {
  const recipient = reportArea?.representative;
  const reviewedReport = () => ({
    ...current,
    summary,
    recipient: reportArea || undefined,
  });
  return (
    <section className="review-view">
      <div className="page-heading">
        <h1 ref={heading} tabIndex={-1}>
          Your report
        </h1>
      </div>
      <div className="review-layout">
        <div className="report-paper">
          <div className="report-paper-header">
            <span>
              <CurbMark /> curb report
            </span>
            <small>{displayDate(current.created)}</small>
          </div>
          {current.image && (
            <img
              className="review-photo"
              src={current.image}
              alt={`${current.category} at ${current.place}`}
            />
          )}
          <div className="report-paper-content">
            <h2 className="report-category">{current.category}</h2>
            <p className="report-place">
              <MapPin size={15} />
              {current.place}
            </p>
            <label
              className="field-label report-text-label"
              htmlFor="report-summary"
            >
              Message <span className="optional">Edit anything</span>
            </label>
            <textarea
              id="report-summary"
              className="summary-editor"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              onBlur={saveReview}
              rows={10}
              maxLength={4000}
            />
          </div>
        </div>
        <div className="send-panel" ref={sendPanel}>
          <div className="send-panel-heading">
            <h2>Share your report</h2>
          </div>
          <Representative area={reportArea} compact />
          <button className="text-button choose-recipient" onClick={chooseArea}>
            {recipient ? "Change representative" : "Find representative"}
            <ArrowUpRight size={15} />
          </button>
          <button
            className="button-primary full share-button"
            onClick={() => void share()}
            disabled={sharing || !summary.trim()}
          >
            <Send size={18} />
            {sharing ? "Opening…" : "Share report"}
          </button>
          <p className="share-explainer">
            Opens your share sheet. You choose where to send it.
          </p>
          <a
            className="button-secondary full"
            href={officialContactUrl(reportArea?.contactUrl)}
            target="_blank"
            rel="noreferrer"
          >
            {recipient
              ? "Representative’s website"
              : "Find an official contact"}
            <ArrowUpRight size={17} />
          </a>
          <details className="share-alternatives">
            <summary>Copy & download</summary>
            <div>
              <button className="button-secondary" onClick={() => void copy()}>
                <Copy size={16} /> Copy message
              </button>
              <button
                className="button-secondary"
                disabled={!current.image}
                onClick={() => downloadPhoto(reviewedReport())}
              >
                <Download size={16} /> Save photo
              </button>
              <button
                className="text-button"
                onClick={() => downloadReport(reviewedReport())}
              >
                <FileText size={16} /> Download full report
              </button>
            </div>
          </details>
          <label className="follow-up-field">
            <span>Follow-up</span>
            <select
              value={current.followUp || "not-sent"}
              onChange={(event) => {
                const value = event.currentTarget.value;
                if (isFollowUpStatus(value)) void updateFollowUp(value);
              }}
            >
              {Object.entries(followUpLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <small>Updated by you.</small>
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="report-actions">
            <button className="text-button" onClick={newReport}>
              <Camera size={16} /> New report
            </button>
            <button
              className="icon-button delete-link"
              onClick={deleteCurrent}
              aria-label="Delete report"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
