import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type RefObject,
} from "react";
import {
  AlignLeft,
  Camera,
  ChevronRight,
  Landmark,
  MapPin,
  Navigation,
  RotateCcw,
  Tag,
  X,
} from "lucide-react";
import { categories } from "../reports";
import type { Area } from "../area";
import PhotoPicker from "../components/PhotoPicker";

export type ReportFormFields = {
  image: string;
  category: string;
  customCategory: string;
  note: string;
  place: string;
  coordinates: string;
};

export const emptyReportForm: ReportFormFields = {
  image: "",
  category: "",
  customCategory: "",
  note: "",
  place: "",
  coordinates: "",
};

type Props = {
  draft: ReportFormFields;
  reportArea: Area | null;
  locating: boolean;
  processing: boolean;
  saving: boolean;
  error: string;
  heading: RefObject<HTMLHeadingElement | null>;
  editing: boolean;
  onCancel: () => void;
  onChange: (patch: Partial<ReportFormFields>) => void;
  onPhoto: (event: ChangeEvent<HTMLInputElement>) => void;
  onArea: () => void;
  onRemovePin: () => void;
  addLocation: () => void;
  generate: (event: FormEvent) => Promise<void>;
};

type Missing = { category?: boolean; place?: boolean };

export default function ReportDetails({
  draft: { image, category, customCategory, note, place, coordinates },
  reportArea,
  locating,
  processing,
  saving,
  error,
  heading,
  editing,
  onCancel,
  onChange,
  onPhoto,
  onArea,
  onRemovePin,
  addLocation,
  generate,
}: Props) {
  const [missing, setMissing] = useState<Missing>({});
  const firstChip = useRef<HTMLInputElement>(null);
  const placeInput = useRef<HTMLInputElement>(null);

  // Say exactly what's missing, next to it, and take the person there.
  function submit(event: FormEvent) {
    event.preventDefault();
    const next: Missing = {
      category: !category,
      place: !place.trim(),
    };
    setMissing(next);
    if (next.category) return firstChip.current?.focus();
    if (next.place) return placeInput.current?.focus();
    void generate(event);
  }

  return (
    <section className="flow-view">
      <header className="nav-bar">
        <button className="nav-text" type="button" onClick={onCancel}>
          Cancel
        </button>
        <h1 ref={heading} tabIndex={-1}>
          {editing ? "Edit Report" : "New Report"}
        </h1>
        <span />
      </header>
      <form onSubmit={submit} className="flow-form" noValidate>
        <div className="flow-body">
          {image ? (
            <div className="photo-frame enter">
              <img src={image} alt="The barrier you’re reporting" />
              <div className="photo-actions">
                <button
                  type="button"
                  className="glass-button"
                  onClick={() => onChange({ image: "" })}
                >
                  <X size={15} aria-hidden="true" /> Remove
                </button>
                <PhotoPicker
                  className="glass-button"
                  label="Retake photo"
                  disabled={processing}
                  onPick={onPhoto}
                >
                  <RotateCcw size={15} aria-hidden="true" />{" "}
                  {processing ? "Preparing…" : "Retake"}
                </PhotoPicker>
              </div>
            </div>
          ) : (
            <PhotoPicker
              className="photo-empty enter"
              label="Add a photo (optional)"
              disabled={processing}
              onPick={onPhoto}
            >
              <span className="photo-empty-icon">
                {processing ? (
                  <span className="spinner" />
                ) : (
                  <Camera size={24} aria-hidden="true" />
                )}
              </span>
              <span className="row-copy">
                <b>{processing ? "Preparing photo…" : "Add a photo"}</b>
                <small>Optional. A photo helps the office find it.</small>
              </span>
            </PhotoPicker>
          )}

          <fieldset
            className="chip-field enter"
            style={{ animationDelay: "60ms" }}
            aria-describedby={missing.category ? "category-error" : undefined}
          >
            <legend>Barrier type</legend>
            <div className="chip-row">
              {categories.map((item, index) => (
                <label className="chip" key={item}>
                  <input
                    ref={index === 0 ? firstChip : undefined}
                    type="radio"
                    name="barrier"
                    value={item}
                    checked={category === item}
                    aria-invalid={missing.category || undefined}
                    onChange={() => {
                      setMissing((m) => ({ ...m, category: false }));
                      onChange({ category: item });
                    }}
                  />
                  {item}
                </label>
              ))}
            </div>
            {missing.category && (
              <p className="field-error" id="category-error">
                Choose the type of barrier.
              </p>
            )}
          </fieldset>

          <div className="enter" style={{ animationDelay: "120ms" }}>
            <div className="grouped form-group">
              {category === "Other" && (
                <div className="form-row">
                  <Tag size={20} className="row-icon" aria-hidden="true" />
                  <div className="field-stack">
                    <label htmlFor="report-custom">
                      Barrier name <span className="optional">(optional)</span>
                    </label>
                    <input
                      id="report-custom"
                      placeholder="For example, broken elevator"
                      value={customCategory}
                      onChange={(event) =>
                        onChange({ customCategory: event.target.value })
                      }
                      maxLength={90}
                    />
                  </div>
                </div>
              )}
              <div className={`form-row ${missing.place ? "is-invalid" : ""}`}>
                <MapPin
                  size={20}
                  className="row-icon accent"
                  aria-hidden="true"
                />
                <div className="field-stack">
                  <label htmlFor="report-place">Where is it?</label>
                  <input
                    ref={placeInput}
                    id="report-place"
                    placeholder="Building, entrance or intersection"
                    value={place}
                    onChange={(event) => {
                      if (event.target.value.trim())
                        setMissing((m) => ({ ...m, place: false }));
                      onChange({ place: event.target.value });
                    }}
                    aria-invalid={missing.place || undefined}
                    aria-describedby={missing.place ? "place-error" : undefined}
                    aria-required="true"
                    autoComplete="off"
                    maxLength={200}
                  />
                </div>
                <button
                  type="button"
                  className="row-action"
                  aria-label={
                    locating ? "Finding your location" : "Use my location"
                  }
                  onClick={addLocation}
                  disabled={locating}
                >
                  {locating ? (
                    <span className="spinner" />
                  ) : (
                    <Navigation size={17} aria-hidden="true" />
                  )}
                </button>
              </div>
              <div className="form-row">
                <AlignLeft size={20} className="row-icon" aria-hidden="true" />
                <div className="field-stack">
                  <label htmlFor="report-note">
                    Details <span className="optional">(optional)</span>
                  </label>
                  <textarea
                    id="report-note"
                    rows={1}
                    value={note}
                    onChange={(event) => onChange({ note: event.target.value })}
                    placeholder="What makes it hard to get through?"
                    maxLength={800}
                  />
                </div>
              </div>
              <button type="button" className="form-row" onClick={onArea}>
                <Landmark size={20} className="row-icon" aria-hidden="true" />
                <span className="field-stack">
                  <span className="field-stack-label">Send to</span>
                  <span
                    className={reportArea?.representative ? "" : "accent-text"}
                  >
                    {reportArea?.representative || "Find your representative"}
                  </span>
                </span>
                <ChevronRight
                  size={16}
                  className="chevron"
                  aria-hidden="true"
                />
              </button>
            </div>
            {missing.place && (
              <p className="field-error" id="place-error">
                Add where it is, like a building, entrance or intersection.
              </p>
            )}
            {coordinates && (
              <p className="group-footer">
                GPS pin added.{" "}
                <button type="button" onClick={onRemovePin}>
                  Remove pin
                </button>
              </p>
            )}
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="flow-footer">
          <button className="button-primary full" disabled={saving || locating}>
            {saving
              ? "Saving…"
              : locating
                ? "Finding your location…"
                : "Write report"}
          </button>
        </div>
      </form>
    </section>
  );
}
