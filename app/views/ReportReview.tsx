import type { RefObject } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Send,
  Trash2,
} from "lucide-react";
import {
  followUpLabels,
  type BarrierReport,
  type FollowUpStatus,
} from "../reports";
import { officialContactUrl, type Area } from "../area";
import { ReportThumb } from "../Home";

// "Pramila Jayapal" -> "Rep. Jayapal", so the button says exactly who it reaches.
export function repTitle(name: string) {
  const parts = name
    .replace(/,?\s+(jr\.?|sr\.?|ii|iii|iv)$/i, "")
    .trim()
    .split(/\s+/);
  return `Rep. ${parts[parts.length - 1]}`;
}

type Props = {
  current: BarrierReport;
  summary: string;
  reportArea: Area | null;
  sharing: boolean;
  sendAttempted: boolean;
  error: string;
  heading: RefObject<HTMLHeadingElement | null>;
  sendPanel: RefObject<HTMLDivElement | null>;
  setSummary: (value: string) => void;
  saveReview: () => void;
  chooseArea: () => void;
  onBack: () => void;
  send: () => Promise<void>;
  onOfficialPage: () => void;
  dismissSendCheck: () => void;
  updateFollowUp: (value: FollowUpStatus) => Promise<void>;
  deleteCurrent: () => void;
};
export default function ReportReview({
  current,
  summary,
  reportArea,
  sharing,
  sendAttempted,
  error,
  heading,
  sendPanel,
  setSummary,
  saveReview,
  chooseArea,
  onBack,
  send,
  onOfficialPage,
  dismissSendCheck,
  updateFollowUp,
  deleteCurrent,
}: Props) {
  const recipient = reportArea?.representative;
  const followUp = current.followUp || "not-sent";
  const askIfSent = sendAttempted && followUp === "not-sent";
  return (
    <section className="flow-view">
      <header className="nav-bar">
        <button className="nav-text" onClick={onBack}>
          <ChevronLeft size={24} strokeWidth={2.4} /> Details
        </button>
        <h1 ref={heading} tabIndex={-1}>
          Review
        </h1>
        <button
          className="nav-icon danger"
          aria-label="Delete report"
          onClick={deleteCurrent}
        >
          <Trash2 size={20} />
        </button>
      </header>
      <div className="flow-body">
        <div className="grouped compose enter">
          <button
            className={`compose-to ${recipient ? "" : "needs-recipient"}`}
            onClick={chooseArea}
          >
            <span className="muted">To:</span>
            <span className="compose-recipient">
              {recipient
                ? `${recipient}${reportArea?.district ? ` · ${reportArea.district}` : ""}`
                : "Choose who to send it to"}
            </span>
            <ChevronRight size={16} className="chevron" />
          </button>
          <label className="sr-only" htmlFor="report-summary">
            Message
          </label>
          <textarea
            id="report-summary"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            onBlur={saveReview}
            rows={11}
            maxLength={4000}
          />
          <div className="attachment">
            <span className="thumb">
              <ReportThumb report={current} />
            </span>
            <span className="row-copy">
              <b>{current.image ? "Photo attached" : "No photo"}</b>
              <small>
                {current.category} · {current.place}
              </small>
            </span>
          </div>
        </div>
        <p className="group-footer">
          Tap the message to make changes before you send.
        </p>
        {followUp !== "not-sent" && (
          <p className="status-line">
            <span className="status-dot" aria-hidden="true" />
            {followUpLabels[followUp]}
            {followUp === "resolved" ? (
              <button onClick={() => void updateFollowUp("waiting")}>
                Reopen
              </button>
            ) : (
              <button onClick={() => void updateFollowUp("resolved")}>
                Mark resolved
              </button>
            )}
          </p>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="flow-footer send-footer" ref={sendPanel}>
        {askIfSent ? (
          <div className="sent-check" role="group" aria-labelledby="sent-q">
            <b id="sent-q">
              Did it reach {recipient ? repTitle(recipient) : "them"}?
            </b>
            <p>We’ll keep it under Waiting until you hear back.</p>
            <div className="sent-check-actions">
              <button className="button-secondary" onClick={dismissSendCheck}>
                Not yet
              </button>
              <button
                className="button-primary"
                onClick={() => void updateFollowUp("sent")}
              >
                Yes, it’s sent
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              className="button-primary full"
              onClick={() => void send()}
              disabled={sharing || !summary.trim()}
            >
              <Send size={18} />
              {sharing
                ? "Opening…"
                : recipient
                  ? `Send to ${repTitle(recipient)}`
                  : "Send report"}
            </button>
            {recipient && (
              <a
                className="text-link"
                href={officialContactUrl(reportArea?.contactUrl)}
                target="_blank"
                rel="noreferrer"
                onClick={onOfficialPage}
              >
                Use their official contact form <ArrowUpRight size={15} />
              </a>
            )}
          </>
        )}
      </div>
    </section>
  );
}
