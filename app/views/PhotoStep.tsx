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
          New report<span className="accent-dot">.</span>
        </h1>
      </div>
      <div className={`photo-stage${image ? " has-photo" : ""}`}>
        {image ? (
          <img src={image} alt="Your selected barrier photo" />
        ) : (
          <div className="capture-art" aria-hidden="true">
            <span className="capture-frame">
              <Camera size={50} strokeWidth={1.4} />
            </span>
            <span className="capture-sticker" />
          </div>
        )}
        {processing && (
          <div className="processing-overlay" role="status">
            <span className="spinner" /> Preparing photo…
          </div>
        )}
      </div>
      <div className="photo-buttons">
        <label className="button-primary camera-input">
          <Camera size={19} /> Take photo
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
          <ImagePlus size={19} /> Photo library
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
        <button className="button-primary full use-photo" onClick={onContinue}>
          Use this photo <ArrowRight size={17} />
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
