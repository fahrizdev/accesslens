import test from "node:test";
import assert from "node:assert/strict";
import {
  createDraft,
  normalizeReport,
  reportStatusLabel,
  displayDate,
} from "../app/reports.ts";
import { photoFile } from "../app/reportFiles.ts";

const details = {
  category: "Blocked curb ramp",
  note: "Bins block the ramp.",
  place: "Library",
  image: "data:image/jpeg;base64,YQ==",
  recipient: { label: "Town", representative: "Old Member" },
};
const sender = { name: "Original Sender", email: "original@example.com" };

test("regenerating an unchanged draft retains its sender, id, date, and follow-up", () => {
  const original = {
    ...createDraft(details, sender, "draft-1"),
    followUp: "waiting",
    status: "Shared",
  };
  const revised = createDraft(
    { ...details, place: "Park" },
    { name: "New Sender", email: "new@example.com" },
    original.id,
    original,
  );
  assert.match(revised.summary, /Location: Park/);
  assert.match(revised.summary, /Original Sender/);
  assert.doesNotMatch(revised.summary, /New Sender/);
  assert.deepEqual(revised.sender, sender);
  assert.equal(revised.created, original.created);
  assert.equal(revised.id, original.id);
  assert.equal(revised.followUp, "waiting");
  assert.equal(revised.status, "Shared");
});

test("regenerating an edited message preserves it and only retargets a known greeting", () => {
  const original = {
    ...createDraft(details, sender, "draft-2"),
    summary: "Hello Representative Old Member,\n\nMy carefully edited message.",
  };
  const revised = createDraft(
    {
      ...details,
      note: "Updated note",
      recipient: { label: "Elsewhere", representative: "New Member" },
    },
    sender,
    original.id,
    original,
  );
  assert.equal(
    revised.summary,
    "Hello Representative New Member,\n\nMy carefully edited message.",
  );
  const custom = {
    ...original,
    summary: "Dear park staff,\n\nPlease keep this wording.",
  };
  assert.equal(
    createDraft(details, sender, custom.id, custom).summary,
    custom.summary,
  );
});

test("editing legacy unsigned reports does not add the current profile", () => {
  const old = {
    ...createDraft(details, { name: "", email: "" }, "legacy"),
    sender: undefined,
  };
  const revised = createDraft(details, sender, old.id, old);
  assert.equal(revised.sender, undefined);
  assert.doesNotMatch(revised.summary, /Original Sender/);
});

test("malformed stored report fields cannot crash the report list", () => {
  assert.equal(normalizeReport(null), null);
  assert.equal(normalizeReport({ id: "bad", summary: {} }), null);
  const cleaned = normalizeReport({
    id: "old",
    summary: "Saved text",
    created: 42,
    place: {},
    category: [],
    followUp: "constructor",
    recipient: { label: "Town", representative: {} },
  });
  assert.equal(cleaned.category, "Other");
  assert.equal(cleaned.place, "Location not recorded");
  assert.equal(cleaned.followUp, undefined);
  assert.equal(cleaned.recipient.representative, undefined);
  assert.equal(displayDate(cleaned.created), "Date unavailable");
});

test("follow-up labels remain visible for legacy inconsistent status fields", () => {
  assert.equal(
    reportStatusLabel({ status: "Draft", followUp: "waiting" }),
    "Waiting for a reply",
  );
  assert.equal(reportStatusLabel({ status: "Shared" }), "Shared via an app");
});

test("malformed base64 is rejected without crashing sharing or downloads", () => {
  for (const image of [
    "data:image/jpeg;base64,A",
    "data:image/png;base64,====",
    "data:image/png;base64,a=b=",
    "https://example.com/photo.jpg",
  ]) {
    assert.equal(photoFile({ image }), null);
  }
});
