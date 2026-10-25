import type { RefObject } from "react";
import { ArrowUpRight, ChevronLeft, Send, Trash2 } from "lucide-react";
import {
  followUpLabels,
  type BarrierReport,
  type FollowUpStatus,
} from "../reports";
import { officialContactUrl, type Area } from "../area";
import { ReportThumb } from "../Home";
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
  onBack: () => void;
  send: () => Promise<void>;
  updateFollowUp: (value: FollowUpStatus) => Promise<void>;
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
  onBack,
  send,
  updateFollowUp,
  deleteCurrent,
}: Props) {
  const recipient = reportArea?.representative;
  const followUp = current.followUp || "not-sent";
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
          <div className="compose-to">
            <span className="muted">To:</span>
            <button onClick={chooseArea}>
              {recipient || "Choose a representative"}
            </button>
          </div>
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
        <p className="group-footer enter" style={{ animationDelay: "80ms" }}>
          Tap the message to make changes before you send.
        </p>
        {followUp !== "not-sent" && (
          <p className="status-line">
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
      <div
        className="flow-footer send-footer enter"
        ref={sendPanel}
        style={{ animationDelay: "140ms" }}
      >
        <button
          className="button-primary full"
          onClick={() => void send()}
          disabled={sharing || !summary.trim()}
        >
          <Send size={18} />
          {sharing ? "Opening…" : "Send report"}
        </button>
        {recipient && (
          <a
            className="text-link"
            href={officialContactUrl(reportArea?.contactUrl)}
            target="_blank"
            rel="noreferrer"
          >
            Use the official contact page instead <ArrowUpRight size={15} />
          </a>
        )}
        {followUp === "not-sent" && (
          <button
            className="text-link quiet"
            onClick={() => void updateFollowUp("sent")}
          >
            Already sent it? Mark as sent
          </button>
        )}
      </div>
    </section>
  );
}
