import test from "node:test";
import assert from "node:assert/strict";
import "fake-indexeddb/auto";

const legacy = [
  {
    id: 42,
    category: "Missing signage",
    description: "An original note.",
    location: "Public park",
    date: "2026-10-16T00:00:00.000Z",
  },
];
globalThis.localStorage = {
  getItem: (key) =>
    key === "accesslens-reports-v1" ? JSON.stringify(legacy) : null,
};
const seed = await new Promise((resolve, reject) => {
  const request = indexedDB.open("accesslens", 2);
  request.onupgradeneeded = () => {
    request.result.createObjectStore("routes", { keyPath: "id" });
    request.result.createObjectStore("meta");
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});
await new Promise((resolve, reject) => {
  const tx = seed.transaction("routes", "readwrite");
  tx.objectStore("routes").put({
    id: "old-route",
    area: "Seattle, WA",
    destination: "Library",
    created: "2026-10-16T00:00:00.000Z",
    observations: [
      {
        id: "a",
        category: "Blocked curb ramp",
        description: "An existing photo note.",
        place: "Library corner",
        image: "data:image/jpeg;base64,YQ==",
      },
      {
        id: "b",
        category: "Uneven surface",
        description: "Second note.",
        place: "East entrance",
        image: "data:image/jpeg;base64,Yg==",
      },
    ],
  });
  tx.objectStore("routes").put({
    id: "demo-route",
    demo: true,
    observations: [{ id: "demo", description: "Not real" }],
  });
  tx.oncomplete = () => resolve();
  tx.onerror = () => reject(tx.error);
});
seed.close();
const { buildSummary, retargetSummary, followUpLabels } = await import(
  "../app/reports.ts"
);
const { loadReports, saveReport, deleteReport } = await import(
  "../app/reportStorage.ts"
);
const { photoFile, downloadReport } = await import("../app/reportFiles.ts");

test("imports old photos as reports and keeps the originals", async () => {
  const reports = await loadReports();
  assert.equal(reports.length, 3);
  assert.equal(
    reports.find((r) => r.id === "imported-old-route-a").image,
    "data:image/jpeg;base64,YQ==",
  );
  assert.equal(
    reports.find((r) => r.id === "imported-old-route-b").place,
    "East entrance",
  );
  assert.ok(reports.some((r) => r.id === "original-42"));
  const db = await new Promise((resolve) => {
    const r = indexedDB.open("accesslens");
    r.onsuccess = () => resolve(r.result);
  });
  const original = await new Promise((resolve) => {
    const r = db.transaction("routes").objectStore("routes").get("old-route");
    r.onsuccess = () => resolve(r.result);
  });
  assert.equal(original.observations.length, 2);
  db.close();
});
test("deleted imports stay deleted and reloads don’t make copies", async () => {
  await deleteReport("imported-old-route-a");
  assert.equal((await loadReports()).length, 2);
  assert.equal((await loadReports()).length, 2);
  assert.equal(
    (await loadReports()).some((r) => r.id === "imported-old-route-a"),
    false,
  );
});
test("editing a report updates the same saved record", async () => {
  const report = {
    id: "new-report",
    category: "Blocked curb ramp",
    note: "Bins block the ramp.",
    place: "Library entrance",
    image: "data:image/jpeg;base64,YQ==",
    created: new Date().toISOString(),
    summary: "My draft.",
    status: "Draft",
    followUp: "waiting",
  };
  await saveReport(report);
  await saveReport({ ...report, summary: "My edited draft." });
  const matches = (await loadReports()).filter((r) => r.id === "new-report");
  assert.equal(matches.length, 1);
  assert.equal(matches[0].summary, "My edited draft.");
  assert.equal(matches[0].followUp, "waiting");
});
test("follow-up labels describe user-reported outcomes", () => {
  assert.equal(followUpLabels["not-sent"], "Not sent");
  assert.equal(followUpLabels.sent, "Sent");
  assert.equal(followUpLabels.referred, "Referred elsewhere");
  assert.equal(followUpLabels.resolved, "Resolved");
});
test("report text uses the supplied details", () => {
  const message = buildSummary(
    "Blocked curb ramp",
    "Public library",
    "Bins block the ramp.",
    "47.61000, -122.33500",
    "Test Member",
  );
  assert.match(message, /Hello Representative Test Member/);
  assert.match(message, /Public library/);
  assert.match(message, /47.61000, -122.33500/);
  assert.ok(message.split(/\s+/).length < 90);
  assert.doesNotMatch(message, /ADA violation|legally|detected by AI/);
  assert.doesNotMatch(buildSummary("Other", "Park", "", ""), /\(\)/);
  assert.match(message, /Photo attached\./);
});
test("report text only mentions a photo when one is attached", () => {
  const message = buildSummary(
    "Missing signage",
    "Library",
    "",
    "",
    "",
    undefined,
    false,
  );
  assert.doesNotMatch(message, /Photo attached/);
  assert.match(message, /responsible\? Thank you\./);
});
test("makes a photo attachment and rejects unsafe URLs", async () => {
  const file = photoFile({ image: "data:image/jpeg;base64,YQ==" });
  assert.equal(file.type, "image/jpeg");
  assert.equal(file.name, "curb-photo.jpg");
  assert.equal(await file.text(), "a");
  assert.equal(photoFile({ image: "javascript:alert(1)" }), null);
});
test("reports keep the contact details they were created with", async () => {
  const sender = { name: "Sam Student", email: "sam@example.com" };
  const summary = buildSummary(
    "Blocked curb ramp",
    "Library",
    "Bins block it.",
    undefined,
    "Test Member",
    sender,
  );
  assert.ok(summary.endsWith("Thank you.\n\nSam Student\nsam@example.com"));
  assert.equal((summary.match(/sam@example.com/g) || []).length, 1);
  assert.doesNotMatch(
    buildSummary("Other", "Park", ""),
    /undefined|sam@example.com/,
  );
  await saveReport({
    id: "signature-test",
    category: "Other",
    note: "",
    place: "Library",
    image: "",
    created: new Date().toISOString(),
    summary,
    sender: { ...sender },
    status: "Draft",
  });
  sender.name = "Changed Later";
  const saved = (await loadReports()).find((r) => r.id === "signature-test");
  assert.equal(saved.sender.name, "Sam Student");
  assert.ok(saved.summary.endsWith("Sam Student\nsam@example.com"));
});
test("changing the representative keeps the rest of the message", () => {
  const edited =
    "Hello Representative Old Member,\n\nMy edited text.\n\nSam\nsam@example.com";
  assert.equal(
    retargetSummary(edited, "Old Member", "New Member"),
    "Hello Representative New Member,\n\nMy edited text.\n\nSam\nsam@example.com",
  );
  assert.equal(
    retargetSummary("Hello,\n\nMy text.", undefined, "New Member"),
    "Hello Representative New Member,\n\nMy text.",
  );
  assert.equal(
    retargetSummary(
      "Dear community team,\nMy personal draft.",
      "Old Member",
      "New Member",
    ),
    "Dear community team,\nMy personal draft.",
  );
});
test("download embeds the photo and escapes user text", async () => {
  const originalURL = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  const originalTimeout = globalThis.setTimeout;
  let blob;
  let clicked = false;
  URL.createObjectURL = (value) => {
    blob = value;
    return "blob:test";
  };
  URL.revokeObjectURL = () => {};
  globalThis.setTimeout = () => 0;
  globalThis.document = {
    createElement: () => ({
      click() {
        clicked = true;
      },
    }),
  };
  globalThis.window = { setTimeout: () => 0 };
  try {
    downloadReport({
      category: "<script>alert(1)</script>",
      place: "A & B",
      image: "data:image/jpeg;base64,YQ==",
      summary: "<img src=x onerror=alert(1)>",
      created: new Date().toISOString(),
    });
    const html = await blob.text();
    assert.equal(clicked, true);
    assert.match(html, /<title>Curb —/);
    assert.doesNotMatch(html, /AccessLens/);
    assert.match(html, /src="data:image\/jpeg;base64,YQ=="/);
    assert.match(html, /&lt;script&gt;/);
    assert.doesNotMatch(html, /<script>|<img src=x/);
  } finally {
    URL.createObjectURL = originalURL;
    URL.revokeObjectURL = originalRevoke;
    globalThis.setTimeout = originalTimeout;
    delete globalThis.document;
    delete globalThis.window;
  }
});
