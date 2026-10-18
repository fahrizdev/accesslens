import test from "node:test";
import assert from "node:assert/strict";
import { INTRO_DURATION, introFrame } from "../src/intro-timeline.ts";

test("the film keeps every scene bounded through the ending and after seeking", () => {
  for (let time = -100; time <= INTRO_DURATION + 500; time += 16) {
    const frame = introFrame(time);
    for (const [key, value] of Object.entries(frame)) {
      assert.ok(Number.isFinite(value), `${key} is finite at ${time}`);
    }
    for (const key of [
      "world",
      "walk",
      "capture",
      "report",
      "resolve",
      "flash",
    ]) {
      assert.ok(
        frame[key] >= 0 && frame[key] <= 1,
        `${key} stays bounded at ${time}`,
      );
    }
  }
  assert.equal(introFrame(0).world, 0);
  assert.equal(introFrame(INTRO_DURATION).resolve, 1);
  assert.equal(introFrame(INTRO_DURATION).caption, 3);
});

test("character position and scene transitions stay continuous at scene boundaries", () => {
  for (let time = 16; time <= INTRO_DURATION; time += 16) {
    const before = introFrame(time - 16);
    const after = introFrame(time);
    assert.ok(Math.abs(after.x - before.x) < 4);
    assert.ok(Math.abs(after.y - before.y) < 2);
    assert.ok(Math.abs(after.scale - before.scale) < 0.02);
    assert.ok(Math.abs(after.report - before.report) < 0.03);
  }
});
