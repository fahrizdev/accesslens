import type { ChangeEvent, RefObject } from "react";
import {
  ArrowRight,
  Camera,
  ImagePlus,
  ScanLine,
  ShieldCheck,
} from "lucide-react";

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
      <div className="page-intro">
        <span className="eyebrow">01 / PHOTO</span>
        <h1 ref={heading} tabIndex={-1}>
          What’s in the way?
        </h1>
        <p>Get the barrier and some of the space around it in the photo.</p>
      </div>
      <div className={`photo-stage ${image ? "has-photo" : ""}`}>
        {image ? (
          <img src={image} alt="Your selected barrier photo" />
        ) : (
          <>
            <ScanLine size={53} strokeWidth={0.9} />
            <span>Add a photo to get started.</span>
          </>
        )}
        <i className="scan-corner tl" />
        <i className="scan-corner tr" />
        <i className="scan-corner bl" />
        <i className="scan-corner br" />
        {processing && (
          <div className="processing-overlay" role="status">
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
        <button className="text-button centered" onClick={onContinue}>
          Use this photo <ArrowRight size={15} />
        </button>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <p className="privacy-caption">
        <ShieldCheck size={13} /> Avoid faces, license plates, and private
        addresses.
      </p>
    </section>
  );
}
