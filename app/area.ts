export type Area = {
  label: string;
  district?: string;
  representative?: string;
  phone?: string;
  contactUrl?: string;
  source?: string;
};

export const HOUSE_LOOKUP_URL =
  "https://www.house.gov/representatives/find-your-representative";

export function officialContactUrl(value: unknown): string {
  if (typeof value !== "string") return HOUSE_LOOKUP_URL;
  try {
    const url = new URL(value);
    if (
      url.protocol === "https:" &&
      (url.hostname === "house.gov" || url.hostname.endsWith(".house.gov")) &&
      !url.username &&
      !url.password &&
      !url.port
    )
      return url.href;
  } catch {
    // A malformed saved URL should never become a clickable link.
  }
  return HOUSE_LOOKUP_URL;
}

export function normalizeArea(value: unknown): Area | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.label !== "string" ||
    !candidate.label.trim() ||
    candidate.label === "Area not set"
  )
    return null;
  const area: Area = { label: candidate.label.trim() };
  for (const key of [
    "district",
    "representative",
    "phone",
    "source",
  ] as const) {
    if (typeof candidate[key] === "string" && candidate[key].trim()) {
      area[key] = candidate[key].trim();
    }
  }
  if (candidate.contactUrl)
    area.contactUrl = officialContactUrl(candidate.contactUrl);
  return area;
}

export type AreaQuery = { address: string } | { lat: number; lng: number };

export async function lookupArea(
  input: AreaQuery,
  signal?: AbortSignal,
): Promise<Area> {
  const timeout = AbortSignal.timeout(25000);
  const response = await fetch("/api/area", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });
  const data = await response.json();
  const area = normalizeArea(data?.area);
  if (!response.ok || !area) {
    throw new Error(
      typeof data?.error === "string"
        ? data.error
        : "Could not find this area.",
    );
  }
  return area;
}
