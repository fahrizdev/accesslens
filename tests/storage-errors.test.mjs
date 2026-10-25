import test from "node:test";
import assert from "node:assert/strict";
import { loadReports, saveReport, deleteReport } from "../app/reportStorage.ts";

const report = {
  id: "recovered",
  category: "Other",
  note: "A note",
  place: "Park",
  image: "",
  summary: "Saved message",
  created: "2026-10-19T12:00:00Z",
  status: "Draft",
};

test("unavailable storage rejects operations without breaking module imports and can recover", async () => {
  await assert.rejects(loadReports(), /Local storage is unavailable/);
  await import("fake-indexeddb/auto");
  await saveReport(report);
  assert.ok((await loadReports()).some((item) => item.id === report.id));
});

test("aborted saves and deletions reject instead of hanging or losing the report", async (t) => {
  const original = IDBDatabase.prototype.transaction;
  t.mock.method(IDBDatabase.prototype, "transaction", function (...args) {
    const tx = original.apply(this, args);
    if (args[0] === "reports" && args[1] === "readwrite")
      queueMicrotask(() => tx.abort());
    return tx;
  });
  await assert.rejects(
    saveReport({ ...report, summary: "Interrupted edit" }),
    /Could not save/,
  );
  await assert.rejects(deleteReport(report.id), /Could not delete/);
  assert.equal(
    (await loadReports()).find((item) => item.id === report.id).summary,
    "Saved message",
  );
});

test("invalid stored records do not prevent loading other reports", async () => {
  await saveReport({ id: "malformed", summary: {} });
  await saveReport({ ...report, id: "odd-date", created: 123 });
  const items = await loadReports();
  assert.ok(items.some((item) => item.id === "recovered"));
  assert.equal(
    items.some((item) => item.id === "malformed"),
    false,
  );
  assert.equal(items.find((item) => item.id === "odd-date").created, "");
});
