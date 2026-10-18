import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, Check, MapPin } from "lucide-react";

export function LensMark({ className = "" }: { className?: string }) {
  return (
    <span className={`lens-mark ${className}`} aria-hidden="true">
      <span className="lens-aura" />
      <svg viewBox="0 0 100 100" fill="none">
        <path
          d="M50 9C47 30 38 39 17 42C34 44 43 39 50 27C57 39 66 44 83 42C62 39 53 30 50 9Z"
          fill="currentColor"
        />
        <path
          d="M50 91C47 70 38 61 17 58C34 56 43 61 50 73C57 61 66 56 83 58C62 61 53 70 50 91Z"
          fill="currentColor"
        />
        <circle cx="50" cy="50" r="9" fill="currentColor" />
      </svg>
    </span>
  );
}

export function Splash({ onContinue }: { onContinue: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const exitTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(exitTimer.current), []);

  function enterApp() {
    if (leaving) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onContinue();
      return;
    }
    setLeaving(true);
    exitTimer.current = window.setTimeout(onContinue, 300);
  }

  return (
    <div className={`launch-screen${leaving ? " launch-leaving" : ""}`}>
      <div className="launch-center" role="img" aria-label="AccessLens">
        <LensMark className="launch-mark" />
      </div>
      <button
        className="launch-enter gradient-circle"
        aria-label="Open AccessLens"
        onClick={enterApp}
        disabled={leaving}
      >
        <ArrowDown size={28} strokeWidth={1.7} />
      </button>
    </div>
  );
}

export function PlaceIllustration({
  kind = "ramp",
}: {
  kind?: "ramp" | "door" | "path";
}) {
  if (kind === "door")
    return (
      <svg viewBox="0 0 260 240" fill="none" aria-hidden="true">
        <circle cx="205" cy="44" r="22" fill="#eebbe4" />
        <path d="M12 199L130 137L254 199L135 257Z" fill="#ada9eb" />
        <path d="M66 56L167 27V184L66 215Z" fill="#ede8fd" />
        <path d="M78 67L157 45V181L78 204Z" fill="#433d81" />
        <path d="M83 70L139 82V217L83 202Z" fill="#9b8cdb" />
        <path d="M91 82L131 91V166L91 157Z" fill="#c4b8ee" />
        <path
          d="M125 179V191"
          stroke="#fff"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M154 205L191 186M184 182L196 183L193 195"
          stroke="#faf7ff"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M205 179V141" stroke="#556344" strokeWidth="4" />
        <ellipse cx="204" cy="131" rx="15" ry="30" fill="#a8ca8a" />
      </svg>
    );
  if (kind === "path")
    return (
      <svg viewBox="0 0 260 240" fill="none" aria-hidden="true">
        <circle cx="58" cy="52" r="25" fill="#ffdb97" />
        <path d="M0 120L260 99V240H0Z" fill="#e1b294" />
        <path d="M135 100L175 100L119 240H0Z" fill="#fff0d4" />
        <path
          d="M139 113L151 113M126 146L141 146M109 188L128 188"
          stroke="#cba77c"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path d="M51 164V84M206 139V62" stroke="#756950" strokeWidth="5" />
        <ellipse cx="51" cy="84" rx="26" ry="36" fill="#8d9d6d" />
        <ellipse cx="206" cy="67" rx="25" ry="36" fill="#798e69" />
        <path
          d="M165 173H224M172 174V195M216 174V195M165 160H224"
          stroke="#6c6657"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>
    );
  return (
    <svg viewBox="0 0 300 270" fill="none" aria-hidden="true">
      <circle cx="236" cy="46" r="26" fill="#f1f3b4" />
      <path d="M0 201L145 128L300 194V270H0Z" fill="#a7cbb7" />
      <path d="M66 128L142 91L231 132L156 169Z" fill="#f5f3dc" />
      <path d="M66 128L156 169V196L66 155Z" fill="#bbbe9d" />
      <path d="M156 169L231 132V157L156 196Z" fill="#d0d2b2" />
      <path d="M156 169L204 148L267 202L220 225Z" fill="#f8f4dc" />
      <path d="M220 225L267 202V216L220 239Z" fill="#babe9a" />
      <path d="M156 169L220 225V239L156 196Z" fill="#ced0ae" />
      <path
        d="M164 166V139L222 190V219M202 148V121L261 174V201M161 137L224 191M200 119L264 175"
        stroke="#547866"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M53 157V91" stroke="#6b7861" strokeWidth="5" />
      <ellipse cx="53" cy="80" rx="23" ry="37" fill="#729b7d" />
      <path
        d="M15 227L86 191"
        stroke="#d5e7cd"
        strokeWidth="3"
        strokeDasharray="8 9"
      />
    </svg>
  );
}

export function WelcomeGallery({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`welcome-gallery ${compact ? "compact-gallery" : ""}`}
      aria-hidden="true"
    >
      <div className="gallery-wash" />
      <div className="art-card door-card">
        <div className="card-illustration">
          <span>OPEN POSSIBILITIES</span>
          <PlaceIllustration kind="door" />
        </div>
        <div className="art-caption">
          Every entrance matters.
          <ArrowUpRight size={16} />
        </div>
      </div>
      <div className="art-card path-card">
        <div className="card-illustration">
          <span>THE EVERYDAY, BETTER</span>
          <PlaceIllustration kind="path" />
        </div>
        <div className="art-caption">
          A little more room.
          <ArrowUpRight size={16} />
        </div>
      </div>
      <div className="art-card ramp-card">
        <div className="card-illustration">
          <span>A WAY FORWARD</span>
          <PlaceIllustration />
        </div>
        <div className="art-caption">
          Access starts here.
          <ArrowUpRight size={16} />
        </div>
      </div>
      <div className="gallery-tag tag-notice">
        <span>
          <Check size={13} />
        </span>{" "}
        Small things. Real voices.
      </div>
      <div className="gallery-tag tag-place">
        <MapPin size={14} /> Your neighborhood
      </div>
      <span className="gallery-star star-one">✧</span>
      <span className="gallery-star star-two">✦</span>
    </div>
  );
}
