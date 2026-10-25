import { useMemo, type ChangeEvent, type RefObject } from "react";
import {
  ArrowUpRight,
  Camera,
  ChevronRight,
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
import { downloadPhoto, downloadReport, photoFile } from "../reportFiles";
import Representative from "../components/Representative";
import PhotoPicker from "../components/PhotoPicker";
import { CurbMark } from "../Brand";
type Props = {
  current: BarrierReport;
  summary: string;
  reportArea: Area | null;
  sharing: boolean;
  processing: boolean;
  error: string;
  heading: RefObject<HTMLHeadingElement | null>;
  sendPanel: RefObject<HTMLDivElement | null>;
  setSummary: (value: string) => void;
  saveReview: () => void;
  chooseArea: () => void;
  share: () => Promise<void>;
  copy: () => Promise<void>;
  updateFollowUp: (value: FollowUpStatus) => Promise<void>;
  newReport: (event: ChangeEvent<HTMLInputElement>) => void;
  deleteCurrent: () => void;
};
export default function ReportReview({
  current,
  summary,
  reportArea,
  sharing,
  processing,
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
  // Only offer the share sheet where it can carry the photo.
  const canShareFiles = useMemo(() => {
    const file = photoFile(current);
    try {
      return Boolean(
        file &&
          typeof navigator.share === "function" &&
          navigator.canShare?.({ files: [file] }),
      );
    } catch {
      return false;
    }
  }, [current.image]);
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
          <h2>Send it</h2>
          <div className="recipient-inline">
            <Representative area={reportArea} compact />
            <button
              type="button"
              className={recipient ? "text-button" : "button-secondary"}
              onClick={chooseArea}
            >
              {recipient ? "Change" : "Find"}
              <ChevronRight size={14} />
            </button>
          </div>
          {recipient && (
            <a
              className="text-button official-link"
              href={officialContactUrl(reportArea?.contactUrl)}
              target="_blank"
              rel="noreferrer"
            >
              {recipient}’s official page <ArrowUpRight size={15} />
            </a>
          )}
          <div className="send-actions">
            {canShareFiles && (
              <button
                className="button-primary full"
                onClick={() => void share()}
                disabled={sharing || !summary.trim()}
              >
                <Send size={18} />
                {sharing ? "Opening…" : "Share report"}
              </button>
            )}
            <div className="send-actions-row">
              <button
                className={
                  canShareFiles ? "button-secondary" : "button-primary"
                }
                onClick={() => void copy()}
                disabled={!summary.trim()}
              >
                <Copy size={16} /> Copy message
              </button>
              <button
                className="button-secondary"
                disabled={!current.image}
                onClick={() => downloadPhoto(reviewedReport())}
              >
                <Download size={16} /> Save photo
              </button>
            </div>
            <p className="share-explainer">
              {canShareFiles
                ? "Share opens your device’s share sheet with the photo attached. You choose where it goes."
                : "Copy the message and save the photo, then paste and attach them wherever you send it."}
            </p>
            <button
              className="text-button download-report"
              onClick={() => downloadReport(reviewedReport())}
            >
              <FileText size={16} /> Download full report
            </button>
          </div>
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
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="report-actions">
            <PhotoPicker
              className="text-button"
              label="New report: take or choose a photo"
              disabled={processing}
              onPick={newReport}
            >
              <Camera size={16} /> {processing ? "Preparing…" : "New report"}
            </PhotoPicker>
            <button className="text-button delete-link" onClick={deleteCurrent}>
              <Trash2 size={16} /> Delete report
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
