import type { ChangeEvent, RefObject } from "react";
import { ArrowRight, Camera, ImagePlus } from "lucide-react";
type Props = {
  image: string;
  processing: boolean;
  error: string;
  heading: RefObject<HTMLHeadingElement | null>;
  preparePhoto: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onContinue: () => void;
};
export default function PhotoStep({
  image,
  processing,
  error,
  heading,
  preparePhoto,
  onContinue,
}: Props) {
  return (
    <section className="photo-view">
      <div className="page-heading">
        <h1 ref={heading} tabIndex={-1}>
          New report
        </h1>
      </div>
      <div className={`photo-stage${image ? " has-photo" : ""}`}>
        {image ? (
          <img src={image} alt="Your selected barrier photo" />
        ) : (
          <span className="capture-empty">
            <Camera size={28} strokeWidth={1.3} />
            <span>Add a photo</span>
          </span>
        )}
        {processing && (
          <div className="processing-overlay" role="status">
            <span className="spinner" /> Preparing photo…
          </div>
        )}
      </div>
      <div className="camera-controls">
        <label className="library-control camera-input">
          <ImagePlus size={22} />
          <span>Library</span>
          <input
            type="file"
            accept="image/*"
            aria-label="Choose a photo from your library"
            onChange={(event) => void preparePhoto(event)}
            disabled={processing}
          />
        </label>
        <label className="shutter-control camera-input">
          <span className="shutter-disc" />
          <span className="sr-only">Take photo</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            aria-label="Take a photo"
            onChange={(event) => void preparePhoto(event)}
            disabled={processing}
          />
        </label>
        <span className="camera-control-spacer" aria-hidden="true" />
      </div>
      {image && (
        <button className="button-primary full use-photo" onClick={onContinue}>
          Use photo <ArrowRight size={16} />
        </button>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
