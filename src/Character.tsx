import { useId } from "react";

// Small layered vector shapes keep the character crisp at every viewport size.
export default function Character({
  animated = false,
}: {
  animated?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <g className={animated ? "story-character" : "still-character"}>
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#f3e4ff" />
          <stop offset=".53" stopColor="#b8a4db" />
          <stop offset="1" stopColor="#8572b6" />
        </linearGradient>
        <radialGradient id={`${id}-face`} cx=".3" cy=".2" r=".9">
          <stop stopColor="#fffdf5" />
          <stop offset=".65" stopColor="#f7dfc9" />
          <stop offset="1" stopColor="#ddb7b3" />
        </radialGradient>
        <linearGradient id={`${id}-shoe`} x2=".8" y2="1">
          <stop stopColor="#8b799d" />
          <stop offset="1" stopColor="#514264" />
        </linearGradient>
      </defs>
      <ellipse cx="2" cy="8" rx="49" ry="11" fill="#685776" opacity=".12" />
      <g data-part="left-leg" className="character-left-leg">
        <path
          d="M-20-29L-25-4"
          stroke="#a593c2"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M-27-7Q-44-7-41 3Q-40 8-20 7L-17-3"
          fill={`url(#${id}-shoe)`}
        />
      </g>
      <g data-part="right-leg" className="character-right-leg">
        <path
          d="M18-29L24-4"
          stroke="#a593c2"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path d="M23-7Q39-8 41 2Q40 8 18 7L16-3" fill={`url(#${id}-shoe)`} />
      </g>
      <g data-part="body">
        <g data-part="left-arm">
          <path
            d="M-33-65Q-54-53-48-34"
            fill="none"
            stroke="#b5a3cf"
            strokeWidth="15"
            strokeLinecap="round"
          />
          <circle cx="-48" cy="-33" r="10" fill="#f5d8be" />
        </g>
        <path
          d="M-35-79Q-42-69-38-37Q-34-20 0-19Q34-20 38-37L35-79Z"
          fill={`url(#${id}-body)`}
        />
        <path
          d="M-28-74Q-9-60 27-72"
          fill="none"
          stroke="#f6edff"
          strokeWidth="3"
          opacity=".65"
        />
        <path
          d="M-24-82L26-33"
          stroke="#716184"
          strokeWidth="7"
          opacity=".75"
        />
        <g data-part="head">
          <path
            d="M-47-124Q-43-157 0-157Q45-157 49-124L47-91Q43-73 0-73Q-42-74-47-94Z"
            fill={`url(#${id}-face)`}
          />
          <path
            d="M-38-126Q-34-148 0-148"
            fill="none"
            stroke="#fffaf0"
            strokeWidth="5"
            strokeLinecap="round"
            opacity=".8"
          />
          <path d="M-4-153Q-13-174 7-180Q0-164 15-156" fill="#c5aedf" />
          <g data-part="eyes">
            <ellipse cx="-15" cy="-112" rx="5" ry="7" fill="#493c55" />
            <ellipse cx="17" cy="-112" rx="5" ry="7" fill="#493c55" />
            <circle cx="-14" cy="-114" r="1.5" fill="white" />
            <circle cx="18" cy="-114" r="1.5" fill="white" />
          </g>
          <ellipse
            cx="-29"
            cy="-99"
            rx="9"
            ry="5"
            fill="#eab4ad"
            opacity=".6"
          />
          <ellipse cx="31" cy="-99" rx="9" ry="5" fill="#eab4ad" opacity=".6" />
          <path
            d="M-7-95Q1-87 10-96"
            fill="none"
            stroke="#7c5263"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
        <g data-part="right-arm">
          <path
            d="M34-66Q51-62 47-42"
            fill="none"
            stroke="#ad99ca"
            strokeWidth="15"
            strokeLinecap="round"
          />
          <circle cx="47" cy="-40" r="10" fill="#f5d8be" />
        </g>
        <g data-part="camera" transform="translate(6 -42)">
          <rect x="-18" y="-14" width="45" height="30" rx="8" fill="#6b597f" />
          <path d="M-9-14L-5-20H12L16-14" fill="#6b597f" />
          <rect x="-16" y="-12" width="40" height="25" rx="6" fill="#9581ad" />
          <circle cx="5" r="12" fill="#eadcf3" />
          <circle cx="5" r="8" fill="#4f4163" />
          <circle cx="3" cy="-2" r="3" fill="#c2daea" />
          <rect x="17" y="-8" width="5" height="4" rx="1" fill="#fff5d9" />
        </g>
      </g>
    </g>
  );
}
