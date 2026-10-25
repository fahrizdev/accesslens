import { useEffect, useRef, type RefObject } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  PenLine,
  Send,
  Trash2,
} from "lucide-react";
import type { BarrierReport, FollowUpStatus } from "../reports";
import { officialContactUrl, type Area } from "../area";
import { ReportThumb, StatusTag } from "../Home";

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

// What someone can do next depends on where the report is.
function nextSteps(
  followUp: FollowUpStatus,
): { label: string; value: FollowUpStatus }[] {
  if (followUp === "resolved") return [{ label: "Reopen", value: "sent" }];
  if (followUp === "replied" || followUp === "referred")
    return [{ label: "Mark resolved", value: "resolved" }];
  return [
    { label: "They replied", value: "replied" },
    { label: "Mark resolved", value: "resolved" },
  ];
}

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
  const sentQuestion = useRef<HTMLHeadingElement>(null);
  // The send button is replaced by this question, so bring focus along.
  useEffect(() => {
    if (askIfSent) sentQuestion.current?.focus();
  }, [askIfSent]);
  return (
    <section className="flow-view">
      <header className="nav-bar">
        <button className="nav-text" onClick={onBack}>
          <ChevronLeft size={24} strokeWidth={2.4} aria-hidden="true" /> Details
        </button>
        <h1 ref={heading} tabIndex={-1}>
          Review
        </h1>
        <span />
      </header>
      <div className="flow-body">
        {followUp !== "not-sent" && (
          <section className="status-card enter" aria-label="Follow-up">
            <StatusTag report={current} />
            <div className="status-actions">
              {nextSteps(followUp).map(({ label, value }) => (
                <button
                  key={value}
                  className="pill-button"
                  onClick={() => void updateFollowUp(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>
        )}
        <div className="grouped compose enter">
          <button
            className={`compose-to ${recipient ? "" : "needs-recipient"}`}
            onClick={chooseArea}
          >
            <span className="muted">To</span>
            <span className="compose-recipient">
              {recipient
                ? `${recipient}${reportArea?.district ? ` · ${reportArea.district}` : ""}`
                : "Choose who to send it to"}
            </span>
            <ChevronRight size={16} className="chevron" aria-hidden="true" />
          </button>
          <label className="compose-label" htmlFor="report-summary">
            <span>Message</span>
            <span className="compose-hint">
              <PenLine size={13} aria-hidden="true" /> Tap to edit
            </span>
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
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button
          className="text-button danger-text delete-report"
          onClick={deleteCurrent}
        >
          <Trash2 size={16} aria-hidden="true" /> Delete report
        </button>
      </div>
      <div className="flow-footer send-footer" ref={sendPanel}>
        {askIfSent ? (
          <div className="sent-check" role="group" aria-labelledby="sent-q">
            <h2 id="sent-q" ref={sentQuestion} tabIndex={-1}>
              Did it reach {recipient ? repTitle(recipient) : "them"}?
            </h2>
            <p>We’ll keep it under Sent until you hear back.</p>
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
              <Send size={18} aria-hidden="true" />
              {sharing
                ? "Opening…"
                : followUp !== "not-sent"
                  ? "Send again"
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
                Use their official contact form (copies the message)
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
            )}
          </>
        )}
      </div>
    </section>
  );
}
