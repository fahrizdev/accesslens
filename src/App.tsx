import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCheck,
  ChevronRight,
  Copy,
  Crosshair,
  Download,
  ExternalLink,
  FileText,
  Home,
  ImagePlus,
  MapPin,
  ScanLine,
  Send,
  Settings2,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import {
  buildSummary,
  categories,
  deleteReport,
  downloadPhoto,
  downloadReport,
  loadReports,
  photoFile,
  saveReport,
  type Area,
  type BarrierReport,
} from "./data";

type View =
  | "onboard"
  | "home"
  | "photo"
  | "details"
  | "review"
  | "reports"
  | "settings";
function readPreference<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
const readArea = () => {
  const area = readPreference<Area | null>("accesslens-area", null);
  return area && typeof area.label === "string" && area.label !== "Area not set"
    ? area
    : null;
};
const displayDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

function Ambient() {
  return (
    <div className="ambient" aria-hidden="true">
      <div className="light-cloud blue-cloud" />
      <div className="light-cloud warm-cloud" />
      <div className="surface-grain" />
    </div>
  );
}
function ScanDemo() {
  return (
    <div className="scan-demo" aria-hidden="true">
      <div className="demo-scene">
        <svg viewBox="0 0 320 220" fill="none">
          <path d="M0 162L320 126V220H0Z" fill="#e1e3e9" />
          <path d="M0 123L320 102V126L0 162Z" fill="#f0f1f5" />
          <path d="M151 76L235 69V127L151 141Z" fill="#c3c9d3" />
          <path d="M151 76L173 58L258 52L235 69Z" fill="#dde1e7" />
          <path d="M235 69L258 52V111L235 127Z" fill="#aeb8c5" />
          <path
            d="M159 72L244 59"
            stroke="#f8f9fb"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M145 145L193 165L284 151"
            stroke="#a6b7d5"
            strokeWidth="3"
            strokeDasharray="5 6"
          />
          <path
            d="M50 101V160M45 105L101 100V157"
            stroke="#c9cdd5"
            strokeWidth="5"
          />
          <path d="M0 187L320 151" stroke="#cbd0da" strokeWidth="2" />
        </svg>
        <span className="scan-corner tl" />
        <span className="scan-corner tr" />
        <span className="scan-corner bl" />
        <span className="scan-corner br" />
        <div className="scan-sweep" />
      </div>
      <div className="demo-caption">
        <span className="demo-caption-icon">
          <Camera size={18} />
        </span>
        <div>
          <b>Make the barrier visible.</b>
          <small>One photo is all it takes to start.</small>
        </div>
        <span className="sample-label">Example</span>
      </div>
    </div>
  );
}
function Representative({
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
            ? "YOUR U.S. HOUSE REPRESENTATIVE"
            : "YOUR REPRESENTATIVE"}
        </span>
        <h3>{area?.representative || "Let’s find your person."}</h3>
        <p>
          {area?.district ||
            (area?.label
              ? `Area: ${area.label}`
              : "Matched to the area you choose.")}
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
function Modal({
  children,
  title,
  onClose,
}: {
  children: ReactNode;
  title: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      className="sheet"
      ref={ref}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="sheet-inner">
        <div className="sheet-heading">
          <h2>{title}</h2>
          <button className="icon-button" aria-label="Close" onClick={onClose}>
            <X size={19} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
function AreaPicker({
  initial,
  onChoose,
}: {
  initial?: Area | null;
  onChoose: (area: Area) => void;
}) {
  const [address, setAddress] = useState("");
  const [town, setTown] = useState(initial?.label || "");
  const [result, setResult] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(0);
  useEffect(
    () => () => {
      requestId.current++;
    },
    [],
  );
  async function lookup(
    input: { address?: string; lat?: number; lng?: number },
    version: number,
  ) {
    try {
      const response = await fetch("/api/area", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(25000),
      });
      const data = await response.json();
      if (!response.ok || !data.area)
        throw new Error(data.error || "Could not find this area.");
      if (version === requestId.current) setResult(data.area);
    } catch (e) {
      if (version === requestId.current)
        setError(
          e instanceof Error && e.name !== "TimeoutError"
            ? e.message
            : "The lookup took too long. Try an address or enter your town.",
        );
    } finally {
      if (version === requestId.current) setBusy(false);
    }
  }
  function gps() {
    if (!navigator.geolocation) {
      setError("Location is unavailable. Enter a public address below.");
      return;
    }
    const version = ++requestId.current;
    setBusy(true);
    setError("");
    setResult(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (version === requestId.current)
          void lookup({ lat: coords.latitude, lng: coords.longitude }, version);
      },
      () => {
        if (version === requestId.current) {
          setBusy(false);
          setError(
            "Location access was unavailable. You can enter an address instead.",
          );
        }
      },
      { timeout: 12000, maximumAge: 30000, enableHighAccuracy: true },
    );
  }
  function findAddress(event: FormEvent) {
    event.preventDefault();
    const version = ++requestId.current;
    setError("");
    setResult(null);
    setBusy(true);
    void lookup({ address }, version);
  }
  return (
    <div className="area-picker">
      <button className="button-primary full" onClick={gps} disabled={busy}>
        <Crosshair size={17} />
        {busy ? "Finding your area…" : "Use my location"}
      </button>
      <p className="permission-note">
        <ShieldCheck size={12} /> A single location check. No background
        tracking.
      </p>
      <div className="or-divider">
        <span>or enter a public address</span>
      </div>
      <form onSubmit={findAddress}>
        <label className="field-label">
          Street address, city, and state
          <input
            autoComplete="off"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="A nearby library, school, or intersection"
            required
            maxLength={200}
          />
        </label>
        <button className="button-secondary full" disabled={busy}>
          Find my representative <ArrowRight size={16} />
        </button>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {result && (
        <div className="area-result">
          <div className="area-result-label">
            <MapPin size={15} />
            <b>{result.label}</b>
          </div>
          <Representative area={result} compact />
          <button
            className="button-primary full"
            onClick={() => onChoose(result)}
          >
            Use this area <Check size={16} />
          </button>
          <small>
            Matched using U.S. Census boundaries and the House Clerk directory.
          </small>
        </div>
      )}
      <details className="manual-entry">
        <summary>Enter my town without a lookup</summary>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (town.trim()) onChoose({ label: town.trim() });
          }}
        >
          <label className="field-label">
            Town and state
            <input
              value={town}
              onChange={(event) => setTown(event.target.value)}
              required
              placeholder="Seattle, WA"
              maxLength={100}
            />
          </label>
          <button className="button-secondary full">
            Save area <ArrowRight size={16} />
          </button>
          <p className="fine-print">You can choose a representative later.</p>
        </form>
      </details>
      <p className="fine-print lookup-disclosure">
        The address or coordinates you choose are sent to the U.S. Census
        geocoder to find your district.
      </p>
    </div>
  );
}

export default function App() {
  const [area, setArea] = useState<Area | null>(readArea);
  const [view, setView] = useState<View>(() =>
    readPreference("accesslens-onboarding-v2", false) ? "home" : "onboard",
  );
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [reports, setReports] = useState<BarrierReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [image, setImage] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [note, setNote] = useState("");
  const [place, setPlace] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [reportArea, setReportArea] = useState<Area | null>(area);
  const [draftId, setDraftId] = useState("");
  const [current, setCurrent] = useState<BarrierReport | null>(null);
  const [summary, setSummary] = useState("");
  const [processing, setProcessing] = useState(false);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState("");
  const [storageWarning, setStorageWarning] = useState("");
  const [toast, setToast] = useState("");
  const [areaModal, setAreaModal] = useState<"profile" | "report" | null>(null);
  const [privacyModal, setPrivacyModal] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const sendPanel = useRef<HTMLDivElement>(null);
  const imageVersion = useRef(0);
  const gpsVersion = useRef(0);
  useEffect(() => {
    loadReports()
      .then(setReports)
      .catch((e) => setStorageWarning(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
    setError("");
    if (view !== "details") {
      gpsVersion.current++;
      setLocating(false);
    }
  }, [view, step]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  function rememberArea(next: Area) {
    setArea(next);
    try {
      localStorage.setItem("accesslens-area", JSON.stringify(next));
    } catch {
      setToast("Area saved for this visit.");
    }
  }
  function finishOnboarding(openCamera = false) {
    try {
      localStorage.setItem("accesslens-onboarding-v2", "true");
    } catch {
      /* Onboarding may repeat in restricted browsing. */
    }
    if (openCamera) newReport();
    else setView("home");
  }
  function moveStep(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }
  function newReport() {
    imageVersion.current++;
    gpsVersion.current++;
    setImage("");
    setCategory("");
    setCustomCategory("");
    setNote("");
    setPlace("");
    setCoordinates("");
    setReportArea(area);
    setCurrent(null);
    setSummary("");
    setDraftId(crypto.randomUUID());
    setProcessing(false);
    setView("photo");
  }
  function navigate(next: View) {
    if (
      ["photo", "details"].includes(view) &&
      (image || note || place) &&
      !window.confirm(
        "Leave this unfinished report? Your saved reports will stay on this device.",
      )
    )
      return;
    setView(next);
  }
  async function preparePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image or take a new photo.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("Choose a photo smaller than 20 MB.");
      return;
    }
    const version = ++imageVersion.current;
    setProcessing(true);
    setError("");
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Photo could not be prepared.");
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      if (version === imageVersion.current) {
        setImage(canvas.toDataURL("image/jpeg", 0.78));
        setView("details");
      }
    } catch {
      if (version === imageVersion.current)
        setError(
          "Could not open this image. Try a JPG, PNG, or a new camera photo.",
        );
    } finally {
      if (version === imageVersion.current) setProcessing(false);
    }
  }
  function addLocation() {
    if (!navigator.geolocation) {
      setError("Location is unavailable. Enter the place below.");
      return;
    }
    const version = ++gpsVersion.current;
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        if (version !== gpsVersion.current) return;
        const pin = `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
        setCoordinates(pin);
        setPlace((previous) => previous.trim() || pin);
        setReportArea(null);
        try {
          const response = await fetch("/api/area", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: coords.latitude,
              lng: coords.longitude,
            }),
            signal: AbortSignal.timeout(22000),
          });
          const data = await response.json();
          if (version === gpsVersion.current) {
            if (response.ok && data.area) setReportArea(data.area);
            else
              setToast(
                "GPS pin added. Choose a representative for this report below.",
              );
          }
        } catch {
          if (version === gpsVersion.current)
            setToast(
              "GPS pin added. Representative lookup is unavailable; check the recipient below.",
            );
        } finally {
          if (version === gpsVersion.current) setLocating(false);
        }
      },
      () => {
        if (version === gpsVersion.current) {
          setLocating(false);
          setError(
            "Could not get your location. Enter a public place or intersection instead.",
          );
        }
      },
      { timeout: 12000, maximumAge: 30000, enableHighAccuracy: true },
    );
  }
  async function persist(report: BarrierReport) {
    try {
      await saveReport(report);
      setReports((items) => [
        report,
        ...items.filter((item) => item.id !== report.id),
      ]);
      setStorageWarning("");
      return true;
    } catch (e) {
      setStorageWarning(
        e instanceof Error
          ? e.message
          : "Could not save on this device. You can still share.",
      );
      return false;
    }
  }
  async function generate(event: FormEvent) {
    event.preventDefault();
    if (!image || !category || !place.trim()) {
      setError("Add a photo, barrier type, and location.");
      return;
    }
    if (locating) {
      setError("Wait for the location check to finish.");
      return;
    }
    const label =
      category === "Other" && customCategory.trim()
        ? customCategory.trim()
        : category;
    const report: BarrierReport = {
      id: draftId || crypto.randomUUID(),
      category: label,
      note: note.trim(),
      place: place.trim(),
      coordinates: coordinates || undefined,
      image,
      created: current?.created || new Date().toISOString(),
      recipient: reportArea || undefined,
      summary: buildSummary(
        label,
        place.trim(),
        note,
        coordinates,
        reportArea?.representative,
      ),
      status: "Draft",
    };
    setSaving(true);
    setCurrent(report);
    setSummary(report.summary);
    await persist(report);
    setSaving(false);
    setView("review");
  }
  function openReport(report: BarrierReport) {
    setCurrent(report);
    setSummary(report.summary);
    setDraftId(report.id);
    setImage(report.image);
    setCategory(
      categories.includes(report.category) ? report.category : "Other",
    );
    setCustomCategory(
      categories.includes(report.category) ? "" : report.category,
    );
    setNote(report.note);
    setPlace(report.place);
    setCoordinates(report.coordinates || "");
    setReportArea(report.recipient || null);
    setView("review");
  }
  function reviewedReport(): BarrierReport | null {
    return current
      ? { ...current, summary, recipient: reportArea || undefined }
      : null;
  }
  async function share() {
    const report = reviewedReport();
    if (!report) return;
    const file = photoFile(report);
    let attachmentsSupported = false;
    try {
      attachmentsSupported = Boolean(
        file &&
          typeof navigator.share === "function" &&
          navigator.canShare?.({ files: [file] }),
      );
    } catch {
      /* Some browsers expose sharing without file support. */
    }
    if (!file || !attachmentsSupported) {
      setError(
        "This browser cannot share photo attachments directly. Copy the message and save the photo below, then attach it on the official contact page.",
      );
      sendPanel.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setSharing(true);
    setError("");
    try {
      await navigator.share({
        files: [file],
        title: `AccessLens: ${report.category}`,
        text: summary,
      });
      const updated = { ...report, status: "Shared" as const };
      setCurrent(updated);
      await persist(updated);
      setToast("Shared to your chosen app. Complete sending there.");
    } catch (e) {
      if (!(e instanceof Error && e.name === "AbortError"))
        setError(
          "Sharing could not open. Try copying the message and saving the photo instead.",
        );
    } finally {
      setSharing(false);
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(summary);
      setToast("Report copied. Attach the saved photo when you send it.");
      const report = reviewedReport();
      if (report) {
        setCurrent(report);
        await persist(report);
      }
    } catch {
      setError("Select the report text and copy it manually.");
    }
  }
  async function removeCurrent() {
    if (
      !current ||
      !window.confirm(
        "Delete this report and photo from this device? Download a copy first if you want to keep it.",
      )
    )
      return;
    try {
      await deleteReport(current.id);
      setReports((items) => items.filter((item) => item.id !== current.id));
      setCurrent(null);
      setView("reports");
      setToast("Report deleted from this device.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete report.");
    }
  }
  const isFlow = ["photo", "details", "review"].includes(view);
  const recipient = reportArea?.representative;
  const contactUrl =
    reportArea?.contactUrl ||
    "https://www.house.gov/representatives/find-your-representative";
  return (
    <div className={`app-shell view-${view}`}>
      <Ambient />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <button
          className="brand"
          aria-label="AccessLens home"
          onClick={() => (view === "onboard" ? moveStep(0) : navigate("home"))}
        >
          <span className="brand-symbol">
            <ScanLine size={23} strokeWidth={2.1} />
          </span>
          <span>AccessLens</span>
        </button>
        {view === "onboard" ? (
          <button className="header-skip" onClick={() => finishOnboarding()}>
            Set up later <ArrowRight size={14} />
          </button>
        ) : (
          <nav className="header-nav" aria-label="Main navigation">
            <button
              className={view === "reports" ? "selected" : ""}
              onClick={() => navigate("reports")}
            >
              <FileText size={17} />
              <span>My reports</span>
            </button>
            <button
              className="settings-button"
              aria-label="Settings"
              onClick={() => navigate("settings")}
            >
              <Settings2 size={19} />
            </button>
          </nav>
        )}
      </header>
      <main
        id="main"
        className={`main-content ${isFlow ? "flow-content" : ""}`}
      >
        {view === "onboard" && (
          <section className="onboarding">
            <div
              className="onboarding-progress"
              aria-label="Onboarding progress"
            >
              {["Capture", "Your area", "Representative", "Ready"].map(
                (label, index) => (
                  <button
                    key={label}
                    aria-label={`Step ${index + 1}: ${label}`}
                    aria-current={step === index ? "step" : undefined}
                    disabled={index > step}
                    onClick={() => moveStep(index)}
                  >
                    <span className={index <= step ? "filled" : ""} />
                    <small>{label}</small>
                  </button>
                ),
              )}
            </div>
            <div
              className={`onboarding-slide direction-${direction}`}
              key={step}
            >
              {step === 0 && (
                <>
                  <div className="onboard-copy">
                    <span className="eyebrow">
                      A LITTLE AWARENESS. A REAL DIFFERENCE.
                    </span>
                    <h1 ref={heading} tabIndex={-1}>
                      Every place.
                      <br />
                      <span>For everyone.</span>
                    </h1>
                    <p>
                      See something that makes a place hard to access? Snap a
                      photo. We’ll help you turn it into a short report for your
                      representative.
                    </p>
                  </div>
                  <ScanDemo />
                  <div className="onboard-feature-row">
                    <span>
                      <Camera size={16} /> One photo
                    </span>
                    <span>
                      <MapPin size={16} /> A place
                    </span>
                    <span>
                      <Send size={16} /> Your voice
                    </span>
                  </div>
                </>
              )}
              {step === 1 && (
                <>
                  <div className="onboard-copy">
                    <span className="eyebrow">02 / YOUR AREA</span>
                    <h1 ref={heading} tabIndex={-1}>
                      Start with
                      <br />
                      <span>where you are.</span>
                    </h1>
                    <p>
                      Your area helps us find the right representative. You
                      choose what location to share.
                    </p>
                  </div>
                  <div className="onboard-card">
                    {area && (
                      <div className="current-area">
                        <MapPin size={16} />
                        <div>
                          <small>YOUR SAVED AREA</small>
                          <b>{area.label}</b>
                        </div>
                        <Check size={16} />
                      </div>
                    )}
                    <AreaPicker
                      initial={area}
                      onChoose={(next) => {
                        rememberArea(next);
                        moveStep(2);
                      }}
                    />
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <div className="onboard-copy">
                    <span className="eyebrow">03 / YOUR REPRESENTATIVE</span>
                    <h1 ref={heading} tabIndex={-1}>
                      A direct line.
                      <br />
                      <span>A place to start.</span>
                    </h1>
                    <p>
                      Your photo and report can help an office understand the
                      issue—and point you toward the people responsible.
                    </p>
                  </div>
                  <div className="onboard-card rep-onboard">
                    <Representative area={area} />
                    {area?.representative ? (
                      <>
                        <div className="rep-detail">
                          <MapPin size={15} />
                          {area.label}
                        </div>
                        <div className="rep-detail">
                          <ShieldCheck size={15} /> Matched using official
                          government data
                        </div>
                        <p className="fine-print">
                          Confirm this office serves your area. Local repairs
                          may need a city department or property owner; your
                          representative can help with a referral.
                        </p>
                        <button
                          className="text-button"
                          onClick={() => moveStep(1)}
                        >
                          Change area <ArrowRight size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="muted">
                          {area
                            ? "We have your area, but no representative is selected yet."
                            : "Choose an area to find your representative."}
                        </p>
                        <button
                          className="button-secondary full"
                          onClick={() => moveStep(1)}
                        >
                          Find my representative <Crosshair size={16} />
                        </button>
                        <p className="fine-print">
                          You can also add this when you make your first report.
                        </p>
                      </>
                    )}
                  </div>
                </>
              )}
              {step === 3 && (
                <>
                  <div className="onboard-copy">
                    <span className="eyebrow">04 / YOU’RE READY</span>
                    <h1 ref={heading} tabIndex={-1}>
                      Your perspective.
                      <br />
                      <span>Ready to be heard.</span>
                    </h1>
                    <p>
                      Take a photo, confirm the place, and review your brief
                      report. Then share the photo and report through your phone
                      or use an official contact page.
                    </p>
                  </div>
                  <div className="onboard-card ready-card">
                    <span className="ready-check">
                      <CheckCheck size={28} />
                    </span>
                    <div className="ready-report">
                      <span className="micro-label">EXAMPLE REPORT</span>
                      <b>Obstructed pathway</b>
                      <p>
                        At the library entrance, bins are blocking the path.
                        Could your office review this or direct me to the team
                        responsible?
                      </p>
                      <span>
                        <ImagePlus size={13} /> Photo attached <span>·</span>{" "}
                        Location included
                      </span>
                    </div>
                  </div>
                  <p className="onboard-assurance">
                    <ShieldCheck size={14} /> Review first. Share when you’re
                    ready. Nothing sends automatically.
                  </p>
                </>
              )}
            </div>
            <div className="onboarding-controls">
              <button
                className="back-control"
                onClick={() => moveStep(step - 1)}
                disabled={step === 0}
              >
                <ArrowLeft size={17} />
                <span>Back</span>
              </button>
              <span className="step-counter">
                {step + 1} <span>/ 4</span>
              </span>
              <button
                className="button-primary"
                onClick={() =>
                  step === 3 ? finishOnboarding(true) : moveStep(step + 1)
                }
              >
                {step === 0
                  ? "Get started"
                  : step === 2 && area?.representative
                    ? "Confirm representative"
                    : step === 3
                      ? "Take my first photo"
                      : "Continue"}
                <ArrowRight size={17} />
              </button>
            </div>
          </section>
        )}

        {view === "home" && (
          <section className="home-view">
            <div className="home-intro">
              <button
                className="location-pill"
                onClick={() => setAreaModal("profile")}
              >
                <MapPin size={13} />
                {area?.label || "Set your area"}
                <ChevronRight size={12} />
              </button>
              <h1 ref={heading} tabIndex={-1}>
                See a barrier.
                <br />
                <span>Make it visible.</span>
              </h1>
              <p>
                One photo. A short report.
                <br className="mobile-break" /> A voice for better access.
              </p>
            </div>
            <div className="home-capture">
              <div className="camera-orbit" aria-hidden="true">
                <span className="orbit-ring one" />
                <span className="orbit-ring two" />
                <span className="camera-disc">
                  <Camera size={43} strokeWidth={1.2} />
                </span>
                <span className="floating-tag photo-tag">
                  <Check size={12} /> Photo
                </span>
                <span className="floating-tag location-tag">
                  <MapPin size={12} /> Place
                </span>
                <span className="floating-tag report-tag">
                  <FileText size={12} /> Report
                </span>
              </div>
              <button
                className="button-primary capture-cta"
                onClick={newReport}
              >
                <Camera size={19} /> Take a photo <ArrowRight size={18} />
              </button>
              <p className="fine-print">
                Or choose a photo you’ve already taken.
              </p>
            </div>
            <div className="home-bottom">
              <div className="how-it-works">
                <span className="micro-label">FROM PHOTO TO ACTION</span>
                <div>
                  <span>
                    <i>1</i>Capture
                  </span>
                  <ChevronRight size={13} />
                  <span>
                    <i>2</i>Review
                  </span>
                  <ChevronRight size={13} />
                  <span>
                    <i>3</i>Share
                  </span>
                </div>
              </div>
              <button
                className="recent-link"
                onClick={() => setView("reports")}
              >
                <span className="recent-icon">
                  <FileText size={20} />
                </span>
                <span>
                  <b>My reports</b>
                  <small>
                    {loading
                      ? "Opening your reports…"
                      : reports.length
                        ? `${reports.length} saved on this device`
                        : "Your saved reports will appear here"}
                  </small>
                </span>
                <ArrowRight size={17} />
              </button>
            </div>
          </section>
        )}

        {isFlow && (
          <div className="flow-top">
            <button
              className="back-button"
              onClick={() =>
                view === "photo"
                  ? navigate("home")
                  : setView(view === "details" ? "photo" : "details")
              }
            >
              <ArrowLeft size={16} />
              {view === "photo" ? "Home" : "Back"}
            </button>
            <ol className="flow-steps" aria-label="Report progress">
              {["Photo", "Details", "Share"].map((label, index) => (
                <li
                  key={label}
                  className={
                    index <= (view === "photo" ? 0 : view === "details" ? 1 : 2)
                      ? "active"
                      : ""
                  }
                  aria-current={
                    index ===
                    (view === "photo" ? 0 : view === "details" ? 1 : 2)
                      ? "step"
                      : undefined
                  }
                >
                  <span>{index + 1}</span>
                  {label}
                </li>
              ))}
            </ol>
          </div>
        )}
        {view === "photo" && (
          <section className="photo-view">
            <div className="page-intro">
              <span className="eyebrow">01 / CAPTURE</span>
              <h1 ref={heading} tabIndex={-1}>
                What’s in the way?
              </h1>
              <p>Frame the barrier and a little of the space around it.</p>
            </div>
            <div className={`photo-stage ${image ? "has-photo" : ""}`}>
              {image ? (
                <img src={image} alt="Your selected barrier photo" />
              ) : (
                <>
                  <ScanLine size={53} strokeWidth={0.9} />
                  <span>Your next step starts here.</span>
                </>
              )}
              <i className="scan-corner tl" />
              <i className="scan-corner tr" />
              <i className="scan-corner bl" />
              <i className="scan-corner br" />
              {processing && (
                <div className="processing-overlay">
                  <span className="spinner" />
                  Preparing your photo…
                </div>
              )}
            </div>
            <div className="photo-buttons">
              <label className="button-primary camera-input">
                <Camera size={18} /> Take a photo
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  aria-label="Take a photo"
                  onChange={(event) => void preparePhoto(event)}
                  disabled={processing}
                />
              </label>
              <label className="button-secondary camera-input">
                <ImagePlus size={18} /> Photo library
                <input
                  type="file"
                  accept="image/*"
                  aria-label="Choose a photo from your library"
                  onChange={(event) => void preparePhoto(event)}
                  disabled={processing}
                />
              </label>
            </div>
            {image && (
              <button
                className="text-button centered"
                onClick={() => setView("details")}
              >
                Use this photo <ArrowRight size={15} />
              </button>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <p className="privacy-caption">
              <ShieldCheck size={13} /> Avoid faces, license plates, and private
              addresses.
            </p>
          </section>
        )}

        {view === "details" && (
          <section className="details-view">
            <div className="page-intro">
              <span className="eyebrow">02 / A LITTLE CONTEXT</span>
              <h1 ref={heading} tabIndex={-1}>
                Keep it simple.
              </h1>
              <p>
                Confirm the place and what you noticed. We’ll draft the report.
              </p>
            </div>
            <form
              onSubmit={(event) => void generate(event)}
              className="details-layout"
            >
              <div className="details-photo-panel">
                <img src={image} alt="The barrier you’re reporting" />
                <button
                  type="button"
                  className="photo-edit"
                  onClick={() => setView("photo")}
                >
                  <Camera size={14} /> Change photo
                </button>
                <div className="photo-private">
                  <ShieldCheck size={12} /> Your photo stays on this device
                  until you share.
                </div>
              </div>
              <div className="details-fields">
                <fieldset className="category-field">
                  <legend>What’s the barrier?</legend>
                  <div className="category-options">
                    {categories.map((item) => (
                      <button
                        key={item}
                        type="button"
                        aria-pressed={category === item}
                        className={category === item ? "chosen" : ""}
                        onClick={() => setCategory(item)}
                      >
                        {item === "Other" ? "Something else" : item}
                        {category === item && <Check size={13} />}
                      </button>
                    ))}
                  </div>
                </fieldset>
                {category === "Other" && (
                  <label className="field-label">
                    Give it a short name{" "}
                    <span className="optional">optional</span>
                    <input
                      placeholder="What kind of barrier did you notice?"
                      value={customCategory}
                      onChange={(event) =>
                        setCustomCategory(event.target.value)
                      }
                      maxLength={90}
                    />
                  </label>
                )}
                <div className="field-heading">
                  <label htmlFor="report-place">Where is it?</label>
                  <button
                    type="button"
                    className="text-button"
                    onClick={addLocation}
                    disabled={locating}
                  >
                    <Crosshair size={13} />
                    {locating ? "Finding location…" : "Use GPS"}
                  </button>
                </div>
                <input
                  id="report-place"
                  className="standalone-input"
                  placeholder="Building, entrance, or intersection"
                  value={place}
                  onChange={(event) => setPlace(event.target.value)}
                  required
                  maxLength={200}
                />
                {coordinates && (
                  <p className="gps-caption">
                    <MapPin size={11} /> {coordinates}{" "}
                    <button type="button" onClick={() => setCoordinates("")}>
                      Remove pin
                    </button>
                  </p>
                )}
                <label className="field-label">
                  Anything to add? <span className="optional">optional</span>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="For example: bins are blocking the ramp beside the entrance."
                    rows={3}
                    maxLength={800}
                  />
                </label>
                <div className="recipient-inline">
                  <Representative area={reportArea} compact />
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setAreaModal("report")}
                  >
                    {reportArea?.representative ? "Change" : "Find"}
                    <ChevronRight size={13} />
                  </button>
                </div>
                <p className="fine-print">
                  {coordinates
                    ? reportArea?.representative
                      ? "Recipient matched to this GPS location. Verify before sharing."
                      : "GPS pin added. Choose a representative for this location before sharing."
                    : "Recipient uses your saved area. Change it if this report is somewhere else."}
                </p>
                {error && (
                  <p className="error" role="alert">
                    {error}
                  </p>
                )}
                <button
                  className="button-primary full"
                  disabled={saving || locating || !category}
                >
                  <FileText size={16} />
                  {saving ? "Preparing report…" : "Generate brief report"}
                  <ArrowRight size={16} />
                </button>
                <p className="draft-note">
                  Drafted from your selected barrier, place, and note. Review
                  before sharing.
                </p>
              </div>
            </form>
          </section>
        )}

        {view === "review" && current && (
          <section className="review-view">
            <div className="page-intro">
              <span className="eyebrow">03 / READY TO SHARE</span>
              <h1 ref={heading} tabIndex={-1}>
                A photo. A place.
                <br />
                <span>A point made.</span>
              </h1>
              <p>Review your report, then choose how to send it.</p>
            </div>
            <div className="review-layout">
              <div className="report-paper">
                <div className="report-paper-header">
                  <span>
                    <ScanLine size={17} /> AccessLens report
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
                    Your brief report <span className="optional">editable</span>
                  </label>
                  <textarea
                    id="report-summary"
                    className="summary-editor"
                    value={summary}
                    onChange={(event) => setSummary(event.target.value)}
                    onBlur={() => {
                      const report = reviewedReport();
                      if (report && report.summary !== current.summary) {
                        setCurrent(report);
                        void persist(report);
                      }
                    }}
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
                <button
                  className="text-button"
                  onClick={() => setAreaModal("report")}
                >
                  {recipient
                    ? "Change representative"
                    : "Find my representative"}
                  <ArrowRight size={14} />
                </button>
                <div className="send-divider" />
                <button
                  className="button-primary full share-button"
                  onClick={() => void share()}
                  disabled={sharing || !summary.trim()}
                >
                  <Share2 size={18} />
                  {sharing ? "Opening share sheet…" : "Share photo + report"}
                </button>
                <p className="share-explainer">
                  Choose Mail or another app on your phone. Your photo and
                  report go together. Complete sending in that app.
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
                    ? "The House Clerk page links to your representative’s official website and contact options."
                    : "Use the official House lookup to find your office. No representative has been matched yet."}
                </p>
                <details className="share-alternatives">
                  <summary>Copy, save, or attach manually</summary>
                  <div>
                    <button
                      className="button-secondary"
                      onClick={() => void copy()}
                    >
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
                      <FileText size={14} /> Download photo + report document
                    </button>
                    <p className="fine-print">
                      For contact forms, copy the text and attach the saved
                      photo if the form allows attachments.
                    </p>
                  </div>
                </details>
                <div className="send-note">
                  <ShieldCheck size={16} />
                  <p>
                    You stay in control. Sharing opens another app; it doesn’t
                    confirm receipt by an office.
                  </p>
                </div>
                {error && (
                  <p className="error" role="alert">
                    {error}
                  </p>
                )}
                <button
                  className="text-button new-report-link"
                  onClick={newReport}
                >
                  <Camera size={14} /> Report another barrier
                </button>
                <button
                  className="text-button delete-link"
                  onClick={() => void removeCurrent()}
                >
                  <Trash2 size={13} /> Delete report
                </button>
              </div>
            </div>
          </section>
        )}

        {view === "reports" && (
          <section className="reports-view">
            <div className="page-intro">
              <span className="eyebrow">SAVED ON THIS DEVICE</span>
              <h1 ref={heading} tabIndex={-1}>
                Your reports.
              </h1>
              <p>One barrier per report. Ready when you need them.</p>
            </div>
            <button className="button-primary reports-new" onClick={newReport}>
              <Camera size={17} /> New report
            </button>
            {loading ? (
              <div className="empty-state">
                <span className="spinner" />
                Opening your reports…
              </div>
            ) : reports.length === 0 ? (
              <div className="empty-state">
                <span className="empty-symbol">
                  <FileText size={31} strokeWidth={1.1} />
                </span>
                <h2>A place for what you notice.</h2>
                <p>Take your first photo to create a brief report.</p>
                <button className="button-primary" onClick={newReport}>
                  Take a photo <Camera size={16} />
                </button>
              </div>
            ) : (
              <div className="report-list">
                {reports.map((report) => (
                  <button
                    className="report-list-item"
                    key={report.id}
                    onClick={() => openReport(report)}
                  >
                    {report.image ? (
                      <img src={report.image} alt="" />
                    ) : (
                      <span className="no-photo">
                        <FileText size={25} />
                      </span>
                    )}
                    <span>
                      <small>
                        {displayDate(report.created)}
                        <i />{" "}
                        {report.status === "Shared"
                          ? "Shared to an app"
                          : "Draft"}
                      </small>
                      <b>{report.category}</b>
                      <span>{report.place}</span>
                    </span>
                    <ChevronRight size={18} />
                  </button>
                ))}
              </div>
            )}
            <p className="privacy-caption">
              <ShieldCheck size={13} /> Stored locally. Download important
              reports before clearing browser data.
            </p>
          </section>
        )}

        {view === "settings" && (
          <section className="settings-view">
            <div className="page-intro">
              <span className="eyebrow">MAKE IT YOURS</span>
              <h1 ref={heading} tabIndex={-1}>
                A few essentials.
              </h1>
              <p>Your area, your representative, your privacy.</p>
            </div>
            <div className="settings-group">
              <button onClick={() => setAreaModal("profile")}>
                <span className="settings-icon">
                  <MapPin size={21} />
                </span>
                <span>
                  <b>Your area</b>
                  <small>{area?.label || "Choose your area"}</small>
                </span>
                <ChevronRight size={18} />
              </button>
              <div className="settings-representative">
                <Representative area={area} compact />
              </div>
            </div>
            <div className="settings-group">
              <button
                onClick={() => {
                  setStep(0);
                  setView("onboard");
                }}
              >
                <span className="settings-icon">
                  <Sparkles size={21} />
                </span>
                <span>
                  <b>Take the tour again</b>
                  <small>Four steps from photo to report</small>
                </span>
                <ChevronRight size={18} />
              </button>
              <button onClick={() => setPrivacyModal(true)}>
                <span className="settings-icon">
                  <ShieldCheck size={21} />
                </span>
                <span>
                  <b>Privacy & how it works</b>
                  <small>Know what stays on your device</small>
                </span>
                <ChevronRight size={18} />
              </button>
            </div>
            <p className="version-note">
              AccessLens · Built to help make access visible.
            </p>
          </section>
        )}
        {storageWarning && view !== "onboard" && (
          <p className="storage-warning" role="status">
            {storageWarning}
          </p>
        )}
      </main>
      {view === "review" && current && (
        <div className="mobile-share-dock">
          <button
            className="dock-recipient"
            onClick={() => setAreaModal("report")}
          >
            <span>SHARE WITH</span>
            <b>{recipient || "Choose representative"}</b>
          </button>
          <button
            className="button-primary"
            onClick={() => void share()}
            disabled={sharing || !summary.trim()}
          >
            <Share2 size={17} />
            {sharing ? "Opening…" : "Share report"}
          </button>
        </div>
      )}
      {view !== "onboard" && !isFlow && (
        <nav className="mobile-nav" aria-label="App navigation">
          <button
            aria-current={view === "home" ? "page" : undefined}
            onClick={() => setView("home")}
          >
            <Home size={20} />
            <span>Home</span>
          </button>
          <button className="nav-camera" onClick={newReport}>
            <span>
              <Camera size={21} />
            </span>
            <b>New report</b>
          </button>
          <button
            aria-current={view === "reports" ? "page" : undefined}
            onClick={() => setView("reports")}
          >
            <FileText size={20} />
            <span>Reports</span>
          </button>
        </nav>
      )}
      <footer className="app-footer">
        <span>AccessLens</span>
        <button onClick={() => setPrivacyModal(true)}>
          <ShieldCheck size={12} /> Private by default
        </button>
      </footer>
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
      {areaModal && (
        <Modal
          title={
            areaModal === "report" ? "Choose this report’s area" : "Your area"
          }
          onClose={() => setAreaModal(null)}
        >
          <p className="modal-description">
            Find the representative for the area you choose.
          </p>
          <AreaPicker
            initial={areaModal === "report" ? reportArea : area}
            onChoose={(next) => {
              if (areaModal === "report") {
                setReportArea(next);
                if (current) {
                  const updated = { ...current, summary, recipient: next };
                  if (
                    summary === current.summary &&
                    !current.summary.startsWith(
                      `Hello Representative ${next.representative},`,
                    )
                  ) {
                    const text = buildSummary(
                      current.category,
                      current.place,
                      current.note,
                      current.coordinates,
                      next.representative,
                    );
                    setSummary(text);
                    updated.summary = text;
                  }
                  setCurrent(updated);
                  void persist(updated);
                }
              } else rememberArea(next);
              setAreaModal(null);
              setToast("Area updated.");
            }}
          />
        </Modal>
      )}
      {privacyModal && (
        <Modal
          title="Privacy, in plain language."
          onClose={() => setPrivacyModal(false)}
        >
          <div className="privacy-copy">
            <h3>Your photos stay with you.</h3>
            <p>
              Reports and photos are saved in this browser on this device. They
              don’t sync between devices. Download important reports before
              clearing browser data.
            </p>
            <h3>You choose what to share.</h3>
            <p>
              Sharing passes the photo, place, GPS pin if added, and your edited
              message to the app you choose. An official contact page opens
              separately. AccessLens never sends a report to an office
              automatically.
            </p>
            <h3>Location has one job.</h3>
            <p>
              With your permission, a single GPS fix or public address is sent
              through our server to the U.S. Census geocoder to find your
              district. Member details come from the House Clerk. Our
              application doesn’t store lookup requests; hosting providers may
              retain normal request metadata. There is no background tracking.
            </p>
            <h3>Brief reports, reviewed by you.</h3>
            <p>
              Reports are generated from the barrier category and details you
              provide. Photos aren’t analyzed by AI in this free version.
              Observations are not legal or accessibility compliance
              assessments. Congressional offices can help with advocacy or
              referrals; local repairs may need a city department or property
              owner.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
