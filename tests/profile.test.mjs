import test from "node:test";
import assert from "node:assert/strict";
import { normalizeProfile, signature, validEmail } from "../src/profile.ts";

test("contact details normalize safely, including missing or old preferences", () => {
  assert.deepEqual(normalizeProfile(null), { name: "", email: "" });
  assert.deepEqual(normalizeProfile({ name: 42, email: {} }), {
    name: "",
    email: "",
  });
  assert.deepEqual(
    normalizeProfile({
      name: "  Sam Student  ",
      email: " student@example.com ",
    }),
    { name: "Sam Student", email: "student@example.com" },
  );
  assert.equal(
    normalizeProfile({ name: "A\nB", email: "a@example.com\r\n" }).name,
    "A B",
  );
  assert.equal(normalizeProfile({ name: "x".repeat(200) }).name.length, 80);
});

test("email validation checks format without pretending to verify an inbox", () => {
  for (const email of [
    "student@example.com",
    "sam+access@school.edu",
    "hello@sub.example.org",
  ])
    assert.equal(validEmail(email), true);
  for (const email of [
    "",
    "sam",
    "sam@",
    "sam@example",
    "a b@example.com",
    "a@example.com\nBcc:someone",
  ])
    assert.equal(validEmail(email), false);
});

test("signature includes only supplied details and omits invalid emails", () => {
  assert.equal(
    signature({ name: "Sam", email: "sam@example.com" }),
    "Sam\nsam@example.com",
  );
  assert.equal(signature({ name: "Sam", email: "not-an-email" }), "Sam");
  assert.equal(signature(), "");
});
