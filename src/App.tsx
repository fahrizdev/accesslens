import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  Accessibility,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Camera,
  Check,
  ChevronRight,
  Copy,
  Crosshair,
  Download,
  ExternalLink,
  Footprints,
  Heart,
  MapPin,
  MessageCircle,
  Plus,
  Route,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  categories,
  downloadPacket,
  draftMessage,
  loadRoutes,
  removeRoute,
  sampleRoute,
  storeRoute,
  type Area,
  type Observation,
  type RouteNote,
} from "./data";

type View =
  | "welcome"
  | "area"
  | "home"
  | "create"
  | "capture"
  | "story"
  | "action"
  | "about";
const date = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
const templates: Record<string, string> = {
  "Blocked curb ramp":
    "At this curb ramp, I noticed ____. This leaves ____ space to reach the crossing.",
  "Stairs-only entrance":
    "This approach has ____ steps. From this point, I could not see ____.",
  "Obstructed pathway":
    "The path is obstructed by ____. A person using this route would need to ____.",
  "Uneven surface": "The surface has ____. It is located ____ along the path.",
  "Heavy or difficult door":
    "When I tried this door, ____. I noticed ____ about the handle or opening mechanism.",
  "Missing signage":
    "At this point on the route, I could not find a sign indicating ____.",
  Other:
    "I noticed ____ at ____. It affected my ability to use the route because ____.",
};
function readArea(): Area | null {
  try {
    const a = JSON.parse(localStorage.getItem("accesslens-area") || "null");
    return a && typeof a.label === "string" ? a : null;
  } catch {
    return null;
  }
}
function Neighborhood({ small = false }: { small?: boolean }) {
  return (
    <div className={`neighborhood ${small ? "small" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 520 400" fill="none">
        <ellipse cx="261" cy="213" rx="222" ry="170" fill="#e4eadc" />
        <path d="M34 293L221 183L488 295L287 401Z" fill="#d7dfcd" />
        <path d="M65 320L219 231L454 331" stroke="#fffaf0" strokeWidth="45" />
        <path
          d="M237 182L237 234L169 272L287 329L286 397"
          stroke="#fffaf0"
          strokeWidth="33"
        />
        <path
          d="M65 320L219 231L454 331"
          stroke="#c5cbb7"
          strokeWidth="2"
          strokeDasharray="7 8"
        />
        <path d="M283 165L369 122L445 157L360 201Z" fill="#d77b61" />
        <path d="M283 165L360 201V287L283 250Z" fill="#e8b092" />
        <path d="M360 201L445 157V244L360 287Z" fill="#f5d3ad" />
        <path d="M275 163L365 112L452 153L360 204Z" fill="#e69474" />
        <path d="M304 204L322 212V243L304 234Z" fill="#658d85" />
        <path d="M333 219L349 227V256L333 249Z" fill="#658d85" />
        <path d="M377 217L396 207V236L377 246Z" fill="#658d85" />
        <path d="M411 200L429 191V220L411 229Z" fill="#658d85" />
        <path d="M113 171L175 135L225 160L163 196Z" fill="#d3b0da" />
        <path d="M113 171L163 196V255L113 230Z" fill="#b1a2cb" />
        <path d="M163 196L225 160V219L163 255Z" fill="#d9c9e8" />
        <path d="M130 195L144 202V224L130 217Z" fill="#fff6df" />
        <path d="M181 204L201 192V227L181 238Z" fill="#7d7295" />
        <path
          d="M89 266V211M458 278V227M250 150V105"
          stroke="#937c54"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <circle cx="88" cy="202" r="27" fill="#91ad81" />
        <circle cx="458" cy="217" r="28" fill="#a1bb8d" />
        <circle cx="250" cy="99" r="24" fill="#b6c890" />
        <path d="M233 305L247 313L264 303L250 294Z" fill="#e5ae56" />
        <path d="M233 305V320L247 328V313Z" fill="#d09443" />
        <path d="M247 313L264 303V317L247 328Z" fill="#f4cc78" />
        <path
          d="M168 280L222 252L281 279L318 260"
          stroke="#368378"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="2 11"
        />
        <circle
          cx="168"
          cy="280"
          r="9"
          fill="#fcf8ed"
          stroke="#368378"
          strokeWidth="4"
        />
        <circle cx="318" cy="260" r="9" fill="#368378" />
        <path
          d="M323 100C323 80 339 65 358 65C378 65 394 80 394 100C394 124 358 151 358 151C358 151 323 124 323 100Z"
          fill="#23766c"
        />
        <circle cx="358" cy="100" r="14" fill="#fff8e9" />
        <path
          d="M99 113L102 104L105 113L114 116L105 119L102 128L99 119L90 116Z"
          fill="#e7b45a"
        />
        <path
          d="M420 92L422 85L425 92L432 95L425 97L422 105L420 97L413 95Z"
          fill="#d4acdb"
        />
      </svg>
      <span className="scene-label label-one">
        <Camera size={15} /> Notice a barrier
      </span>
      <span className="scene-label label-two">
        <Heart size={14} /> Make a little difference
      </span>
    </div>
  );
}
export default function App() {
  const [area, setArea] = useState<Area | null>(readArea);
  const [view, setView] = useState<View>(() =>
    readArea() ? "home" : "welcome",
  );
  const [routes, setRoutes] = useState<RouteNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<RouteNote | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);
  const [areaInput, setAreaInput] = useState("");
  const [lookup, setLookup] = useState(false);
  const [foundArea, setFoundArea] = useState<Area | null>(null);
  const [manualArea, setManualArea] = useState("");
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [destination, setDestination] = useState("");
  const [image, setImage] = useState<string>();
  const [processing, setProcessing] = useState(false);
  const [category, setCategory] = useState(categories[0]);
  const [description, setDescription] = useState("");
  const [place, setPlace] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [locating, setLocating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [recipient, setRecipient] = useState("local accessibility team");
  const [message, setMessage] = useState("");
  const [includeCoordinates, setIncludeCoordinates] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const imageVersion = useRef(0);
  useEffect(() => {
    loadRoutes()
      .then(setRoutes)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
    setError("");
  }, [view]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);
  const go = (next: View) => setView(next);
  async function persist(route: RouteNote, next?: View) {
    setSaving(true);
    setError("");
    try {
      await storeRoute(route);
      setRoutes((items) => [
        route,
        ...items.filter((item) => item.id !== route.id),
      ]);
      setActive(route);
      if (next) go(next);
      return true;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not save. Please try again.",
      );
      return false;
    } finally {
      setSaving(false);
    }
  }
  function newRoute() {
    setTitle("");
    setStart("");
    setDestination("");
    go("create");
  }
  async function createRoute(event: FormEvent) {
    event.preventDefault();
    if (!destination.trim()) return;
    const route: RouteNote = {
      id: crypto.randomUUID(),
      title: title.trim() || `Route to ${destination.trim()}`,
      start: start.trim(),
      destination: destination.trim(),
      area: area?.label || "",
      observations: [],
      status: "Documented",
      created: new Date().toISOString(),
    };
    if (await persist(route)) {
      resetPhoto();
      go("capture");
    }
  }
  function resetPhoto(item?: Observation) {
    imageVersion.current++;
    setImage(item?.image);
    setCategory(item?.category || categories[0]);
    setDescription(item?.description || "");
    setPlace(item?.place || "");
    setCoordinates(item?.coordinates || "");
    setEditingId(item?.id || null);
    setProcessing(false);
    setError("");
  }
  async function prepareImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError(
        "Choose a JPG, PNG, or WebP photo. On iPhone, try taking a new photo.",
      );
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
      if (!context) throw new Error();
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      if (version === imageVersion.current)
        setImage(canvas.toDataURL("image/jpeg", 0.76));
    } catch {
      if (version === imageVersion.current)
        setError("This photo could not be opened. Try another JPG or PNG.");
    } finally {
      if (version === imageVersion.current) setProcessing(false);
    }
  }
  async function saveObservation(event: FormEvent) {
    event.preventDefault();
    if (!active || processing) return;
    if (!image) {
      setError("Add a photo of what you noticed.");
      return;
    }
    if (!place.trim() || !description.trim()) {
      setError("Add a place and description.");
      return;
    }
    if (description.includes("____")) {
      setError("Fill in the blanks in your description before saving.");
      return;
    }
    const observation: Observation = {
      id: editingId || crypto.randomUUID(),
      category,
      place: place.trim(),
      description: description.trim(),
      image,
      coordinates,
      created:
        active.observations.find((item) => item.id === editingId)?.created ||
        new Date().toISOString(),
    };
    const items = editingId
      ? active.observations.map((item) =>
          item.id === editingId ? observation : item,
        )
      : [...active.observations, observation];
    if (
      await persist(
        { ...active, observations: items, message: undefined },
        "story",
      )
    ) {
      resetPhoto();
      setToast("Observation saved. A little more visible.");
    }
  }
  async function areaLookup(payload: {
    address?: string;
    lat?: number;
    lng?: number;
  }) {
    setLookup(true);
    setError("");
    setFoundArea(null);
    try {
      const response = await fetch("/api/area", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(25000),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Location lookup is unavailable.");
      setFoundArea(data.area);
    } catch (e) {
      setError(
        e instanceof Error && e.name !== "TimeoutError"
          ? e.message
          : "Location lookup took too long. You can enter your town below.",
      );
    } finally {
      setLookup(false);
    }
  }
  function locate(forArea: boolean) {
    if (!navigator.geolocation) {
      setError("GPS is unavailable. Enter the place by hand.");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        if (forArea)
          void areaLookup({ lat: coords.latitude, lng: coords.longitude });
        else
          setCoordinates(
            `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,
          );
      },
      () => {
        setLocating(false);
        setError(
          "Could not get your location. Allow location access in your browser, or enter the place by hand.",
        );
      },
      { timeout: 12000, maximumAge: 30000, enableHighAccuracy: true },
    );
  }
  function saveArea(next: Area) {
    setArea(next);
    try {
      localStorage.setItem("accesslens-area", JSON.stringify(next));
    } catch {
      setToast(
        "Area set for this visit. Browser preferences could not be saved.",
      );
    }
    go("home");
  }
  function openRoute(route: RouteNote) {
    setActive(route);
    go("story");
  }
  function prepareAction() {
    if (!active) return;
    setRecipient("local accessibility team");
    setMessage(
      active.message || draftMessage(active, "local accessibility team"),
    );
    setIncludeCoordinates(false);
    go("action");
  }
  function chooseRecipient(value: string) {
    if (
      active &&
      message !== (active.message || draftMessage(active, recipient)) &&
      !window.confirm(
        "Replace your edited message with a draft for this contact?",
      )
    )
      return;
    setRecipient(value);
    if (active) setMessage(draftMessage(active, value));
  }
  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setToast("Message copied. You choose when to send it.");
    } catch {
      setError("Could not copy. Select and copy the text in the message box.");
    }
  }
  async function deleteActive() {
    if (!active) return;
    setSaving(true);
    try {
      await removeRoute(active.id);
      setRoutes((items) => items.filter((item) => item.id !== active.id));
      setActive(null);
      setDeleteOpen(false);
      go("home");
      setToast("Route deleted from this device.");
    } catch {
      setError("Could not delete this route. Please try again.");
    } finally {
      setSaving(false);
    }
  }
  const count = routes.reduce(
    (sum, route) => sum + route.observations.length,
    0,
  );
  const compact = ["capture", "story", "action", "create"].includes(view);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <button
          className="brand"
          onClick={() => go(area ? "home" : "welcome")}
          aria-label="AccessLens home"
        >
          <span className="brand-mark">
            <Accessibility size={24} />
          </span>
          accesslens<span className="brand-dot">.</span>
        </button>
        <nav aria-label="Main navigation">
          <button
            aria-label="My stories"
            className={view === "home" ? "active" : ""}
            onClick={() => go("home")}
          >
            <BookOpen size={16} />
            <span>My stories</span>
          </button>
          <button
            aria-label="The idea"
            className={view === "about" ? "active" : ""}
            onClick={() => go("about")}
          >
            <Heart size={16} />
            <span>The idea</span>
          </button>
        </nav>
        <button
          className="area-chip"
          onClick={() => {
            setFoundArea(null);
            setManualArea(area?.label || "");
            go("area");
          }}
        >
          <MapPin size={15} />
          <span>{area?.label || "Set your area"}</span>
          <Settings2 size={13} />
        </button>
      </header>
      <main id="main" className={`main-content ${compact ? "compact" : ""}`}>
        {view === "welcome" && (
          <section className="welcome-view">
            <div className="hero">
              <div className="hero-copy">
                <span className="eyebrow">
                  <span className="tiny-flower">✳</span> SMALL STEPS. MORE OPEN
                  DOORS.
                </span>
                <h1 ref={heading} tabIndex={-1}>
                  A little lens.
                  <br />A more <em>open</em>
                  <br />
                  world.
                </h1>
                <p>
                  That blocked ramp. That broken path.
                  <br />
                  Turn the barriers you notice into stories
                  <br className="desktop-break" /> that can help your community
                  change.
                </p>
                <button
                  className="button-primary large"
                  onClick={() => go("area")}
                >
                  Let’s make a little difference <ArrowRight size={19} />
                </button>
                <button
                  className="text-button"
                  onClick={() => openRoute(sampleRoute())}
                >
                  Take a peek at an example <ArrowRight size={15} />
                </button>
                <div className="hero-reassurance">
                  <ShieldCheck size={15} /> Free to use. Your pace. Your voice.
                </div>
              </div>
              <Neighborhood />
            </div>
            <div className="how-strip">
              <span className="how-caption">
                GOOD CHANGE
                <br />
                <b>starts small.</b>
              </span>
              <div>
                <span className="step-icon peach">
                  <Camera size={23} />
                </span>
                <span>
                  <b>Notice it</b>
                  <small>Capture a barrier on your route.</small>
                </span>
              </div>
              <ArrowRight className="step-arrow" size={18} />
              <div>
                <span className="step-icon lilac">
                  <Route size={23} />
                </span>
                <span>
                  <b>Tell the story</b>
                  <small>A few details make it clear.</small>
                </span>
              </div>
              <ArrowRight className="step-arrow" size={18} />
              <div>
                <span className="step-icon sage">
                  <MessageCircle size={23} />
                </span>
                <span>
                  <b>Start a conversation</b>
                  <small>Help the right people see it.</small>
                </span>
              </div>
            </div>
            <p className="bottom-note">
              Made for everyday advocates. And the places we all share.{" "}
              <Heart size={13} />
            </p>
          </section>
        )}
        {view === "area" && (
          <section className="setup-view">
            <button
              className="back-button"
              onClick={() => go(area ? "home" : "welcome")}
            >
              <ArrowLeft size={17} /> Back
            </button>
            <div className="page-intro center">
              <span className="eyebrow">
                FIRST, YOUR LITTLE CORNER OF THE WORLD
              </span>
              <h1 ref={heading} tabIndex={-1}>
                Where are we helping?
              </h1>
              <p>
                Find your area and the representative who serves it.
                <br />
                You can change this any time.
              </p>
            </div>
            <div className="setup-card">
              <span className="large-icon sage">
                <MapPin size={30} />
              </span>
              <h2>Start with your location</h2>
              <p className="muted">
                One location check—no background tracking. Your coordinates are
                sent to the U.S. Census geocoder to find your district.
              </p>
              <button
                className="button-primary full"
                disabled={locating || lookup}
                onClick={() => locate(true)}
              >
                <Crosshair size={18} />
                {locating
                  ? "Finding your location…"
                  : lookup
                    ? "Finding your area…"
                    : "Use my current location"}
              </button>
              <div className="or-divider">
                <span>or use a public address</span>
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void areaLookup({ address: areaInput });
                }}
              >
                <label className="input-label">
                  Nearby public building or street address
                  <input
                    value={areaInput}
                    onChange={(event) => setAreaInput(event.target.value)}
                    placeholder="123 Main St, Seattle, WA"
                    required
                    maxLength={200}
                  />
                </label>
                <button
                  className="button-secondary full"
                  disabled={lookup || locating}
                >
                  {lookup ? "Looking it up…" : "Find this area"}
                  <ArrowRight size={16} />
                </button>
              </form>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              {foundArea && (
                <div className="area-result">
                  <span className="pill">
                    <Check size={13} /> Area found
                  </span>
                  <h3>{foundArea.label}</h3>
                  {foundArea.district && <p>{foundArea.district}</p>}
                  {foundArea.representative && (
                    <p>
                      <b>{foundArea.representative}</b>
                      <br />
                      Your U.S. House representative
                    </p>
                  )}
                  <button
                    className="button-primary full"
                    onClick={() => saveArea(foundArea)}
                  >
                    Looks right. Let’s go <ArrowRight size={17} />
                  </button>
                  <small>
                    District: U.S. Census. Member details: House Clerk. Verify
                    the match before contacting an office.
                  </small>
                </div>
              )}
              <details className="manual-area">
                <summary>Prefer to enter a town and continue?</summary>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (manualArea.trim())
                      saveArea({ label: manualArea.trim() });
                  }}
                >
                  <label className="input-label">
                    Town / city and state
                    <input
                      value={manualArea}
                      onChange={(event) => setManualArea(event.target.value)}
                      placeholder="Seattle, WA"
                      required
                      maxLength={100}
                    />
                  </label>
                  <p className="small muted">
                    Document routes now and look up your representative later.
                  </p>
                  <button className="button-secondary full">
                    Continue with this area <ArrowRight size={16} />
                  </button>
                </form>
              </details>
            </div>
            <button
              className="text-button centered"
              onClick={() => saveArea({ label: "Area not set" })}
            >
              I’ll choose later
            </button>
          </section>
        )}
        {view === "home" && (
          <section className="home-view">
            <div className="dashboard-heading">
              <div>
                <span className="eyebrow">
                  <span className="tiny-flower">✳</span> YOUR EVERYDAY ADVOCACY
                  JOURNAL
                </span>
                <h1 ref={heading} tabIndex={-1}>
                  Good change
                  <br />
                  starts <em>with you.</em>
                </h1>
                <p>A route. A few observations. A clearer way to be heard.</p>
              </div>
              <Neighborhood small />
            </div>
            <button className="start-card" onClick={newRoute}>
              <span className="start-icon">
                <Plus size={29} />
              </span>
              <span>
                <b>Start a route check</b>
                <small>
                  Where are you headed? Let’s make the way more visible.
                </small>
              </span>
              <ArrowRight size={24} />
            </button>
            <div className="stats-row">
              <div>
                <b>{routes.length}</b>
                <span>route stories</span>
              </div>
              <span className="stats-divider" />
              <div>
                <b>{count}</b>
                <span>barriers documented</span>
              </div>
              <span className="stats-divider" />
              <div>
                <ShieldCheck size={21} />
                <span>Saved on this device</span>
              </div>
            </div>
            <div className="section-heading">
              <div>
                <span className="eyebrow">ONE LITTLE STEP AT A TIME</span>
                <h2>Your access stories</h2>
              </div>
              <button
                className="text-button"
                onClick={() => openRoute(sampleRoute())}
              >
                See an example <ArrowRight size={15} />
              </button>
            </div>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            {loading ? (
              <div className="empty-state">Opening your journal…</div>
            ) : routes.length === 0 ? (
              <div className="empty-state">
                <span className="large-icon lilac">
                  <BookOpen size={29} />
                </span>
                <h3>Your first story is waiting.</h3>
                <p>
                  Start with a route you know—the way to school,
                  <br />
                  your local park, or the corner store.
                </p>
                <button className="button-secondary" onClick={newRoute}>
                  Make your first route check <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <div className="story-grid">
                {routes.map((route) => (
                  <button
                    className="story-card"
                    key={route.id}
                    onClick={() => openRoute(route)}
                  >
                    <span className="story-thumbnail">
                      {route.observations[0]?.image ? (
                        <img src={route.observations[0].image} alt="" />
                      ) : (
                        <Route size={28} />
                      )}
                    </span>
                    <span className="story-card-body">
                      <span
                        className={`pill ${route.status === "Resolved" ? "green" : ""}`}
                      >
                        {route.status}
                      </span>
                      <b>{route.title}</b>
                      <small>
                        {route.observations.length} observations ·{" "}
                        {date(route.created)}
                      </small>
                    </span>
                    <ChevronRight size={18} />
                  </button>
                ))}
              </div>
            )}
            <div className="gentle-note">
              <Heart size={19} />
              <p>
                You don’t have to fix everything. Helping someone see the
                problem is a place to start.
              </p>
            </div>
          </section>
        )}
        {view === "create" && (
          <section className="editor-view">
            <button className="back-button" onClick={() => go("home")}>
              <ArrowLeft size={17} /> My stories
            </button>
            <div className="page-intro">
              <span className="eyebrow">01 / START YOUR STORY</span>
              <h1 ref={heading} tabIndex={-1}>
                Every route has a story.
              </h1>
              <p>
                Pick a familiar journey. We’ll document what you notice along
                the way.
              </p>
            </div>
            <div className="two-column">
              <form
                className="panel"
                onSubmit={(event) => void createRoute(event)}
              >
                <span className="large-icon peach">
                  <Footprints size={27} />
                </span>
                <label className="input-label">
                  Where are you headed?
                  <input
                    placeholder="The library, school, or a neighborhood park"
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                    required
                    maxLength={120}
                  />
                </label>
                <label className="input-label">
                  Starting from <span className="optional">optional</span>
                  <input
                    placeholder="A bus stop, corner, or public entrance"
                    value={start}
                    onChange={(event) => setStart(event.target.value)}
                    maxLength={120}
                  />
                </label>
                <label className="input-label">
                  Give your story a name{" "}
                  <span className="optional">optional</span>
                  <input
                    placeholder="My afternoon library trip"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={120}
                  />
                </label>
                <p className="small muted">
                  <MapPin size={14} />{" "}
                  {area?.label || "You can set your area later"}
                </p>
                {error && (
                  <p role="alert" className="error">
                    {error}
                  </p>
                )}
                <button
                  className="button-primary full"
                  disabled={saving || loading}
                >
                  {saving
                    ? "Opening your journal…"
                    : "Let’s notice the little things"}
                  <ArrowRight size={18} />
                </button>
              </form>
              <aside className="aside-note">
                <span className="scribble-star">✳</span>
                <h3>
                  Your route.
                  <br />
                  Your perspective.
                </h3>
                <p>
                  Look at crossings, paths, doors, and entrances. What makes the
                  journey harder?
                </p>
                <p>
                  You’re creating a record of what you see. This app doesn’t
                  measure accessibility or certify a safe route.
                </p>
              </aside>
            </div>
          </section>
        )}
        {view === "capture" && active && (
          <section className="editor-view">
            <button className="back-button" onClick={() => go("story")}>
              <ArrowLeft size={17} /> {active.title}
            </button>
            <div className="page-intro">
              <span className="eyebrow">02 / NOTICE & DOCUMENT</span>
              <h1 ref={heading} tabIndex={-1}>
                {editingId ? "A little more context." : "What caught your eye?"}
              </h1>
              <p>One photo. Your words. A clearer picture of the route.</p>
            </div>
            <div className="two-column">
              <form
                className="panel capture-panel"
                onSubmit={(event) => void saveObservation(event)}
              >
                <div className="photo-box">
                  {image ? (
                    <img src={image} alt="Your observation preview" />
                  ) : (
                    <>
                      <span className="large-icon peach">
                        <Camera size={31} />
                      </span>
                      <h3>A photo tells part of the story.</h3>
                      <p>
                        Show the barrier and a little of the path around it.
                      </p>
                    </>
                  )}
                </div>
                <div className="photo-actions">
                  <label className="button-primary">
                    <Camera size={17} />
                    {processing
                      ? "Preparing…"
                      : image
                        ? "Retake photo"
                        : "Take a photo"}
                    <input
                      className="file-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      capture="environment"
                      onChange={(event) => void prepareImage(event)}
                      disabled={processing}
                    />
                  </label>
                  <label className="button-secondary">
                    Choose from library
                    <input
                      className="file-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => void prepareImage(event)}
                      disabled={processing}
                    />
                  </label>
                </div>
                <label className="input-label">
                  What kind of barrier?
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                  >
                    {categories.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="input-label">
                  Where on the route?
                  <input
                    placeholder="East entrance, crossing at Pine St…"
                    value={place}
                    onChange={(event) => setPlace(event.target.value)}
                    required
                    maxLength={200}
                  />
                </label>
                <div className="location-row">
                  <button
                    className="text-button"
                    type="button"
                    disabled={locating}
                    onClick={() => locate(false)}
                  >
                    <Crosshair size={15} />
                    {locating ? "Locating…" : "Add GPS pin"}
                  </button>
                  <span className="small muted">
                    {coordinates || "Optional · stays on this device"}
                  </span>
                </div>
                <label className="input-label">
                  Tell us what you noticed
                  <textarea
                    placeholder="What is visible? How did it affect the way through?"
                    rows={4}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    required
                    maxLength={2000}
                  />
                </label>
                <button
                  className="text-button prompt-help"
                  type="button"
                  onClick={() => {
                    if (
                      !description ||
                      window.confirm(
                        "Replace your description with a writing prompt?",
                      )
                    )
                      setDescription(templates[category] || templates.Other);
                  }}
                >
                  <Sparkles size={15} /> Give me a writing prompt{" "}
                  <span className="optional">Template, no AI required</span>
                </button>
                {error && (
                  <p className="error" role="alert">
                    {error}
                  </p>
                )}
                <div className="panel-bottom">
                  <span>
                    <ShieldCheck size={15} /> Saved privately on this device
                  </span>
                  <button
                    className="button-primary"
                    disabled={saving || processing || loading}
                  >
                    <Check size={17} />
                    {saving ? "Saving…" : "Save observation"}
                  </button>
                </div>
              </form>
              <aside className="aside-note sage-note">
                <ShieldCheck size={27} />
                <h3>
                  A thoughtful
                  <br />
                  little snapshot.
                </h3>
                <p>
                  Avoid faces, license plates, and home addresses. Only include
                  details that help explain the route.
                </p>
                <p>
                  Describe what you can see or experienced. If you can’t tell
                  whether another entrance exists, say so.
                </p>
                <p className="small">
                  Photo detection is a future addition. Your observations work
                  without paid services.
                </p>
              </aside>
            </div>
          </section>
        )}
        {view === "story" && active && (
          <section className="story-view">
            <button className="back-button" onClick={() => go("home")}>
              <ArrowLeft size={17} /> My stories
            </button>
            <div className="page-intro story-intro">
              <span className="eyebrow">
                {active.demo
                  ? "ILLUSTRATIVE EXAMPLE · NOT A REAL REPORT"
                  : "YOUR ACCESS STORY"}
              </span>
              <div className="title-row">
                <h1 ref={heading} tabIndex={-1}>
                  {active.title}
                </h1>
                {!active.demo && (
                  <button
                    className="icon-button"
                    aria-label="Delete route"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              <p>
                <MapPin size={16} />
                {active.area || area?.label || "Area not set"}
                <span>·</span>
                {date(active.created)}
                <span>·</span>
                {active.observations.length} observations
              </p>
            </div>
            <div className="route-ribbon">
              <span className="route-dot" />
              <div>
                <small>FROM</small>
                <b>{active.start || "Starting point"}</b>
              </div>
              <div className="route-dashes" />
              <MapPin size={24} />
              <div>
                <small>TO</small>
                <b>{active.destination}</b>
              </div>
            </div>
            <div className="story-content">
              <div className="timeline">
                {active.observations.length === 0 && (
                  <div className="empty-state">
                    <Camera size={32} />
                    <h3>Let’s add the first observation.</h3>
                    <p>
                      Your route is saved. Capture a barrier whenever you’re
                      ready.
                    </p>
                  </div>
                )}
                {active.observations.map((item, index) => (
                  <article className="observation" key={item.id}>
                    <span className="timeline-number">{index + 1}</span>
                    <div className="observation-content">
                      {item.image ? (
                        <img
                          className="observation-photo"
                          src={item.image}
                          alt={`${item.category} at ${item.place}`}
                        />
                      ) : (
                        <div
                          className={`example-illustration example-${index}`}
                        >
                          <Route size={45} />
                          <small>Illustrative example</small>
                        </div>
                      )}
                      <div className="observation-body">
                        <span className="pill">{item.category}</span>
                        <h2>{item.place}</h2>
                        <p>{item.description}</p>
                        {!active.demo && (
                          <button
                            className="text-button"
                            onClick={() => {
                              resetPhoto(item);
                              go("capture");
                            }}
                          >
                            Edit observation <ArrowRight size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
                {!active.demo && (
                  <button
                    className="add-observation"
                    onClick={() => {
                      resetPhoto();
                      go("capture");
                    }}
                  >
                    <Plus size={19} /> Add another observation
                  </button>
                )}
              </div>
              <aside className="story-aside panel">
                <span className="large-icon lilac">
                  <MessageCircle size={27} />
                </span>
                <h2>
                  Small notes.
                  <br />A bigger conversation.
                </h2>
                <p>
                  Your story can help an office understand what makes this route
                  difficult.
                </p>
                <button
                  className="button-primary full"
                  onClick={prepareAction}
                  disabled={active.observations.length === 0}
                >
                  Prepare an action packet <ArrowRight size={17} />
                </button>
                <p className="small muted">
                  Review it, edit it, share it when you’re ready.
                </p>
                {!active.demo && (
                  <label className="input-label status-label">
                    Your follow-up status
                    <select
                      value={active.status}
                      disabled={saving}
                      onChange={(event) =>
                        void persist({
                          ...active,
                          status: event.target.value as RouteNote["status"],
                        })
                      }
                    >
                      {[
                        "Documented",
                        "Message prepared",
                        "Contacted",
                        "Resolved",
                      ].map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                )}
                <p className="small muted">
                  {active.demo
                    ? "This example is separate from your saved stories."
                    : "Status is your own record. An office has not verified it."}
                </p>
              </aside>
            </div>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
          </section>
        )}
        {view === "action" && active && (
          <section className="action-view">
            <button className="back-button" onClick={() => go("story")}>
              <ArrowLeft size={17} /> Back to your story
            </button>
            <div className="page-intro">
              <span className="eyebrow">03 / FROM BARRIER TO ACTION</span>
              <h1 ref={heading} tabIndex={-1}>
                Your voice.
                <br />
                <em>A place to start.</em>
              </h1>
              <p>
                A clear, respectful message can open a conversation.
                <br />
                Make this one sound like you.
              </p>
            </div>
            {active.demo && (
              <p className="demo-banner">
                You’re trying an illustrative example. Use your own observations
                before contacting an office.
              </p>
            )}
            <div className="two-column action-columns">
              <div className="panel">
                <label className="input-label">
                  Who would you like to contact?
                  <select
                    value={recipient}
                    onChange={(event) => chooseRecipient(event.target.value)}
                  >
                    <option value="local accessibility team">
                      Local accessibility / public works team
                    </option>
                    <option
                      value={
                        area?.representative
                          ? `Representative ${area.representative}`
                          : "my U.S. House representative"
                      }
                    >
                      {area?.representative || "My U.S. House representative"}
                    </option>
                    <option value="school or property management team">
                      School / property management team
                    </option>
                  </select>
                </label>
                <p className="contact-context">
                  {recipient.includes("Representative") ||
                  recipient.includes("House")
                    ? "A congressional office can help with advocacy and referrals. Routine sidewalk repairs are usually handled locally."
                    : "For a path, crossing, or public entrance, start with the city, campus, or property owner responsible."}
                </p>
                <label className="input-label">
                  Your editable message
                  <textarea
                    className="message-editor"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={16}
                    maxLength={16000}
                  />
                </label>
                <p className="small muted">
                  Replace [Your name] and review every observation before
                  sharing.
                </p>
                {error && (
                  <p className="error" role="alert">
                    {error}
                  </p>
                )}
                <div className="action-buttons">
                  <button
                    className="button-primary"
                    onClick={() => void copyMessage()}
                  >
                    <Copy size={16} /> Copy message
                  </button>
                  <button
                    className="button-secondary"
                    disabled={saving || active.demo}
                    onClick={async () => {
                      if (
                        await persist({
                          ...active,
                          message,
                          status:
                            active.status === "Documented"
                              ? "Message prepared"
                              : active.status,
                        })
                      )
                        setToast("Your message draft is saved.");
                    }}
                  >
                    <Check size={16} />
                    {saving ? "Saving…" : "Save draft"}
                  </button>
                </div>
              </div>
              <aside className="packet-aside">
                <div className="packet-preview">
                  <span className="eyebrow">YOUR ACCESS STORY</span>
                  <BookOpen size={38} />
                  <h2>{active.title}</h2>
                  <p>
                    {active.observations.length} observations · Photos & context
                    <br />
                    Your message, in one file
                  </p>
                  <div className="paper-lines">
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={includeCoordinates}
                    onChange={(event) =>
                      setIncludeCoordinates(event.target.checked)
                    }
                  />{" "}
                  Include GPS pins in the downloaded packet
                </label>
                <button
                  className="button-primary full"
                  onClick={() =>
                    downloadPacket(active, message, includeCoordinates)
                  }
                >
                  <Download size={18} /> Download story & photos
                </button>
                <p className="small muted">
                  A self-contained HTML document. Open it to view, print, or
                  save as PDF. Review photos and locations before sharing.
                </p>
                <div className="contact-card">
                  <h3>Find the right person</h3>
                  {area?.representative && (
                    <p>
                      <b>{area.representative}</b>
                      <br />
                      {area.district}
                    </p>
                  )}
                  <a
                    href={
                      area?.contactUrl ||
                      "https://www.house.gov/representatives/find-your-representative"
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    Official House directory <ExternalLink size={14} />
                  </a>
                  {area?.phone && (
                    <a href={`tel:${area.phone.replace(/[^+0-9]/g, "")}`}>
                      Call House office <ExternalLink size={14} />
                    </a>
                  )}
                  <button
                    className="text-button"
                    onClick={() => {
                      setFoundArea(null);
                      go("area");
                    }}
                  >
                    Update my area <MapPin size={14} />
                  </button>
                  <p className="small muted">
                    For local repairs, search your city’s official website for
                    public works or its accessibility coordinator. Nothing is
                    sent automatically.
                  </p>
                </div>
              </aside>
            </div>
          </section>
        )}
        {view === "about" && (
          <section className="about-view">
            <span className="eyebrow">
              A MORE OPEN WORLD, ONE ROUTE AT A TIME
            </span>
            <h1 ref={heading} tabIndex={-1}>
              Everyone deserves
              <br />a way <em>through.</em>
            </h1>
            <p className="about-lede">
              A curb ramp blocked by a bin. A path interrupted by broken
              pavement. A front door that starts with stairs. Small barriers can
              change someone’s whole journey.
            </p>
            <div className="about-grid">
              <article>
                <Camera size={26} />
                <h2>Make the invisible visible.</h2>
                <p>
                  Photograph possible barriers and describe the route in your
                  own words.
                </p>
              </article>
              <article>
                <Route size={26} />
                <h2>Connect the little things.</h2>
                <p>
                  Group observations into an access story so people can
                  understand the journey.
                </p>
              </article>
              <article>
                <MessageCircle size={26} />
                <h2>Give your voice a starting point.</h2>
                <p>
                  Prepare a clear message and a report with photos. You decide
                  who sees it and when.
                </p>
              </article>
            </div>
            <div className="privacy-panel">
              <ShieldCheck size={28} />
              <div>
                <h2>Your journal stays yours.</h2>
                <p>
                  Routes and photos are stored in this browser’s local database.
                  They don’t sync across devices. Clearing browser data can
                  erase them, so download important stories. Location lookup
                  sends the address or GPS fix you choose to the U.S. Census
                  geocoder through our server. There is no background tracking.
                  No photos are sent for AI analysis in this version.
                </p>
                <p>
                  Personal observations, not accessibility certification,
                  navigation guidance, or legal findings.
                </p>
              </div>
            </div>
            <button className="button-primary large" onClick={newRoute}>
              Start with a route you know <ArrowRight size={18} />
            </button>
          </section>
        )}
      </main>
      <footer>
        <span>Small steps. More open doors.</span>
        <span>
          Made with care <Heart size={12} /> AccessLens
        </span>
      </footer>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
      {deleteOpen && (
        <div className="modal-backdrop">
          <section
            className="modal panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <h2 id="delete-title">Delete this access story?</h2>
            <p>
              This removes the route and its photos from this browser. Download
              a copy first if you want to keep it.
            </p>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <div className="action-buttons">
              <button
                autoFocus
                className="button-secondary"
                onClick={() => setDeleteOpen(false)}
              >
                Keep story
              </button>
              <button
                className="button-danger"
                disabled={saving}
                onClick={() => void deleteActive()}
              >
                {saving ? "Deleting…" : "Delete story"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
