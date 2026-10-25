import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Camera, Check, FileText, Home, UserRound } from "lucide-react";
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
import { downloadPhoto, photoFile } from "./reportFiles";
import {
  AREA_KEY,
  readArea,
  readPreference,
  WELCOME_KEY,
  writePreference,
} from "./preferences";
import { lookupArea } from "./area";
import { preparePhoto as resizePhoto } from "./photos";
import AreaPicker from "./components/AreaPicker";
import Modal from "./components/Modal";
import PhotoPicker from "./components/PhotoPicker";
import { Launch } from "./Brand";
import Welcome from "./Welcome";
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
  const [welcomed, setWelcomed] = useState(
    () => readPreference(WELCOME_KEY) === true,
  );
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
  // Set once the person has tried to send, so Curb can ask whether it went out.
  const [sendAttempted, setSendAttempted] = useState(false);
  // Entrance motion plays when the app first appears, not on every tab switch.
  const [arriving, setArriving] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [areaModal, setAreaModal] = useState<"profile" | "report" | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const sendPanel = useRef<HTMLDivElement>(null);
  const imageVersion = useRef(0);
  const gpsVersion = useRef(0);
  const reportVersion = useRef(0);
  const gpsController = useRef<AbortController | null>(null);
  const categoryLabel =
    category === "Other" && customCategory.trim()
      ? customCategory.trim()
      : category;
  // A reopened report only counts as changed if its details differ.
  const detailsDirty =
    view === "details" &&
    (current
      ? image !== current.image ||
        note !== current.note ||
        place !== current.place ||
        categoryLabel !== current.category
      : !!(image || note || place));
  const unsavedChanges =
    hasUnsaved ||
    detailsDirty ||
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
  useEffect(() => setSendAttempted(false), [current?.id]);
  useEffect(() => {
    if (!welcomed) return;
    setArriving(true);
    const timer = window.setTimeout(() => setArriving(false), 1600);
    return () => clearTimeout(timer);
  }, [welcomed]);
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
      detailsDirty &&
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
      setToast(
        status === "sent"
          ? "Sent. It’s under Waiting in Reports."
          : status === "resolved"
            ? "Marked resolved. Nice work."
            : `Updated: ${followUpLabels[status]}.`,
      );
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
    const label = categoryLabel;
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
    setError("");
    if (!file || !attachmentsSupported) {
      await copyAndSavePhoto(report, version);
      return;
    }
    setSharing(true);
    try {
      await navigator.share({
        files: [file],
        title: `Curb: ${report.category}`,
        text: summary,
      });
      if (version === reportVersion.current) setSendAttempted(true);
    } catch (e) {
      if (
        version === reportVersion.current &&
        !(e instanceof Error && e.name === "AbortError")
      )
        await copyAndSavePhoto(report, version);
    } finally {
      setSharing(false);
    }
  }
  async function openOfficialPage() {
    const version = reportVersion.current;
    saveReview();
    setSendAttempted(true);
    try {
      await navigator.clipboard.writeText(summary);
      if (version === reportVersion.current)
        setToast("Message copied. Paste it into their form.");
    } catch {
      // The form still opens; the message can be copied by hand.
    }
  }
  // Without a share sheet that carries photos, hand over both pieces instead.
  async function copyAndSavePhoto(report: BarrierReport, version: number) {
    if (report.image) downloadPhoto(report);
    setSendAttempted(true);
    try {
      await navigator.clipboard.writeText(summary);
      if (version === reportVersion.current)
        setToast(
          report.image
            ? "Message copied and photo saved. Paste and attach them where you send it."
            : "Message copied. Paste it where you send it.",
        );
    } catch {
      if (version === reportVersion.current)
        setError(
          "Select the message and copy it, then attach the saved photo where you send it.",
        );
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
  const tabs = [
    { view: "home", label: "Home", icon: Home },
    { view: "reports", label: "Reports", icon: FileText },
    { view: "settings", label: "You", icon: UserRound },
  ] as const;
  if (!welcomed)
    return (
      <>
        <Welcome
          onFinish={(chosen) => {
            if (chosen) {
              rememberArea(chosen);
              setReportArea(chosen);
            }
            writePreference(WELCOME_KEY, true);
            setWelcomed(true);
          }}
        />
        <Launch />
      </>
    );
  return (
    <>
      <div className={`app-shell view-${view} ${arriving ? "arriving" : ""}`}>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <main id="main" className="main-content" key={view}>
          {view === "home" && (
            <HomeDashboard
              reports={reports}
              loading={loading}
              processing={processing}
              error={error}
              area={area}
              headingRef={heading}
              onReport={newReport}
              onReports={() => navigate("reports")}
              onProfile={() => navigate("settings")}
              onArea={() => setAreaModal("profile")}
              onOpenReport={openReport}
            />
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
              editing={!!current}
              onCancel={() => navigate(current ? "reports" : "home")}
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
              sendAttempted={sendAttempted}
              error={error}
              heading={heading}
              sendPanel={sendPanel}
              setSummary={setSummary}
              saveReview={saveReview}
              chooseArea={() => setAreaModal("report")}
              onBack={() => {
                saveReview();
                setView("details");
              }}
              send={share}
              onOfficialPage={() => void openOfficialPage()}
              dismissSendCheck={() => setSendAttempted(false)}
              updateFollowUp={updateFollowUp}
              deleteCurrent={() => setConfirmation("report")}
            />
          )}

          {view === "reports" && (
            <ReportsView
              reports={reports}
              loading={loading}
              error={error}
              heading={heading}
              openReport={openReport}
            />
          )}

          {view === "settings" && (
            <SettingsView
              profile={profile}
              area={area}
              reports={reports}
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
        {!isFlow && (
          <div className="tab-dock">
            <nav className="tab-bar glass" aria-label="App navigation">
              {tabs.map(({ view: target, label, icon: Icon }) => (
                <button
                  key={target}
                  aria-current={view === target ? "page" : undefined}
                  onClick={() => navigate(target)}
                >
                  <Icon
                    size={24}
                    strokeWidth={view === target ? 2.2 : 1.8}
                    fill={view === target ? "currentColor" : "none"}
                    fillOpacity={view === target ? 0.2 : 0}
                  />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
            <PhotoPicker
              className="tab-camera glass"
              label="New report: take or choose a photo"
              disabled={processing}
              onPick={newReport}
            >
              {processing ? <span className="spinner" /> : <Camera size={25} />}
            </PhotoPicker>
          </div>
        )}
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
      <Launch />
    </>
  );
}
