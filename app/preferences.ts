import { normalizeArea } from "./area.ts";

export const AREA_KEY = "accesslens-area";
export const WELCOME_KEY = "curb-welcomed-v1";
export const LAUNCH_KEY = "curb-launch-day";

export function readPreference(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

export function writePreference(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function readArea() {
  return normalizeArea(readPreference(AREA_KEY));
}
