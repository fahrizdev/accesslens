import type { RefObject } from "react";
import {
  ArrowRight,
  Camera,
  Copy,
  Download,
  ExternalLink,
  FileText,
  ImagePlus,
  MapPin,
  ScanLine,
  Send,
  ShieldCheck,
  Trash2,
  UserRound,
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
  const contactUrl = officialContactUrl(reportArea?.contactUrl);
  const reviewedReport = () => ({
    ...current,
    summary,
    recipient: reportArea || undefined,
  });
  return (
    <section className="review-view">
      <div className="page-intro">
        <span className="eyebrow">03 / REVIEW & SHARE</span>
        <h1 ref={heading} tabIndex={-1}>
          Looking good?
          <br />
          <span>Check your report.</span>
        </h1>
        <p>Review your report, then choose how to share it.</p>
      </div>
      <div className="review-layout">
        <div className="report-paper">
          <div className="report-paper-header">
            <span>
              <ScanLine size={17} /> Via report
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
            <span className="report-category">{current.category}</span>
            <p className="report-place">
              <MapPin size={14} />
              {current.place}
            </p>
            <label
              className="field-label report-text-label"
              htmlFor="report-summary"
            >
              Your report <span className="optional">editable</span>
            </label>
            <textarea
              id="report-summary"
              className="summary-editor"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              onBlur={saveReview}
              rows={9}
              maxLength={4000}
            />
            <div className="report-attachments">
              <span>
                <ImagePlus size={12} />{" "}
                {current.image ? "1 photo" : "Photo unavailable"}
              </span>
              <span>
                <MapPin size={12} /> Place included
              </span>
            </div>
          </div>
        </div>
        <div className="send-panel" ref={sendPanel}>
          <span className="eyebrow">TO YOUR REPRESENTATIVE</span>
          <Representative area={reportArea} compact />
          <button className="text-button" onClick={chooseArea}>
            {recipient ? "Change representative" : "Find my representative"}
            <ArrowRight size={14} />
          </button>
          <div className="send-divider" />
          <div className="sender-card">
            <span className="signature-icon">
              <UserRound size={18} />
            </span>
            <div>
              <small>SIGNED BY</small>
              <b>{current.sender?.name || "No signature added"}</b>
              <span>
                {current.sender?.email ||
                  "You can add contact details in the report text."}
              </span>
            </div>
          </div>
          <button
            className="button-primary full share-button"
            onClick={() => void share()}
            disabled={sharing || !summary.trim()}
          >
            <Send size={18} />
            {sharing ? "Opening share sheet…" : "Share report"}
          </button>
          <p className="share-explainer">
            Share your photo and report with an app of your choice. The share
            sheet doesn’t confirm that the office received it.
          </p>
          <a
            className="button-secondary full"
            href={contactUrl}
            target="_blank"
            rel="noreferrer"
          >
            {recipient
              ? "Open official representative page"
              : "Find official contact page"}
            <ExternalLink size={14} />
          </a>
          <p className="fine-print">
            {recipient
              ? "Their House Clerk page links to their website and contact details."
              : "No representative picked yet. Use the House lookup to find yours."}
          </p>
          <details className="share-alternatives">
            <summary>Copy, save, or attach manually</summary>
            <div>
              <button className="button-secondary" onClick={() => void copy()}>
                <Copy size={14} /> Copy report
              </button>
              <button
                className="button-secondary"
                disabled={!current.image}
                onClick={() => {
                  const report = reviewedReport();
                  if (report) downloadPhoto(report);
                }}
              >
                <Download size={14} /> Save photo
              </button>
              <button
                className="text-button"
                onClick={() => {
                  const report = reviewedReport();
                  if (report) downloadReport(report);
                }}
              >
                <FileText size={14} /> Download report with photo
              </button>
              <p className="fine-print">
                For contact forms, copy the text and attach the saved photo if
                the form allows attachments.
              </p>
            </div>
          </details>
          <div className="send-note">
            <ShieldCheck size={16} />
            <p>
              A representative’s office may connect you with the right agency;
              local repairs are usually handled by a city or property owner.
            </p>
          </div>
          <label className="follow-up-field">
            <span>Your follow-up</span>
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
            <small>
              These are your updates. Via can’t verify whether a report was sent
              or resolved.
            </small>
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="text-button new-report-link" onClick={newReport}>
            <Camera size={14} /> Report another barrier
          </button>
          <button className="text-button delete-link" onClick={deleteCurrent}>
            <Trash2 size={13} /> Delete report
          </button>
        </div>
      </div>
    </section>
  );
}
