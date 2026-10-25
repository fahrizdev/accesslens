import test from "node:test";
import assert from "node:assert/strict";
import "fake-indexeddb/auto";
import { loadReports } from "../app/reportStorage.ts";

const seed = await new Promise((resolve, reject) => {
  const request = indexedDB.open("accesslens", 3);
  request.onupgradeneeded = () => {
    request.result.createObjectStore("routes", { keyPath: "id" });
    request.result.createObjectStore("reports", { keyPath: "id" });
    request.result.createObjectStore("meta");
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});
await new Promise((resolve, reject) => {
  const tx = seed.transaction(["routes", "reports"], "readwrite");
  tx.objectStore("routes").put({
    id: "old",
    observations: [
      null,
      { id: "one", description: "Old text", place: { invalid: true } },
      { description: "No original id" },
    ],
  });
  tx.objectStore("routes").put({ id: "broken", observations: "not an array" });
  tx.objectStore("reports").put({
    id: "imported-old-one",
    summary: "My edited original",
    place: "Park",
    category: "Other",
    note: "",
    image: "",
    created: "2026-10-19",
    status: "Draft",
  });
  tx.oncomplete = resolve;
  tx.onerror = () => reject(tx.error);
});
seed.close();

test("migration preserves previously edited imports and tolerates malformed legacy fields", async () => {
  const reports = await loadReports();
  assert.equal(reports.length, 2);
  assert.equal(
    reports.find((report) => report.id === "imported-old-one").summary,
    "My edited original",
  );
  assert.equal(
    reports.find((report) => report.id === "imported-old-2").place,
    "Location not recorded",
  );
  assert.equal((await loadReports()).length, 2);
});
