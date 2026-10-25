import type { FormEvent, RefObject } from "react";
import {
  ArrowRight,
  Camera,
  Check,
  ChevronRight,
  Crosshair,
  FileText,
  MapPin,
} from "lucide-react";
import { categories } from "../reports";
import type { Area } from "../area";
import Representative from "../components/Representative";

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
  saving: boolean;
  error: string;
  heading: RefObject<HTMLHeadingElement | null>;
  onChange: (patch: Partial<ReportFormFields>) => void;
  onPhoto: () => void;
  onArea: () => void;
  onRemovePin: () => void;
  addLocation: () => void;
  generate: (event: FormEvent) => Promise<void>;
};

export default function ReportDetails({
  draft: { image, category, customCategory, note, place, coordinates },
  reportArea,
  locating,
  saving,
  error,
  heading,
  onChange,
  onPhoto,
  onArea,
  onRemovePin,
  addLocation,
  generate,
}: Props) {
  return (
    <section className="details-view">
      <div className="page-intro">
        <span className="eyebrow">02 / DETAILS</span>
        <h1 ref={heading} tabIndex={-1}>
          What did you notice?
        </h1>
        <p>Pick a barrier type and add where it is.</p>
      </div>
      <form
        onSubmit={(event) => void generate(event)}
        className="details-layout"
      >
        <div className="details-photo-panel">
          <img src={image} alt="The barrier you’re reporting" />
          <button type="button" className="photo-edit" onClick={onPhoto}>
            <Camera size={14} /> Change photo
          </button>
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
                  onClick={() => onChange({ category: item })}
                >
                  {item === "Other" ? "Something else" : item}
                  {category === item && <Check size={13} />}
                </button>
              ))}
            </div>
          </fieldset>
          {category === "Other" && (
            <label className="field-label">
              Give it a short name <span className="optional">optional</span>
              <input
                placeholder="What kind of barrier did you notice?"
                value={customCategory}
                onChange={(event) =>
                  onChange({ customCategory: event.target.value })
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
            onChange={(event) => onChange({ place: event.target.value })}
            required
            maxLength={200}
          />
          {coordinates && (
            <p className="gps-caption">
              <MapPin size={11} /> {coordinates}{" "}
              <button type="button" onClick={onRemovePin}>
                Remove pin
              </button>
            </p>
          )}
          <label className="field-label">
            Anything to add? <span className="optional">optional</span>
            <textarea
              value={note}
              onChange={(event) => onChange({ note: event.target.value })}
              placeholder="e.g. bins are blocking the ramp by the entrance"
              rows={3}
              maxLength={800}
            />
          </label>
          <div className="recipient-inline">
            <Representative area={reportArea} compact />
            <button type="button" className="text-button" onClick={onArea}>
              {reportArea?.representative ? "Change" : "Find"}
              <ChevronRight size={13} />
            </button>
          </div>
          <p className="fine-print">
            Check that the representative matches where this happened. Change
            the area if needed before sharing.
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
            {saving ? "Making report…" : "Make report"}
            <ArrowRight size={16} />
          </button>
          <p className="draft-note">
            Uses the details you entered. You can edit the report before
            sharing.
          </p>
        </div>
      </form>
    </section>
  );
}
