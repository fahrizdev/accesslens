import { normalizeProfile, signature, type SenderProfile } from "./profile.ts";

export const categories = [
  "Blocked curb ramp",
  "Stairs-only entrance",
  "Obstructed pathway",
  "Uneven surface",
  "Heavy or difficult door",
  "Missing signage",
  "Other",
];
import { normalizeArea, type Area } from "./area.ts";
export type { Area } from "./area.ts";

export type FollowUpStatus =
  | "not-sent"
  | "sent"
  | "waiting"
  | "replied"
  | "referred"
  | "resolved";
export type BarrierReport = {
  id: string;
  category: string;
  note: string;
  place: string;
  coordinates?: string;
  image: string;
  created: string;
  summary: string;
  recipient?: Area;
  sender?: SenderProfile;
  followUp?: FollowUpStatus;
  status: "Draft" | "Shared";
};
export const followUpLabels: Record<FollowUpStatus, string> = {
  "not-sent": "Not sent",
  sent: "Sent",
  waiting: "Waiting for a reply",
  replied: "They replied",
  referred: "Referred elsewhere",
  resolved: "Resolved",
};

// The three groups people see in Reports, the stats and the status dots.
export type ReportGroup = "Drafts" | "Sent" | "Resolved";
export function reportGroup(
  report: Pick<BarrierReport, "followUp">,
): ReportGroup {
  if (report.followUp === "resolved") return "Resolved";
  return report.followUp && report.followUp !== "not-sent" ? "Sent" : "Drafts";
}

export function buildSummary(
  category: string,
  place: string,
  note: string,
  coordinates?: string,
  name?: string,
  sender?: SenderProfile,
  hasPhoto = true,
) {
  const signOff = signature(sender);
  return `${name ? `Hello Representative ${name},` : "Hello,"}\n\nI’m reporting a possible accessibility barrier.\n\n${category}\nLocation: ${place}${coordinates ? ` (${coordinates})` : ""}${note.trim() ? `\n${note.trim()}` : ""}\n\nCould your office review this or direct me to the team responsible?${hasPhoto ? " Photo attached." : ""} Thank you.${signOff ? `\n\n${signOff}` : ""}`;
}
export function retargetSummary(
  text: string,
  previousName?: string,
  nextName?: string,
): string {
  const previousGreeting = previousName
    ? `Hello Representative ${previousName},`
    : "Hello,";
  const nextGreeting = nextName
    ? `Hello Representative ${nextName},`
    : "Hello,";
  if (text === previousGreeting || text.startsWith(`${previousGreeting}\n`)) {
    return nextGreeting + text.slice(previousGreeting.length);
  }
  return text;
}

export function isFollowUpStatus(value: unknown): value is FollowUpStatus {
  return typeof value === "string" && Object.hasOwn(followUpLabels, value);
}

export function reportStatusLabel(report: BarrierReport): string {
  if (report.followUp && report.followUp !== "not-sent") {
    return followUpLabels[report.followUp];
  }
  // Opened in another app, but the person hasn't said it went out.
  return report.status === "Shared" ? "Not confirmed sent" : "Draft";
}

export function displayDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function normalizeReport(value: unknown): BarrierReport | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (
    typeof item.id !== "string" ||
    !item.id ||
    typeof item.summary !== "string"
  )
    return null;
  const text = (key: string, fallback = "") =>
    typeof item[key] === "string" ? item[key] : fallback;
  return {
    id: item.id,
    category: text("category", "Other"),
    note: text("note"),
    place: text("place", "Location not recorded"),
    coordinates: text("coordinates") || undefined,
    image: text("image"),
    created: text("created"),
    summary: item.summary,
    recipient: normalizeArea(item.recipient) || undefined,
    sender: item.sender ? normalizeProfile(item.sender) : undefined,
    followUp: isFollowUpStatus(item.followUp) ? item.followUp : undefined,
    status: item.status === "Shared" ? "Shared" : "Draft",
  };
}

export function sortReports(reports: BarrierReport[]): BarrierReport[] {
  return [...reports].sort((a, b) => b.created.localeCompare(a.created));
}

export type ReportDetails = Pick<
  BarrierReport,
  "category" | "note" | "place" | "coordinates" | "image" | "recipient"
>;

export function createDraft(
  details: ReportDetails,
  sender: SenderProfile,
  id: string,
  previous?: BarrierReport | null,
): BarrierReport {
  // Existing reports retain their signature and any deliberately edited message.
  const reportSender = previous ? previous.sender : normalizeProfile(sender);
  const draft = buildSummary(
    details.category,
    details.place,
    details.note,
    details.coordinates,
    details.recipient?.representative,
    reportSender,
    Boolean(details.image),
  );
  const original =
    previous &&
    buildSummary(
      previous.category,
      previous.place,
      previous.note,
      previous.coordinates,
      previous.recipient?.representative,
      previous.sender,
      Boolean(previous.image),
    );
  const summary =
    previous && previous.summary !== original
      ? retargetSummary(
          previous.summary,
          previous.recipient?.representative,
          details.recipient?.representative,
        )
      : draft;
  return {
    ...details,
    id,
    created: previous?.created || new Date().toISOString(),
    summary,
    sender: reportSender,
    followUp: previous?.followUp || "not-sent",
    status: previous?.status || "Draft",
  };
}
