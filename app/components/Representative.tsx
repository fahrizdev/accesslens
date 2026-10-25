import { Check, UserRound } from "lucide-react";
import type { Area } from "../area";

export default function Representative({
  area,
  compact = false,
}: {
  area: Area | null | undefined;
  compact?: boolean;
}) {
  return (
    <div
      className={`representative ${compact ? "compact-representative" : ""}`}
    >
      <div className="representative-avatar">
        <UserRound size={compact ? 22 : 31} strokeWidth={1.3} />
      </div>
      <div>
        <span className="micro-label">
          {area?.representative
            ? "Your U.S. House representative"
            : "Your representative"}
        </span>
        <h3>{area?.representative || "Find your representative"}</h3>
        <p>
          {area?.district ||
            (area?.label
              ? `Area: ${area.label}`
              : "Choose an area to look them up.")}
        </p>
      </div>
      {area?.representative && (
        <span
          className="verified-mark"
          aria-label="Matched from the House Clerk directory"
        >
          <Check size={15} />
        </span>
      )}
    </div>
  );
}
