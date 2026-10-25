import type { ChangeEvent, FormEvent, RefObject } from "react";
import {
  ArrowRight,
  Camera,
  Check,
  ChevronRight,
  Crosshair,
  MapPin,
} from "lucide-react";
import { categories } from "../reports";
import type { Area } from "../area";
import Representative from "../components/Representative";
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
  onChange: (patch: Partial<ReportFormFields>) => void;
  onPhoto: (event: ChangeEvent<HTMLInputElement>) => void;
  onArea: () => void;
  onRemovePin: () => void;
  addLocation: () => void;
  generate: (event: FormEvent) => Promise<void>;
};

export default function ReportDetails({
  draft: { image, category, customCategory, note, place, coordinates },
  reportArea,
  locating,
  processing,
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
      <div className="page-heading">
        <h1 ref={heading} tabIndex={-1}>
          Details
        </h1>
      </div>
      <form
        onSubmit={(event) => void generate(event)}
        className="details-layout"
      >
        <div className="details-photo-panel">
          <img src={image} alt="The barrier you’re reporting" />
          <PhotoPicker
            className="photo-edit"
            label="Change photo"
            disabled={processing}
            onPick={onPhoto}
          >
            <Camera size={14} /> {processing ? "Preparing…" : "Change photo"}
          </PhotoPicker>
        </div>
        <div className="details-fields">
          <fieldset className="category-field">
            <legend>Barrier type</legend>
            <div className="category-options">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={category === item}
                  className={category === item ? "chosen" : ""}
                  onClick={() => onChange({ category: item })}
                >
                  {item}
                  {category === item && <Check size={13} />}
                </button>
              ))}
            </div>
          </fieldset>
          {category === "Other" && (
            <label className="field-label">
              Short name <span className="optional">optional</span>
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
            <label htmlFor="report-place">Location</label>
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
            Notes <span className="optional">optional</span>
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
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button
            className="button-primary full"
            disabled={saving || locating || !category}
          >
            {saving ? "Saving…" : "Review report"}
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </section>
  );
}
