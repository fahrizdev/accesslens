import { useEffect, useRef, useState } from "react";
import { ArrowRight, Pause, Play } from "lucide-react";
import Character from "./Character";
import { INTRO_DURATION, introFrame } from "./intro-timeline";

const captions = [
  ["INTRODUCING", "AccessLens.", "A little attention can open up a world."],
  ["LOOK A LITTLE CLOSER", "Everyday places. Everyone.", ""],
  ["FROM A PHOTO TO A REPORT", "Make access visible.", ""],
  ["WELCOME IN", "It starts with you.", ""],
];

function Street() {
  return (
    <g>
      <defs>
        <linearGradient id="street-top" x2=".2" y2="1">
          <stop stopColor="#faf7ed" />
          <stop offset="1" stopColor="#e5dce5" />
        </linearGradient>
        <linearGradient id="shop-front" x2="1" y2="1">
          <stop stopColor="#f8d7bc" />
          <stop offset="1" stopColor="#deb5ac" />
        </linearGradient>
        <linearGradient id="glass" x2=".7" y2="1">
          <stop stopColor="#c5d2d9" />
          <stop offset="1" stopColor="#82959f" />
        </linearGradient>
        <radialGradient id="tree-leaf" cx=".3" cy=".2">
          <stop stopColor="#d8dfc5" />
          <stop offset="1" stopColor="#9caf9b" />
        </radialGradient>
      </defs>
      <ellipse
        cx="469"
        cy="516"
        rx="317"
        ry="46"
        fill="#8b7894"
        opacity=".08"
      />
      <path d="M106 377L569 280L799 397V451L332 564L106 435Z" fill="#d1c6d5" />
      <path d="M106 377L569 280L799 397L332 511Z" fill="url(#street-top)" />
      <path d="M332 511V564L799 451V397Z" fill="#b9aec5" />
      <path
        d="M106 421L332 546L799 434"
        stroke="#e5dce8"
        fill="none"
        strokeWidth="3"
      />
      <path
        d="M177 411L368 515M315 370L507 480M456 339L648 445"
        stroke="#d9cedc"
        strokeWidth="2"
        opacity=".7"
      />
      <g className="story-shop">
        <path d="M384 193L592 155L710 217L499 264Z" fill="#fff1de" />
        <path d="M384 193L499 254V412L384 350Z" fill="#cfadad" />
        <path d="M499 254L710 207V364L499 412Z" fill="url(#shop-front)" />
        <path d="M375 185L593 141L721 207L498 258Z" fill="#efe1cf" />
        <path d="M375 185V201L498 270V258Z" fill="#d5c5c5" />
        <path d="M498 258L721 207V223L498 270Z" fill="#e3cfbc" />
        <path d="M527 285L593 271V384L527 398Z" fill="#846e89" />
        <path d="M534 291L585 280V379L534 390Z" fill="url(#glass)" />
        <path d="M537 297L579 287L537 341Z" fill="#ecf2ec" opacity=".35" />
        <path
          d="M576 335V353"
          stroke="#f8e6d1"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path d="M617 271L686 256V332L617 349Z" fill="#fff0dc" />
        <path d="M623 278L680 265V326L623 339Z" fill="url(#glass)" />
        <path d="M651 272V332" stroke="#fff0dc" strokeWidth="4" />
        <path d="M516 278L698 237L715 260L524 305Z" fill="#b5a1c9" />
        <path d="M524 305L715 260V273L524 317Z" fill="#9885af" />
        <path
          d="M546 272L556 298M581 264L591 289M617 256L627 281M653 248L663 272M686 241L698 265"
          stroke="#e7dced"
          strokeWidth="15"
        />
        <path d="M411 254L468 283V341L411 311Z" fill="#b8bbc5" />
        <path d="M419 269L459 289" stroke="#e6d3d6" strokeWidth="4" />
        <path d="M525 399L591 384L655 421L587 439Z" fill="#e7d5d2" />
        <path d="M587 439L655 421V430L587 448Z" fill="#bba7b5" />
        <path d="M527 399L587 439V448L522 410Z" fill="#c6b1be" />
      </g>
      <g className="story-tree">
        <path d="M210 343L238 337L244 375L214 382Z" fill="#c8b0ab" />
        <path
          d="M224 348V256"
          stroke="#aa9089"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M224 310L204 291M226 290L246 268"
          stroke="#aa9089"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <ellipse cx="224" cy="254" rx="48" ry="61" fill="url(#tree-leaf)" />
        <ellipse
          cx="205"
          cy="244"
          rx="30"
          ry="43"
          fill="#d5ddc7"
          opacity=".5"
        />
      </g>
      <g className="story-barrier">
        <ellipse
          cx="578"
          cy="429"
          rx="31"
          ry="10"
          fill="#857185"
          opacity=".14"
        />
        <path d="M549 420L578 411L606 425L576 435Z" fill="#9d7979" />
        <path d="M564 419L570 377Q576 370 582 377L591 424Z" fill="#df957a" />
        <path d="M568 390L584 391L587 405L566 404Z" fill="#fff0da" />
        <ellipse cx="576" cy="377" rx="6" ry="3" fill="#f8baa0" />
      </g>
      <path
        d="M681 385L733 373M694 394L746 381"
        stroke="#f5eced"
        strokeWidth="4"
        strokeLinecap="round"
        opacity=".8"
      />
    </g>
  );
}

function ReportCard() {
  return (
    <g>
      <ellipse cx="0" cy="196" rx="124" ry="15" fill="#7c6491" opacity=".12" />
      <rect x="-134" y="-161" width="278" height="344" rx="27" fill="#cfc1dc" />
      <rect
        x="-140"
        y="-170"
        width="278"
        height="344"
        rx="27"
        fill="#fffdfa"
        stroke="#ece3ed"
        strokeWidth="2"
      />
      <rect x="-121" y="-151" width="240" height="160" rx="15" fill="#ece4ee" />
      <path d="M-113-32L35-90L111-39L-38 7Z" fill="#d5c8df" />
      <path d="M-30-114L55-129L94-105L9-84Z" fill="#f9e4ce" />
      <path d="M9-84L94-105V-43L9-19Z" fill="#e4bca9" />
      <path d="M-30-114L9-84V-19L-30-45Z" fill="#c7a8ad" />
      <path d="M22-76L49-83V-32L22-23Z" fill="#94a6b0" />
      <path d="M22-23L49-32L79-14L52-6Z" fill="#e9d2cf" />
      <path d="M38-26L47-54L57-26Z" fill="#dc9279" />
      <path d="M43-42H51L54-34H41Z" fill="#fff1dc" />
      <path
        d="M-108-133H-91M-108-133V-116M105-133H88M105-133V-116M-108-9V-26M-108-9H-91M105-9H88M105-9V-26"
        stroke="#fff"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="-102" cy="39" r="7" fill="#b39cc6" />
      <text x="-84" y="44" fill="#655473" fontSize="14" fontFamily="inherit">
        Access report
      </text>
      <rect x="-109" y="66" width="181" height="8" rx="4" fill="#d7cadd" />
      <rect x="-109" y="86" width="211" height="7" rx="3.5" fill="#ebe4ee" />
      <rect x="-109" y="103" width="148" height="7" rx="3.5" fill="#ebe4ee" />
      <rect x="-109" y="132" width="88" height="21" rx="10.5" fill="#f0eaf5" />
      <text x="-95" y="146" fill="#80698f" fontSize="10" fontFamily="inherit">
        Your draft
      </text>
      <circle
        cx="108"
        cy="-151"
        r="26"
        fill="#e5eddc"
        stroke="#fff"
        strokeWidth="5"
      />
      <path
        d="M97-151L105-143L119-160"
        fill="none"
        stroke="#7b9271"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

export default function Intro({
  active,
  onFinish,
}: {
  active: boolean;
  onFinish: () => void;
}) {
  const root = useRef<HTMLElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const elapsed = useRef(0);
  const scrubber = useRef<HTMLInputElement>(null);
  const [seekVersion, setSeekVersion] = useState(0);
  const finish = useRef(onFinish);
  finish.current = onFinish;
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [caption, setCaption] = useState(0);
  const lastCaption = useRef(0);
  const [leaving, setLeaving] = useState(false);
  const finished = useRef(false);
  const exitTimer = useRef<number | undefined>(undefined);
  function leave() {
    if (finished.current) return;
    finished.current = true;
    setLeaving(true);
    exitTimer.current = window.setTimeout(
      () => finish.current(),
      reduced ? 0 : 850,
    );
  }
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches);
    preference.addEventListener("change", update);
    return () => {
      preference.removeEventListener("change", update);
      window.clearTimeout(exitTimer.current);
    };
  }, []);
  useEffect(() => {
    if (active) root.current?.focus({ preventScroll: true });
  }, [active]);
  useEffect(() => {
    const scene = svg.current;
    if (!scene) return;
    const find = (selector: string) =>
      scene.querySelector<SVGElement>(selector)!;
    const world = find('[data-scene="world"]');
    const actor = find('[data-scene="actor"]');
    const card = find('[data-scene="card"]');
    const ring = find('[data-scene="focus"]');
    const flash = find('[data-scene="flash"]');
    const body = find('[data-part="body"]');
    const leftLeg = find('[data-part="left-leg"]');
    const rightLeg = find('[data-part="right-leg"]');
    const arm = find('[data-part="right-arm"]');
    const head = find('[data-part="head"]');
    const eyes = find('[data-part="eyes"]');
    const camera = find('[data-part="camera"]');
    const render = (time: number) => {
      const f = introFrame(time);
      world.setAttribute("transform", `translate(0 ${48 * (1 - f.world)})`);
      world.style.opacity = String(f.world * (1 - f.report * 0.84));
      actor.setAttribute(
        "transform",
        `translate(${f.x - f.report * 118} ${f.y - Math.abs(f.stride) * 6 + f.report * 29}) scale(${f.scale - f.report * 0.1})`,
      );
      actor.style.opacity = String(1 - f.resolve);
      body.setAttribute("transform", `rotate(${f.stride * 3} 0 -35)`);
      leftLeg.setAttribute("transform", `rotate(${f.stride * 24} -20 -29)`);
      rightLeg.setAttribute("transform", `rotate(${-f.stride * 24} 18 -29)`);
      const wave =
        time < 2000
          ? Math.sin(time / 220) * 9 * Math.sin((Math.PI * time) / 2000) - 55
          : 0;
      arm.setAttribute(
        "transform",
        `rotate(${wave - f.capture * (1 - f.report) * 65} 34 -66)`,
      );
      head.setAttribute(
        "transform",
        `rotate(${f.capture * (1 - f.report) * 6} 0 -90)`,
      );
      const blink = time % 3400 > 3100 && time % 3400 < 3260;
      eyes.setAttribute(
        "transform",
        blink
          ? "translate(0 -101) scale(1 .1)"
          : `translate(${f.capture * (1 - f.report) * 4} 0)`,
      );
      camera.setAttribute(
        "transform",
        `translate(${6 + f.capture * (1 - f.report) * 25} ${-42 - f.capture * (1 - f.report) * 54}) rotate(${f.capture * (1 - f.report) * -8})`,
      );
      ring.style.opacity = String(f.capture * (1 - f.report));
      ring.setAttribute(
        "transform",
        `translate(576 404) scale(${1.12 - f.capture * 0.12})`,
      );
      flash.style.opacity = String(f.flash * 0.6);
      card.style.opacity = String(f.report * (1 - f.resolve));
      card.setAttribute(
        "transform",
        `translate(${510 - 60 * f.report} ${390 + 40 * (1 - f.report)}) rotate(${-10 * (1 - f.report)}) scale(${0.72 + 0.28 * f.report})`,
      );
      root.current?.style.setProperty(
        "--film-progress",
        String(time / INTRO_DURATION),
      );
      if (scrubber.current) {
        scrubber.current.value = String(time);
        scrubber.current.setAttribute(
          "aria-valuetext",
          `${(time / 1000).toFixed(1)} of ${(INTRO_DURATION / 1000).toFixed(1)} seconds`,
        );
      }
      if (lastCaption.current !== f.caption) {
        lastCaption.current = f.caption;
        setCaption(f.caption);
      }
    };
    if (reduced) {
      render(7800);
      return;
    }
    render(elapsed.current);
    if (!active || paused || leaving) return;
    let frame = 0;
    let last: number | undefined;
    function tick(now: number) {
      // Pause the story in background tabs; do not skip scenes on return.
      if (document.hidden) last = undefined;
      else {
        if (last !== undefined)
          elapsed.current = Math.min(
            INTRO_DURATION,
            elapsed.current + Math.min(now - last, 80),
          );
        last = now;
        render(elapsed.current);
        if (elapsed.current >= INTRO_DURATION) {
          leave();
          return;
        }
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, paused, reduced, leaving, seekVersion]);

  return (
    <section
      ref={root}
      tabIndex={-1}
      className={`intro-film${leaving ? " film-leaving" : ""}${reduced ? " film-reduced" : ""}`}
      aria-label="Welcome to AccessLens"
      aria-hidden={!active || undefined}
      inert={!active || leaving}
    >
      <div className="film-wash" aria-hidden="true" />
      <header className="film-toolbar">
        <span>
          accesslens
          <span className="film-brand-dot" />
        </span>
        <div>
          {!reduced && (
            <button
              className="film-control"
              aria-label={paused ? "Play introduction" : "Pause introduction"}
              onClick={() => setPaused(!paused)}
            >
              {paused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          )}
          <button className="film-skip" onClick={leave}>
            Go to home <ArrowRight size={15} />
          </button>
        </div>
      </header>
      <div className="film-captions" aria-live="off">
        {captions.map(([eyebrow, title, subtitle], index) => (
          <div
            key={title}
            className={
              index === caption ? "film-caption current" : "film-caption"
            }
            aria-hidden={index !== caption}
          >
            <span>{eyebrow}</span>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
        ))}
      </div>
      <svg
        ref={svg}
        className="film-stage"
        viewBox="60 105 780 510"
        fill="none"
        aria-hidden="true"
      >
        <g data-scene="world" opacity="0">
          <Street />
        </g>
        <g data-scene="focus" opacity="0">
          <path
            d="M-40-32V-45H-25M40-32V-45H25M-40 22V35H-25M40 22V35H25"
            stroke="#9274ae"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <ellipse
            cy="-3"
            rx="53"
            ry="52"
            stroke="#b79aca"
            opacity=".25"
            strokeWidth="1.5"
          />
        </g>
        <g data-scene="actor" transform="translate(450 390) scale(1.3)">
          <Character animated />
        </g>
        <g data-scene="card" opacity="0">
          <ReportCard />
        </g>
        <rect
          data-scene="flash"
          x="60"
          y="105"
          width="780"
          height="510"
          fill="#fffaf0"
          opacity="0"
          pointerEvents="none"
        />
      </svg>
      <p className="sr-only">
        A small camera-carrying character walks through a neighborhood, notices
        a cone blocking a ramp, and photographs it. The photo becomes an access
        report. The introduction ends on your home dashboard.
      </p>
      <footer className="film-footer">
        {reduced ? (
          <button className="button-primary" onClick={leave}>
            Open my dashboard <ArrowRight size={17} />
          </button>
        ) : (
          <>
            <div className="film-scrubber">
              <span className="film-progress" aria-hidden="true">
                <span />
              </span>
              <input
                ref={scrubber}
                type="range"
                aria-label="Introduction progress"
                min={0}
                max={INTRO_DURATION}
                step={100}
                defaultValue={0}
                onChange={(event) => {
                  elapsed.current = Number(event.currentTarget.value);
                  setPaused(true);
                  setSeekVersion((value) => value + 1);
                }}
              />
            </div>
            <span>A new perspective on your everyday.</span>
          </>
        )}
      </footer>
    </section>
  );
}
