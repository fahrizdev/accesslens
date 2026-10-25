import {
  buildSummary,
  normalizeReport,
  sortReports,
  type BarrierReport,
} from "./reports.ts";

let database: Promise<IDBDatabase> | undefined;

function openDatabase(): Promise<IDBDatabase> {
  if (database) return database;
  const opening = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(
        new Error(
          "Local storage is unavailable. You can still prepare and share a report.",
        ),
      );
      return;
    }
    const request = indexedDB.open("accesslens", 3);
    let blocked = false;
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("routes"))
        db.createObjectStore("routes", { keyPath: "id" });
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
      if (!db.objectStoreNames.contains("reports"))
        db.createObjectStore("reports", { keyPath: "id" });
    };
    request.onsuccess = () => {
      const db = request.result;
      if (blocked) {
        db.close();
        return;
      }
      const reset = () => {
        db.close();
        if (database === opening) database = undefined;
      };
      db.onversionchange = reset;
      db.onclose = reset;
      resolve(db);
    };
    request.onerror = () =>
      reject(
        new Error(
          "Local storage is unavailable. You can still prepare and share a report.",
        ),
      );
    request.onblocked = () => {
      blocked = true;
      reject(
        new Error(
          "Close other Curb tabs, then reload to update your saved reports.",
        ),
      );
    };
  });
  database = opening;
  // Retry on the next operation if opening failed, without an unhandled rejection at import time.
  void opening.catch(() => {
    if (database === opening) database = undefined;
  });
  return opening;
}

function transactionDone(
  transaction: IDBTransaction,
  message: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = transaction.onabort = () =>
      reject(new Error(message));
  });
}

export async function saveReport(report: BarrierReport): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction("reports", "readwrite");
  tx.objectStore("reports").put(report);
  await transactionDone(
    tx,
    "Could not save on this device. Keep this tab open and download your report.",
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function legacyText(...values: unknown[]): string {
  return (
    values.find(
      (value): value is string => typeof value === "string" && !!value.trim(),
    ) || ""
  );
}

function legacyReports(routes: unknown[]): BarrierReport[] {
  const reports: BarrierReport[] = [];
  for (const route of routes) {
    if (!isRecord(route) || route.demo || !Array.isArray(route.observations))
      continue;
    route.observations.forEach((item, index) => {
      if (!isRecord(item) || typeof item.description !== "string") return;
      const category = legacyText(item.category) || "Other";
      const place =
        legacyText(item.place, route.destination, route.area) ||
        "Location not recorded";
      const coordinates = legacyText(item.coordinates) || undefined;
      reports.push({
        id: `imported-${route.id}-${item.id ?? index}`,
        category,
        place,
        coordinates,
        note: item.description,
        image: legacyText(item.image),
        created: legacyText(item.created, route.created),
        summary: buildSummary(category, place, item.description, coordinates),
        status: "Draft",
      });
    });
  }
  try {
    const legacy: unknown = JSON.parse(
      localStorage.getItem("accesslens-reports-v1") || "[]",
    );
    for (const old of Array.isArray(legacy) ? legacy : []) {
      if (
        !isRecord(old) ||
        old.demo ||
        typeof old.id !== "number" ||
        typeof old.description !== "string" ||
        routes.some(
          (route) => isRecord(route) && route.id === `legacy-${old.id}`,
        )
      )
        continue;
      const category = legacyText(old.category) || "Other";
      const place = legacyText(old.location) || "Location not recorded";
      reports.push({
        id: `original-${old.id}`,
        category,
        place,
        note: old.description,
        image: legacyText(old.image),
        created: legacyText(old.date),
        summary: buildSummary(category, place, old.description),
        status: "Draft",
      });
    }
  } catch {
    // Unreadable legacy data remains untouched; it must not block current reports.
  }
  return reports;
}

async function migrateReports(db: IDBDatabase): Promise<void> {
  const tx = db.transaction(["reports", "routes", "meta"], "readwrite");
  const meta = tx.objectStore("meta");
  const check = meta.get("single-reports-migrated");
  check.onsuccess = () => {
    if (check.result) return;
    const routes = tx.objectStore("routes").getAll();
    routes.onsuccess = () => {
      const store = tx.objectStore("reports");
      for (const report of legacyReports(routes.result)) {
        const existing = store.get(report.id);
        existing.onsuccess = () => {
          if (!existing.result) store.put(report);
        };
      }
      meta.put(true, "single-reports-migrated");
    };
  };
  await transactionDone(
    tx,
    "Could not open your saved reports. Your previous data has been preserved.",
  );
}

export async function loadReports(): Promise<BarrierReport[]> {
  const db = await openDatabase();
  await migrateReports(db);
  return new Promise((resolve, reject) => {
    const tx = db.transaction("reports");
    const request = tx.objectStore("reports").getAll();
    tx.oncomplete = () =>
      resolve(
        sortReports(
          request.result
            .map(normalizeReport)
            .filter((report): report is BarrierReport => report !== null),
        ),
      );
    tx.onerror = tx.onabort = () =>
      reject(new Error("Could not load saved reports."));
  });
}

export async function deleteReport(id: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction("reports", "readwrite");
  tx.objectStore("reports").delete(id);
  await transactionDone(tx, "Could not delete this report.");
}
