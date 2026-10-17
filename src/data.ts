export const categories = [
  "Blocked curb ramp",
  "Stairs-only entrance",
  "Obstructed pathway",
  "Uneven surface",
  "Heavy or difficult door",
  "Missing signage",
  "Other",
];
export type Observation = {
  id: string;
  category: string;
  description: string;
  place: string;
  image?: string;
  coordinates?: string;
  created: string;
};
export type Area = {
  label: string;
  district?: string;
  representative?: string;
  phone?: string;
  contactUrl?: string;
  source?: string;
};
export type RouteNote = {
  id: string;
  title: string;
  start: string;
  destination: string;
  area: string;
  observations: Observation[];
  created: string;
  status: "Documented" | "Message prepared" | "Contacted" | "Resolved";
  demo?: boolean;
  message?: string;
};
const database = new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open("accesslens", 2);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains("routes"))
      request.result.createObjectStore("routes", { keyPath: "id" });
    if (!request.result.objectStoreNames.contains("meta"))
      request.result.createObjectStore("meta");
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () =>
    reject(
      new Error(
        "Your browser could not open local storage. Try a regular browser tab.",
      ),
    );
});
export async function loadRoutes(): Promise<RouteNote[]> {
  const db = await database;
  const items = await new Promise<RouteNote[]>((resolve, reject) => {
    const request = db.transaction("routes").objectStore("routes").getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const migrated = await new Promise<boolean>((resolve, reject) => {
    const request = db
      .transaction("meta")
      .objectStore("meta")
      .get("legacy-migrated");
    request.onsuccess = () => resolve(request.result === true);
    request.onerror = () => reject(request.error);
  });
  // Keep the old key intact, but do not resurrect imported notes after deletion.
  try {
    if (migrated)
      return items.sort((a, b) => b.created.localeCompare(a.created));
    const legacy = JSON.parse(
      localStorage.getItem("accesslens-reports-v1") || "[]",
    );
    for (const old of Array.isArray(legacy) ? legacy : []) {
      if (
        !old ||
        old.demo ||
        typeof old.id !== "number" ||
        typeof old.description !== "string"
      )
        continue;
      const id = `legacy-${old.id}`;
      if (items.some((item) => item.id === id)) continue;
      const route: RouteNote = {
        id,
        title: old.title || old.category,
        start: "",
        destination: old.location || "",
        area: "",
        created: old.date || new Date().toISOString(),
        status: old.status === "Resolved" ? "Resolved" : "Documented",
        observations: [
          {
            id,
            category: old.category || "Other",
            description: old.description,
            place: old.location || "",
            image: old.image,
            created: old.date || new Date().toISOString(),
          },
        ],
      };
      await storeRoute(route);
      items.push(route);
    }
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("meta", "readwrite");
      transaction.objectStore("meta").put(true, "legacy-migrated");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch {
    /* Existing routes remain accessible if legacy JSON is invalid. */
  }
  return items.sort((a, b) => b.created.localeCompare(a.created));
}
export async function storeRoute(route: RouteNote): Promise<void> {
  const db = await database;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("routes", "readwrite");
    transaction.objectStore("routes").put(route);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(
        new Error(
          "Could not save this route. Your browser may be out of storage.",
        ),
      );
    transaction.onabort = () =>
      reject(new Error("Saving was interrupted. Please try again."));
  });
}
export async function removeRoute(id: string): Promise<void> {
  const db = await database;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("routes", "readwrite");
    transaction.objectStore("routes").delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(new Error("Could not delete the route. Please try again."));
  });
}
export function draftMessage(route: RouteNote, recipient: string) {
  return `Hello ${recipient || "team"},\n\nI’m writing to document possible accessibility barriers along the route to ${route.destination}${route.area ? ` in ${route.area}` : ""}. I recorded these observations on ${new Date(route.created).toLocaleDateString(undefined, { dateStyle: "long" })}.\n\n${route.observations.map((item, index) => `${index + 1}. ${item.category} — ${item.place}\n${item.description}`).join("\n\n")}\n\nCould your office review these observations or direct me to the department or property owner responsible? I would appreciate information about possible next steps and how to follow up.\n\nThese are personal observations, rather than a compliance assessment. I can provide the accompanying photos.\n\nThank you for helping make our community easier to navigate.\n\n[Your name]`;
}
const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
export function downloadPacket(
  route: RouteNote,
  message: string,
  coordinates: boolean,
) {
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(route.title)} · AccessLens</title><style>body{font:16px/1.6 system-ui;color:#193d39;max-width:760px;margin:40px auto;padding:24px}h1{line-height:1.15}article{break-inside:avoid;border-top:1px solid #ddd;padding:24px 0}img{max-width:100%;max-height:450px;border-radius:16px}pre{font:inherit;white-space:pre-wrap;background:#f4f5ef;padding:24px;border-radius:16px}.muted{color:#626e6b}@media print{body{margin:0;padding:10px}}</style><p>ACCESSLENS · ${route.demo ? "ILLUSTRATIVE EXAMPLE" : "ACCESS STORY"}</p><h1>${escapeHtml(route.title)}</h1><p>${escapeHtml(route.start)} → ${escapeHtml(route.destination)}</p><p class="muted">${escapeHtml(route.area)} · ${escapeHtml(new Date(route.created).toLocaleDateString())} · ${route.observations.length} observations</p>${route.observations.map((item, index) => `<article><h2>${index + 1}. ${escapeHtml(item.category)}</h2><p>${escapeHtml(item.place)}</p>${item.image && /^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(item.image) ? `<img src="${item.image}" alt="${escapeHtml(item.category)}">` : ""}<p>${escapeHtml(item.description)}</p>${coordinates && item.coordinates ? `<p>${escapeHtml(item.coordinates)}</p>` : ""}</article>`).join("")}<h2>Message draft</h2><pre>${escapeHtml(message)}</pre><p class="muted">Personal observations; not a legal or accessibility compliance assessment. Nothing was sent automatically. ${route.demo ? "This is an illustrative example, not a real report." : ""}</p></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${route.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "access-story"}.html`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export function sampleRoute(): RouteNote {
  return {
    id: "example",
    title: "The last block to the library",
    start: "Bus stop",
    destination: "Community library",
    area: "An example neighborhood",
    created: new Date().toISOString(),
    status: "Documented",
    demo: true,
    observations: [
      {
        id: "one",
        category: "Blocked curb ramp",
        place: "Crosswalk near the bus stop",
        description:
          "A bin sits across the curb ramp, leaving little room to reach the crosswalk without entering the roadway.",
        created: new Date().toISOString(),
      },
      {
        id: "two",
        category: "Uneven surface",
        place: "Sidewalk outside the library",
        description:
          "A raised pavement edge interrupts the sidewalk on the approach to the entrance.",
        created: new Date().toISOString(),
      },
      {
        id: "three",
        category: "Stairs-only entrance",
        place: "Library front entrance",
        description:
          "The photographed approach has three steps. A step-free entrance is not visible from this point; staff could help confirm another entrance.",
        created: new Date().toISOString(),
      },
    ],
  };
}
