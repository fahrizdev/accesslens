import type { ChangeEvent, FormEvent, RefObject } from "react";
import {
  AlignLeft,
  ChevronRight,
  Landmark,
  MapPin,
  Navigation,
  RotateCcw,
  Tag,
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
      <form onSubmit={(event) => void generate(event)} className="flow-form">
        <div className="flow-body">
          <div className="photo-frame enter">
            <img src={image} alt="The barrier you’re reporting" />
            <PhotoPicker
              className="glass-button"
              label="Retake photo"
              disabled={processing}
              onPick={onPhoto}
            >
              <RotateCcw size={15} /> {processing ? "Preparing…" : "Retake"}
            </PhotoPicker>
          </div>

          <fieldset
            className="chip-field enter"
            style={{ animationDelay: "60ms" }}
          >
            <legend>Barrier</legend>
            <div className="chip-row">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="chip"
                  aria-pressed={category === item}
                  onClick={() => onChange({ category: item })}
                >
                  {item}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="enter" style={{ animationDelay: "120ms" }}>
            <div className="grouped form-group">
              {category === "Other" && (
                <div className="form-row">
                  <Tag size={20} className="row-icon" />
                  <label className="sr-only" htmlFor="report-custom">
                    Barrier name
                  </label>
                  <input
                    id="report-custom"
                    placeholder="Name the barrier (optional)"
                    value={customCategory}
                    onChange={(event) =>
                      onChange({ customCategory: event.target.value })
                    }
                    maxLength={90}
                  />
                </div>
              )}
              <div className="form-row">
                <MapPin size={20} className="row-icon accent" />
                <label className="sr-only" htmlFor="report-place">
                  Location
                </label>
                <input
                  id="report-place"
                  placeholder="Building, entrance or intersection"
                  value={place}
                  onChange={(event) => onChange({ place: event.target.value })}
                  required
                  maxLength={200}
                />
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
                    <Navigation size={17} />
                  )}
                </button>
              </div>
              <div className="form-row">
                <AlignLeft size={20} className="row-icon" />
                <label className="sr-only" htmlFor="report-note">
                  Note
                </label>
                <textarea
                  id="report-note"
                  rows={1}
                  value={note}
                  onChange={(event) => onChange({ note: event.target.value })}
                  placeholder="Add a note (optional)"
                  maxLength={800}
                />
              </div>
              <button type="button" className="form-row" onClick={onArea}>
                <Landmark size={20} className="row-icon" />
                <span className="row-label">
                  To{" "}
                  <span className="muted">
                    {reportArea?.representative || "Find your representative"}
                  </span>
                </span>
                <ChevronRight size={16} className="chevron" />
              </button>
            </div>
            {coordinates && (
              <p className="group-footer">
                GPS pin added.{" "}
                <button type="button" onClick={onRemovePin}>
                  Remove
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
          <button
            className="button-primary full"
            disabled={saving || locating || !category}
          >
            {saving ? "Saving…" : "Write report"}
          </button>
        </div>
      </form>
    </section>
  );
}
