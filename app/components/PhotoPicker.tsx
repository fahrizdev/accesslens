import type { ChangeEvent, ReactNode } from "react";

// A styled label over a native file input, so one tap opens the device's
// own camera/library chooser instead of an in-app imitation of a camera.
export default function PhotoPicker({
  className = "",
  label,
  disabled = false,
  onPick,
  children,
}: {
  className?: string;
  label: string;
  disabled?: boolean;
  onPick: (event: ChangeEvent<HTMLInputElement>) => void;
  children: ReactNode;
}) {
  return (
    <label className={`photo-picker ${className}`}>
      {children}
      <input
        type="file"
        accept="image/*"
        aria-label={label}
        disabled={disabled}
        onChange={onPick}
      />
    </label>
  );
}
