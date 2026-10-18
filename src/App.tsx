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
  retargetSummary,
  saveReport,
  type Area,
  type BarrierReport,
} from "./data";
import {
  normalizeProfile,
  PROFILE_KEY,
  validEmail,
  type SenderProfile,
} from "./profile";

import { LensMark, Splash } from "./Brand";
import HomeDashboard from "./Home";
import Intro from "./Intro";

type View = "home" | "photo" | "details" | "review" | "reports" | "settings";
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
  const [method, setMethod] = useState<"choice" | "address" | "town">("choice");
  const requestId = useRef(0);
  function chooseMethod(next: "choice" | "address" | "town") {
    requestId.current++;
    setBusy(false);
    setError("");
    setResult(null);
    setMethod(next);
  }
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
    if (!address.trim()) {
      setError("Enter a public address, city, and state.");
      return;
    }
    const version = ++requestId.current;
    setError("");
    setResult(null);
    setBusy(true);
    void lookup({ address: address.trim() }, version);
  }
  return (
    <div className="area-picker area-picker-calm">
      {!result && (
        <>
          {method === "choice" ? (
            <div className="area-methods">
              <button
                className="area-method area-location"
                onClick={gps}
                disabled={busy}
              >
                <span className="area-method-icon">
                  {busy ? (
                    <span className="spinner" />
                  ) : (
                    <Crosshair size={22} strokeWidth={1.6} />
                  )}
                </span>
                <span>
                  <b>{busy ? "Finding your area…" : "Use my location"}</b>
                  <small>A one-time check. No tracking.</small>
                </span>
                <ChevronRight size={17} />
              </button>
              <button
                className="area-method"
                onClick={() => chooseMethod("address")}
              >
                <span className="area-method-icon">
                  <MapPin size={22} strokeWidth={1.6} />
                </span>
                <span>
                  <b>Enter an address</b>
                  <small>A nearby public place works, too.</small>
                </span>
                <ChevronRight size={17} />
              </button>
              <button
                className="text-button area-town-link"
                onClick={() => chooseMethod("town")}
              >
                Just save my town for now
              </button>
            </div>
          ) : (
            <div className="area-entry-panel" key={method}>
              <button
                className="text-button area-back"
                onClick={() => chooseMethod("choice")}
              >
                <ArrowLeft size={15} /> Other options
              </button>
              {method === "address" ? (
                <form onSubmit={findAddress}>
                  <label className="field-label">
                    Public address
                    <input
                      autoComplete="off"
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      placeholder="Street address, city, and state"
                      required
                      maxLength={200}
                    />
                  </label>
                  <p className="area-field-hint">
                    Try a library, school, or another nearby public place.
                  </p>
                  <button className="button-primary full" disabled={busy}>
                    {busy ? "Finding your area…" : "Find my representative"}
                    <ArrowRight size={16} />
                  </button>
                </form>
              ) : (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (town.trim()) onChoose({ label: town.trim() });
                    else setError("Enter your town and state.");
                  }}
                >
                  <label className="field-label">
                    Town and state
                    <input
                      autoComplete="off"
                      value={town}
                      onChange={(event) => setTown(event.target.value)}
                      required
                      placeholder="Seattle, WA"
                      maxLength={100}
                    />
                  </label>
                  <p className="area-field-hint">
                    You can find your representative later.
                  </p>
                  <button className="button-primary full">
                    Save area <ArrowRight size={16} />
                  </button>
                </form>
              )}
            </div>
          )}
          {method !== "town" && (
            <p className="area-disclosure">
              <ShieldCheck size={14} />
              <span>
                Your chosen address or location goes to the U.S. Census to find
                your district.
              </span>
            </p>
          )}
        </>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {result && (
        <div className="area-result" aria-live="polite">
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
          <button
            className="text-button"
            onClick={() => chooseMethod("choice")}
          >
            Try another location
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [launchStarted, setLaunchStarted] = useState(false);
  const [showIntro, setShowIntro] = useState(
    () => !readPreference("accesslens-intro-v1", false),
  );
  const [profile, setProfile] = useState<SenderProfile>(() =>
    normalizeProfile(readPreference(PROFILE_KEY, null)),
  );
  const [contactDraft, setContactDraft] = useState<SenderProfile>(profile);
  const [profileModal, setProfileModal] = useState(false);
  const [confirmation, setConfirmation] = useState<"report" | "contact" | null>(
    null,
  );
  const [area, setArea] = useState<Area | null>(readArea);
  const [view, setView] = useState<View>("home");
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
  }, [view, showSplash, showIntro]);
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
  function finishIntro() {
    try {
      localStorage.setItem("accesslens-intro-v1", "true");
    } catch {
      /* The intro can repeat if browser storage is unavailable. */
    }
    setShowIntro(false);
  }
  function rememberProfile(value: SenderProfile) {
    const next = normalizeProfile(value);
    setProfile(next);
    setContactDraft(next);
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    } catch {
      setToast("Contact details saved for this visit only.");
    }
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
      sender: { ...profile },
      summary: buildSummary(
        label,
        place.trim(),
        note,
        coordinates,
        reportArea?.representative,
        profile,
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
    if (!current) return;
    setConfirmation(null);
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
    <>
      {showSplash && (
        <Splash
          onReveal={() => setLaunchStarted(true)}
          onContinue={() => setShowSplash(false)}
        />
      )}
      {launchStarted && showIntro && (
        <Intro active={!showSplash} onFinish={finishIntro} />
      )}
      {(launchStarted || !showSplash) && (
        <div
          className={`app-shell view-${view}${showIntro ? " behind-intro" : ""}`}
          inert={showSplash || showIntro}
          aria-hidden={showSplash || showIntro || undefined}
        >
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <header className="topbar">
            <button
              className="brand"
              aria-label="AccessLens home"
              onClick={() => navigate("home")}
            >
              <LensMark />
              <span>accesslens</span>
            </button>
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
          </header>
          <main
            id="main"
            className={`main-content ${isFlow ? "flow-content" : ""}`}
          >
            {view === "home" && (
              <HomeDashboard
                name={profile.name}
                area={area}
                reports={reports}
                loading={loading}
                headingRef={heading}
                onReport={newReport}
                onProfile={() => {
                  setContactDraft(profile);
                  setProfileModal(true);
                }}
                onArea={() => setAreaModal("profile")}
                onReports={() => setView("reports")}
                onOpenReport={openReport}
              />
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
                        index <=
                        (view === "photo" ? 0 : view === "details" ? 1 : 2)
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
                  <ShieldCheck size={13} /> Avoid faces, license plates, and
                  private addresses.
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
                    Confirm the place and what you noticed. We’ll draft the
                    report.
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
                        <button
                          type="button"
                          onClick={() => setCoordinates("")}
                        >
                          Remove pin
                        </button>
                      </p>
                    )}
                    <label className="field-label">
                      Anything to add?{" "}
                      <span className="optional">optional</span>
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
                      Drafted from your selected barrier, place, and note.
                      Review before sharing.
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
                      <span className="report-category">
                        {current.category}
                      </span>
                      <p className="report-place">
                        <MapPin size={14} />
                        {current.place}
                      </p>
                      <label
                        className="field-label report-text-label"
                        htmlFor="report-summary"
                      >
                        Your brief report{" "}
                        <span className="optional">editable</span>
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
                      {sharing ? "Opening share sheet…" : "Send report"}
                    </button>
                    <p className="share-explainer">
                      Opens sharing with your photo, report, and signature.
                      Choose Mail and address it using the official contact
                      options below. Your saved email doesn’t sign you into
                      Mail.
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
                          <FileText size={14} /> Download photo + report
                          document
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
                        You stay in control. Sharing opens another app; it
                        doesn’t confirm receipt by an office.
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
                      onClick={() => setConfirmation("report")}
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
                    Your observations.
                  </h1>
                  <p>One barrier per report. Ready when you need them.</p>
                </div>
                <button
                  className="button-primary reports-new"
                  onClick={newReport}
                >
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
                    Your corner.
                  </h1>
                  <p>Your details, your neighborhood, your voice.</p>
                </div>
                <div className="settings-group">
                  <button
                    onClick={() => {
                      setError("");
                      setContactDraft(profile);
                      setProfileModal(true);
                    }}
                  >
                    <span className="settings-icon">
                      <UserRound size={21} />
                    </span>
                    <span>
                      <b>{profile.name || "Your name & email"}</b>
                      <small>
                        {profile.email || "Set up your report signature"}
                      </small>
                    </span>
                    <ChevronRight size={18} />
                  </button>
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
                      setView("home");
                      setShowIntro(true);
                      setLaunchStarted(false);
                      setShowSplash(true);
                    }}
                  >
                    <span className="settings-icon">
                      <Sparkles size={21} />
                    </span>
                    <span>
                      <b>Replay the introduction</b>
                      <small>A little perspective, in motion</small>
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
            {storageWarning && (
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
                <Send size={17} />
                {sharing ? "Opening…" : "Send report"}
              </button>
            </div>
          )}
          {!isFlow && (
            <nav className="mobile-nav" aria-label="App navigation">
              <button
                aria-current={view === "home" ? "page" : undefined}
                onClick={() => setView("home")}
              >
                <Home size={20} />
                <span>Home</span>
              </button>
              <button
                aria-current={view === "reports" ? "page" : undefined}
                onClick={() => setView("reports")}
              >
                <FileText size={20} />
                <span>Reports</span>
              </button>
              <button
                aria-current={view === "settings" ? "page" : undefined}
                onClick={() => setView("settings")}
              >
                <Settings2 size={20} />
                <span>Settings</span>
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
                areaModal === "report"
                  ? "Choose this report’s area"
                  : "Your area"
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
                      const text = retargetSummary(
                        summary,
                        current.recipient?.representative,
                        next.representative,
                      );
                      setSummary(text);
                      updated.summary = text;
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
          {profileModal && (
            <Modal
              title="Your report signature"
              onClose={() => {
                setContactDraft(profile);
                setProfileModal(false);
                setError("");
              }}
            >
              <form
                className="profile-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (
                    !contactDraft.name.trim() ||
                    !validEmail(contactDraft.email.trim())
                  ) {
                    setError(
                      "Add a name and an email address like you@example.com.",
                    );
                    return;
                  }
                  rememberProfile(contactDraft);
                  setProfileModal(false);
                  setError("");
                  setToast("Signature saved for new reports.");
                }}
              >
                <p className="modal-description">
                  Added to new reports automatically. Saved reports keep their
                  original signature; you can edit their message directly.
                </p>
                <label htmlFor="profile-name">Your name</label>
                <input
                  id="profile-name"
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={80}
                  value={contactDraft.name}
                  onChange={(event) =>
                    setContactDraft({
                      ...contactDraft,
                      name: event.target.value,
                    })
                  }
                />
                <label htmlFor="profile-email">Your email</label>
                <input
                  id="profile-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  maxLength={254}
                  value={contactDraft.email}
                  onChange={(event) =>
                    setContactDraft({
                      ...contactDraft,
                      email: event.target.value,
                    })
                  }
                />
                <p className="contact-hint">
                  This email is included as contact info. Sending uses an
                  account in your chosen mail app.
                </p>
                {error && (
                  <p className="error" role="alert">
                    {error}
                  </p>
                )}
                <button className="button-primary full" type="submit">
                  Save details <Check size={17} />
                </button>
                {(profile.name || profile.email) && (
                  <button
                    className="text-button remove-contact"
                    type="button"
                    onClick={() => {
                      setProfileModal(false);
                      setConfirmation("contact");
                    }}
                  >
                    Remove saved contact details
                  </button>
                )}
              </form>
            </Modal>
          )}
          {confirmation && (
            <Modal
              title={
                confirmation === "report"
                  ? "Delete this report?"
                  : "Remove saved contact details?"
              }
              onClose={() => setConfirmation(null)}
            >
              <p className="modal-description">
                {confirmation === "report"
                  ? "This removes this report and its photo from this device. Download a copy first if you want to keep it. This can’t be undone."
                  : "Your saved name and email will be removed from this device. Existing reports keep their signatures; edit or delete those separately."}
              </p>
              <div className="confirmation-actions">
                <button
                  className="button-secondary"
                  onClick={() => setConfirmation(null)}
                >
                  Keep it
                </button>
                <button
                  className="button-primary danger-button"
                  onClick={() => {
                    if (confirmation === "report") void removeCurrent();
                    else {
                      rememberProfile({ name: "", email: "" });
                      setConfirmation(null);
                      setToast(
                        "Saved contact details removed. Existing reports unchanged.",
                      );
                    }
                  }}
                >
                  {confirmation === "report"
                    ? "Delete report & photo"
                    : "Remove details"}
                </button>
              </div>
            </Modal>
          )}
          {privacyModal && (
            <Modal
              title="Privacy, in plain language."
              onClose={() => setPrivacyModal(false)}
            >
              <div className="privacy-copy">
                <h3>Your signature, ready when you are.</h3>
                <p>
                  Your name and email are saved in this browser and copied into
                  new report messages. They aren’t an account login, aren’t
                  verified, and aren’t added to a mailing list. You can change
                  or remove them in Settings. Old reports keep the details
                  already in their text. Sending uses an account signed into
                  your chosen app, not permission granted by entering an address
                  here.
                </p>
                <h3>Your photos stay with you.</h3>
                <p>
                  Reports and photos are saved in this browser on this device.
                  They don’t sync between devices. Download important reports
                  before clearing browser data.
                </p>
                <h3>You choose what to share.</h3>
                <p>
                  Sharing passes the photo, place, GPS pin if added, and your
                  edited message to the app you choose. An official contact page
                  opens separately. AccessLens never sends a report to an office
                  automatically.
                </p>
                <h3>Location has one job.</h3>
                <p>
                  With your permission, a single GPS fix or public address is
                  sent through our server to the U.S. Census geocoder to find
                  your district. Member details come from the House Clerk. Our
                  application doesn’t store lookup requests; hosting providers
                  may retain normal request metadata. There is no background
                  tracking.
                </p>
                <h3>Brief reports, reviewed by you.</h3>
                <p>
                  Reports are generated from the barrier category and details
                  you provide. Photos aren’t analyzed by AI in this free
                  version. Observations are not legal or accessibility
                  compliance assessments. Congressional offices can help with
                  advocacy or referrals; local repairs may need a city
                  department or property owner.
                </p>
              </div>
            </Modal>
          )}
        </div>
      )}
    </>
  );
}
