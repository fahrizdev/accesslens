import test from "node:test";
import assert from "node:assert/strict";
import { greetingFor } from "../app/greeting.ts";

test("greeting changes at the right local hour", () => {
  for (const [hour, minute, period, text] of [
    [4, 59, "night", "Welcome back"],
    [5, 0, "morning", "Good morning"],
    [11, 59, "morning", "Good morning"],
    [12, 0, "afternoon", "Good afternoon"],
    [16, 59, "afternoon", "Good afternoon"],
    [17, 0, "evening", "Good evening"],
    [21, 59, "evening", "Good evening"],
    [22, 0, "night", "Welcome back"],
    [0, 0, "night", "Welcome back"],
  ]) {
    assert.deepEqual(greetingFor(new Date(2026, 9, 18, hour, minute)), {
      text,
      period,
    });
  }
});
