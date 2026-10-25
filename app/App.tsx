import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  ArrowLeft,
  Camera,
  Check,
  FileText,
  Home,
  UserRound,
} from "lucide-react";
import {
  createDraft,
  categories,
  retargetSummary,
  followUpLabels,
  type FollowUpStatus,
  type Area,
  type BarrierReport,
} from "./reports";
import {
  normalizeProfile,
  PROFILE_KEY,
  validEmail,
  type SenderProfile,
} from "./profile";

import useReports from "./useReports";
import { photoFile } from "./reportFiles";
import {
  AREA_KEY,
  readArea,
  readPreference,
  writePreference,
} from "./preferences";
import { lookupArea } from "./area";
import { preparePhoto as resizePhoto } from "./photos";
import AreaPicker from "./components/AreaPicker";
import Modal from "./components/Modal";
import PhotoPicker from "./components/PhotoPicker";
import { CurbMark } from "./Brand";
import HomeDashboard from "./Home";
import ReportDetails, {
  emptyReportForm,
  type ReportFormFields,
} from "./views/ReportDetails";
import ReportReview from "./views/ReportReview";
import ReportsView from "./views/ReportsView";
import SettingsView from "./views/SettingsView";

type View = "home" | "details" | "review" | "reports" | "settings";
export default function App() {
  const [profile, setProfile] = useState<SenderProfile>(() =>
    normalizeProfile(readPreference(PROFILE_KEY)),
  );
  const [contactDraft, setContactDraft] = useState<SenderProfile>(profile);
  const [profileModal, setProfileModal] = useState(false);
  const [confirmation, setConfirmation] = useState<"report" | "contact" | null>(
    null,
  );
  const [area, setArea] = useState<Area | null>(readArea);
  const [view, setView] = useState<View>("home");
  const { reports, loading, persist, remove, hasUnsaved, storageWarning } =
    useReports();
  const [draft, setDraft] = useState<ReportFormFields>(emptyReportForm);
  const { image, category, customCategory, note, place, coordinates } = draft;
  const [reportArea, setReportArea] = useState<Area | null>(area);
  const [draftId, setDraftId] = useState("");
  const [current, setCurrent] = useState<BarrierReport | null>(null);
  const [summary, setSummary] = useState("");
  const [processing, setProcessing] = useState(false);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [areaModal, setAreaModal] = useState<"profile" | "report" | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const sendPanel = useRef<HTMLDivElement>(null);
  const imageVersion = useRef(0);
  const gpsVersion = useRef(0);
  const reportVersion = useRef(0);
  const gpsController = useRef<AbortController | null>(null);
  const unsavedChanges =
    hasUnsaved ||
    (view === "details" && !!(image || note || place)) ||
    (view === "review" && summary !== current?.summary);
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Tab")
        document.documentElement.classList.add("keyboard-navigation");
    };
    const pointer = () =>
      document.documentElement.classList.remove("keyboard-navigation");
    document.addEventListener("keydown", keyboard);
    document.addEventListener("pointerdown", pointer);
    return () => {
      document.removeEventListener("keydown", keyboard);
      document.removeEventListener("pointerdown", pointer);
      document.documentElement.classList.remove("keyboard-navigation");
    };
  }, []);
  useEffect(() => {
    if (!unsavedChanges) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [unsavedChanges]);
  useEffect(() => {
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
    setError("");
    if (view !== "details") {
      gpsVersion.current++;
      gpsController.current?.abort();
      setLocating(false);
    }
    imageVersion.current++;
    setProcessing(false);
  }, [view]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  function rememberArea(next: Area) {
    setArea(next);
    const saved = writePreference(AREA_KEY, next);
    if (!saved) {
      setToast("Area saved for this visit.");
    }
    return saved;
  }
  function rememberProfile(value: SenderProfile) {
    const next = normalizeProfile(value);
    setProfile(next);
    setContactDraft(next);
    const saved = writePreference(PROFILE_KEY, next);
    if (!saved) {
      setToast("Contact details saved for this visit only.");
    }
    return saved;
  }
  function updateDraft(patch: Partial<ReportFormFields>) {
    setDraft((previous) => ({ ...previous, ...patch }));
  }
  function removePin() {
    gpsVersion.current++;
    gpsController.current?.abort();
    setLocating(false);
    updateDraft({
      coordinates: "",
      ...(place === coordinates ? { place: "" } : {}),
    });
  }
  function takeFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    return file;
  }
  // Picking a photo starts a fresh report and opens its details.
  function newReport(event: ChangeEvent<HTMLInputElement>) {
    const file = takeFile(event);
    if (!file) return;
    saveReview();
    reportVersion.current++;
    gpsVersion.current++;
    gpsController.current?.abort();
    setLocating(false);
    setDraft(emptyReportForm);
    setReportArea(area);
    setCurrent(null);
    setSummary("");
    setDraftId(crypto.randomUUID());
    void preparePhoto(file);
  }
  function changePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = takeFile(event);
    if (file) void preparePhoto(file);
  }
  function navigate(next: View) {
    if (
      view === "details" &&
      (image || note || place) &&
      !window.confirm(
        "Leave this draft? You’ll lose these changes. Your saved reports will stay here.",
      )
    )
      return;
    saveReview();
    reportVersion.current++;
    imageVersion.current++;
    gpsVersion.current++;
    gpsController.current?.abort();
    setProcessing(false);
    setLocating(false);
    setView(next);
  }
  async function preparePhoto(file: File) {
    const version = ++imageVersion.current;
    setProcessing(true);
    setError("");
    try {
      const prepared = await resizePhoto(file);
      if (version === imageVersion.current) {
        updateDraft({ image: prepared });
        setView("details");
      }
    } catch (error) {
      if (version === imageVersion.current)
        setError(
          error instanceof Error
            ? error.message
            : "Could not prepare this photo.",
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
    gpsController.current?.abort();
    const controller = new AbortController();
    gpsController.current = controller;
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        if (version !== gpsVersion.current) return;
        const pin = `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
        setDraft((previous) => ({
          ...previous,
          coordinates: pin,
          place: previous.place.trim() || pin,
        }));
        setReportArea(null);
        try {
          const nextArea = await lookupArea(
            { lat: coords.latitude, lng: coords.longitude },
            controller.signal,
          );
          if (version === gpsVersion.current) setReportArea(nextArea);
        } catch {
          if (version === gpsVersion.current)
            setToast(
              "GPS pin added, but the lookup didn’t work. Check the representative below.",
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
  async function updateFollowUp(status: FollowUpStatus) {
    const report = reviewedReport();
    if (!report) return;
    const updated: BarrierReport = {
      ...report,
      status: status === "not-sent" ? "Draft" : "Shared",
      followUp: status,
    };
    const version = reportVersion.current;
    setCurrent(updated);
    if ((await persist(updated)) && version === reportVersion.current) {
      setToast(`Follow-up updated: ${followUpLabels[status]}.`);
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
    const previous = current ? { ...current, summary } : null;
    const report = createDraft(
      {
        category: label,
        note: note.trim(),
        place: place.trim(),
        coordinates: coordinates || undefined,
        image,
        recipient: reportArea || undefined,
      },
      profile,
      draftId || crypto.randomUUID(),
      previous,
    );
    setSaving(true);
    setCurrent(report);
    setSummary(report.summary);
    setView("review");
    if (
      previous &&
      report.summary === previous.summary &&
      (previous.place !== report.place ||
        previous.note !== report.note ||
        previous.category !== report.category)
    ) {
      setToast(
        "Your edited message was kept. Check that it matches the updated details.",
      );
    }
    await persist(report);
    setSaving(false);
  }
  function openReport(report: BarrierReport) {
    reportVersion.current++;
    setCurrent(report);
    setSummary(report.summary);
    setDraftId(report.id);
    setDraft({
      image: report.image,
      category: categories.includes(report.category)
        ? report.category
        : "Other",
      customCategory: categories.includes(report.category)
        ? ""
        : report.category,
      note: report.note,
      place: report.place,
      coordinates: report.coordinates || "",
    });
    setReportArea(report.recipient || null);
    setView("review");
  }
  function reviewedReport(): BarrierReport | null {
    return current
      ? { ...current, summary, recipient: reportArea || undefined }
      : null;
  }
  function saveReview() {
    if (view !== "review") return;
    const report = reviewedReport();
    if (report && report.summary !== current?.summary) {
      setCurrent(report);
      void persist(report);
    }
  }
  async function share() {
    const report = reviewedReport();
    if (!report || sharing) return;
    const version = reportVersion.current;
    saveReview();
    const file = photoFile(report);
    let attachmentsSupported = false;
    try {
      attachmentsSupported = Boolean(
        file &&
          typeof navigator.share === "function" &&
          navigator.canShare?.({ files: [file] }),
      );
    } catch {
      // Some browsers expose canShare but throw for file attachments.
    }
    if (!file || !attachmentsSupported) {
      setError(
        "This browser cannot share photo attachments directly. Copy the message and save the photo below, then attach it on the official contact page.",
      );
      sendPanel.current?.scrollIntoView({ behavior: "auto", block: "start" });
      return;
    }
    setSharing(true);
    setError("");
    try {
      await navigator.share({
        files: [file],
        title: `Curb: ${report.category}`,
        text: summary,
      });
      if (version === reportVersion.current)
        setToast("Share sheet closed. Did you send the report?");
    } catch (e) {
      if (
        version === reportVersion.current &&
        !(e instanceof Error && e.name === "AbortError")
      )
        setError(
          "Sharing could not open. Try copying the message and saving the photo instead.",
        );
    } finally {
      setSharing(false);
    }
  }
  async function copy() {
    const version = reportVersion.current;
    saveReview();
    try {
      await navigator.clipboard.writeText(summary);
      if (version === reportVersion.current)
        setToast("Report copied. Attach the saved photo when you send it.");
    } catch {
      if (version === reportVersion.current)
        setError("Select the report text and copy it manually.");
    }
  }
  async function removeCurrent() {
    if (!current) return;
    const version = reportVersion.current;
    setConfirmation(null);
    try {
      await remove(current.id);
      if (version !== reportVersion.current) return;
      setCurrent(null);
      setView("reports");
      setToast("Report deleted.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete report.");
    }
  }
  const isFlow = view === "details" || view === "review";
  const flowStep = view === "details" ? 1 : 2;
  return (
    <>
      <div className={`app-shell view-${view}`}>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="topbar">
          <button
            className="brand"
            aria-label="Curb home"
            onClick={() => navigate("home")}
          >
            <CurbMark />
            <span>Curb</span>
          </button>
          <button
            className="profile-button icon-button"
            aria-label="Profile"
            aria-current={view === "settings" ? "page" : undefined}
            onClick={() => navigate("settings")}
          >
            <UserRound size={21} />
          </button>
        </header>
        <main
          id="main"
          className={`main-content ${isFlow ? "flow-content" : ""}`}
        >
          {view === "home" && (
            <HomeDashboard
              reports={reports}
              loading={loading}
              processing={processing}
              error={error}
              headingRef={heading}
              onReport={newReport}
              onReports={() => setView("reports")}
              onOpenReport={openReport}
            />
          )}

          {isFlow && (
            <div className="flow-top">
              <button
                className="back-button"
                onClick={() =>
                  view === "details" ? navigate("home") : setView("details")
                }
              >
                <ArrowLeft size={16} />
                {view === "details" ? "Home" : "Back"}
              </button>
              <ol className="flow-steps" aria-label="Report progress">
                {["Photo", "Details", "Review"].map((label, index) => (
                  <li
                    key={label}
                    className={index <= flowStep ? "active" : ""}
                    aria-current={index === flowStep ? "step" : undefined}
                  >
                    {label}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {view === "details" && (
            <ReportDetails
              draft={draft}
              reportArea={reportArea}
              locating={locating}
              processing={processing}
              saving={saving}
              error={error}
              heading={heading}
              onChange={updateDraft}
              onPhoto={changePhoto}
              onArea={() => setAreaModal("report")}
              onRemovePin={removePin}
              addLocation={addLocation}
              generate={generate}
            />
          )}

          {view === "review" && current && (
            <ReportReview
              current={current}
              summary={summary}
              reportArea={reportArea}
              sharing={sharing}
              processing={processing}
              error={error}
              heading={heading}
              sendPanel={sendPanel}
              setSummary={setSummary}
              saveReview={saveReview}
              chooseArea={() => setAreaModal("report")}
              share={share}
              copy={copy}
              updateFollowUp={updateFollowUp}
              newReport={newReport}
              deleteCurrent={() => setConfirmation("report")}
            />
          )}

          {view === "reports" && (
            <ReportsView
              reports={reports}
              loading={loading}
              processing={processing}
              error={error}
              heading={heading}
              newReport={newReport}
              openReport={openReport}
            />
          )}

          {view === "settings" && (
            <SettingsView
              profile={profile}
              area={area}
              heading={heading}
              onSignature={() => {
                setError("");
                setContactDraft(profile);
                setProfileModal(true);
              }}
              onArea={() => setAreaModal("profile")}
            />
          )}

          {storageWarning && (
            <p className="storage-warning" role="status">
              {storageWarning}
            </p>
          )}
        </main>
        <nav className="app-dock" aria-label="App navigation">
          <button
            aria-current={view === "home" ? "page" : undefined}
            onClick={() => navigate("home")}
          >
            <Home size={22} />
            <span>Home</span>
          </button>
          {isFlow ? (
            <button className="dock-create" aria-current="page">
              <Camera size={21} />
              <span>New</span>
            </button>
          ) : (
            <PhotoPicker
              className="dock-create"
              label="New report: take or choose a photo"
              disabled={processing}
              onPick={newReport}
            >
              <Camera size={21} />
              <span aria-hidden="true">New</span>
            </PhotoPicker>
          )}
          <button
            aria-current={view === "reports" ? "page" : undefined}
            onClick={() => navigate("reports")}
          >
            <FileText size={20} />
            <span>Reports</span>
          </button>
        </nav>
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
                let saved = true;
                if (areaModal === "report") {
                  gpsVersion.current++;
                  gpsController.current?.abort();
                  setLocating(false);
                  setReportArea(next);
                  if (current && view === "review") {
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
                } else saved = rememberArea(next);
                setAreaModal(null);
                setToast(
                  saved ? "Area updated." : "Area saved for this visit only.",
                );
              }}
            />
          </Modal>
        )}
        {profileModal && (
          <Modal
            title="Personal details"
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
                  contactDraft.email.trim() &&
                  !validEmail(contactDraft.email.trim())
                ) {
                  setError(
                    "Use an email address like you@example.com, or leave it blank.",
                  );
                  return;
                }
                const saved = rememberProfile(contactDraft);
                setProfileModal(false);
                setError("");
                setToast(
                  saved
                    ? "Signature saved for new reports."
                    : "Signature saved for this visit only.",
                );
              }}
            >
              <p className="modal-description">
                Your signature for new reports.
              </p>
              <label htmlFor="profile-name">Your name</label>
              <input
                id="profile-name"
                name="name"
                autoComplete="name"
                maxLength={80}
                value={contactDraft.name}
                onChange={(event) =>
                  setContactDraft({ ...contactDraft, name: event.target.value })
                }
              />
              <label htmlFor="profile-email">Your email (optional)</label>
              <input
                id="profile-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={254}
                value={contactDraft.email}
                onChange={(event) =>
                  setContactDraft({
                    ...contactDraft,
                    email: event.target.value,
                  })
                }
              />
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
                : "This removes your saved name and email. Older reports keep their signatures. You can edit or delete those separately."}
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
                    const saved = rememberProfile({ name: "", email: "" });
                    setConfirmation(null);
                    setToast(
                      saved
                        ? "Saved contact details removed. Existing reports unchanged."
                        : "Details removed for this visit only. Browser storage could not be updated.",
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
      </div>
    </>
  );
}
