export const categories = [
  "Blocked curb ramp",
  "Stairs-only entrance",
  "Obstructed pathway",
  "Uneven surface",
  "Heavy or difficult door",
  "Missing signage",
  "Other",
];
export type Area = {
  label: string;
  district?: string;
  representative?: string;
  phone?: string;
  contactUrl?: string;
  source?: string;
};
export type BarrierReport = {
  id: string;
  category: string;
  note: string;
  place: string;
  coordinates?: string;
  image: string;
  created: string;
  summary: string;
  recipient?: Area;
  status: "Draft" | "Shared";
};
const database = new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open("accesslens", 3);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains("routes"))
      db.createObjectStore("routes", { keyPath: "id" });
    if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
    if (!db.objectStoreNames.contains("reports"))
      db.createObjectStore("reports", { keyPath: "id" });
  };
  request.onsuccess = () => {
    request.result.onversionchange = () => request.result.close();
    resolve(request.result);
  };
  request.onerror = () =>
    reject(
      new Error(
        "Local storage is unavailable. You can still prepare and share a report.",
      ),
    );
  request.onblocked = () =>
    reject(
      new Error(
        "Close other AccessLens tabs, then reload to update your saved reports.",
      ),
    );
});
export function buildSummary(
  category: string,
  place: string,
  note: string,
  coordinates?: string,
  name?: string,
) {
  return `${name ? `Hello Representative ${name},` : "Hello,"}\n\nI’m reporting a possible accessibility barrier.\n\n${category}\nLocation: ${place}${coordinates ? ` (${coordinates})` : ""}${note.trim() ? `\n${note.trim()}` : ""}\n\nCould your office review this or direct me to the team responsible? Photo attached. Thank you.`;
}
export async function saveReport(report: BarrierReport): Promise<void> {
  const db = await database;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("reports", "readwrite");
    transaction.objectStore("reports").put(report);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(
        new Error(
          "Could not save on this device. You can still share or download your report.",
        ),
      );
    transaction.onabort = () =>
      reject(
        new Error("Saving was interrupted. You can still share this report."),
      );
  });
}
export async function loadReports(): Promise<BarrierReport[]> {
  const db = await database;
  // Flatten old multi-observation routes into independent reports without deleting original data.
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(["reports", "routes", "meta"], "readwrite");
    const meta = tx.objectStore("meta");
    const check = meta.get("single-reports-migrated");
    check.onsuccess = () => {
      if (check.result) return;
      const routes = tx.objectStore("routes").getAll();
      routes.onsuccess = () => {
        const store = tx.objectStore("reports");
        for (const route of routes.result) {
          if (route.demo || !Array.isArray(route.observations)) continue;
          for (const item of route.observations) {
            if (!item || typeof item.description !== "string") continue;
            const place =
              item.place ||
              route.destination ||
              route.area ||
              "Location not recorded";
            store.put({
              id: `imported-${route.id}-${item.id}`,
              category: item.category || "Other",
              note: item.description,
              place,
              coordinates: item.coordinates,
              image: item.image || "",
              created:
                item.created || route.created || new Date().toISOString(),
              summary: buildSummary(
                item.category || "Other",
                place,
                item.description,
                item.coordinates,
              ),
              status: "Draft",
            } satisfies BarrierReport);
          }
        }
        // Users coming directly from the original prototype may still only have localStorage notes.
        try {
          const legacy = JSON.parse(
            localStorage.getItem("accesslens-reports-v1") || "[]",
          );
          for (const old of Array.isArray(legacy) ? legacy : []) {
            if (
              !old ||
              old.demo ||
              typeof old.id !== "number" ||
              typeof old.description !== "string" ||
              routes.result.some((route) => route.id === `legacy-${old.id}`)
            )
              continue;
            const place = old.location || "Location not recorded";
            store.put({
              id: `original-${old.id}`,
              category: old.category || "Other",
              note: old.description,
              place,
              image: old.image || "",
              created: old.date || new Date().toISOString(),
              summary: buildSummary(
                old.category || "Other",
                place,
                old.description,
              ),
              status: "Draft",
            } satisfies BarrierReport);
          }
        } catch {
          /* Preserve inaccessible or invalid legacy storage for recovery. */
        }
        meta.put(true, "single-reports-migrated");
      };
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(
        new Error(
          "Could not open your saved reports. Your previous data has been preserved.",
        ),
      );
    tx.onabort = () =>
      reject(
        new Error("Could not update your saved reports. Reload to try again."),
      );
  });
  return new Promise((resolve, reject) => {
    const request = db.transaction("reports").objectStore("reports").getAll();
    request.onsuccess = () =>
      resolve(
        (request.result as BarrierReport[]).sort((a, b) =>
          b.created.localeCompare(a.created),
        ),
      );
    request.onerror = () => reject(new Error("Could not load saved reports."));
  });
}
export async function deleteReport(id: string): Promise<void> {
  const db = await database;
  return new Promise((resolve, reject) => {
    const tx = db.transaction("reports", "readwrite");
    tx.objectStore("reports").delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error("Could not delete this report."));
  });
}
export function photoFile(report: BarrierReport): File | null {
  const match = report.image.match(
    /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/,
  );
  if (!match) return null;
  const bytes = Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0));
  return new File(
    [bytes],
    `accesslens-photo.${match[1] === "jpeg" ? "jpg" : "png"}`,
    { type: `image/${match[1]}` },
  );
}
export function downloadPhoto(report: BarrierReport) {
  const file = photoFile(report);
  if (!file) return;
  downloadBlob(file, file.name);
}
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}
const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function downloadReport(report: BarrierReport) {
  const photo = photoFile(report)
    ? `<img src="${report.image}" alt="Photo of the reported barrier">`
    : "";
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>AccessLens — ${escapeHtml(report.category)}</title><style>body{max-width:700px;margin:40px auto;padding:24px;font:16px/1.6 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;color:#161719}h1{font-size:32px;letter-spacing:-1px}img{max-width:100%;max-height:500px;border-radius:20px}pre{white-space:pre-wrap;font:inherit;background:#f5f5f7;padding:24px;border-radius:20px}small{color:#626773}@media print{body{margin:0}}</style><small>ACCESSLENS · ${escapeHtml(new Date(report.created).toLocaleDateString())}</small><h1>${escapeHtml(report.category)}</h1><p>${escapeHtml(report.place)}</p>${photo}<pre>${escapeHtml(report.summary)}</pre><small>Personal observation, not a compliance assessment. This file does not confirm delivery to an office.</small></html>`;
  downloadBlob(
    new Blob([html], { type: "text/html" }),
    "accesslens-report.html",
  );
}
