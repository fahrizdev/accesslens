import test from "node:test";
import assert from "node:assert/strict";
import {
  HOUSE_LOOKUP_URL,
  normalizeArea,
  officialContactUrl,
  lookupArea,
} from "../app/area.ts";

test("saved areas accept only official HTTPS House contact URLs", () => {
  for (const url of [
    "javascript:alert(1)",
    "http://clerk.house.gov/members/T000001",
    "https://house.gov.evil.example/",
    "https://house.gov@evil.example/",
    "https://user@house.gov/",
    "https://clerk.house.gov:444/",
  ]) {
    assert.equal(officialContactUrl(url), HOUSE_LOOKUP_URL);
  }
  assert.equal(
    officialContactUrl("https://clerk.house.gov/members/T000001"),
    "https://clerk.house.gov/members/T000001",
  );
  assert.equal(normalizeArea({ label: " " }), null);
  assert.deepEqual(
    normalizeArea({
      label: " Seattle ",
      representative: {},
      contactUrl: "javascript:alert(1)",
    }),
    { label: "Seattle", contactUrl: HOUSE_LOOKUP_URL },
  );
});

test("area lookup rejects malformed successful responses", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(JSON.stringify({ area: { label: 7 } }), { status: 200 }),
  );
  await assert.rejects(
    lookupArea({ address: "Public library" }),
    /Could not find this area/,
  );
});

test("area lookup sends the supplied query and validates the response", async (t) => {
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/area");
    assert.equal(options.method, "POST");
    assert.deepEqual(JSON.parse(options.body), { lat: 47, lng: -122 });
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json({
      area: { label: "Town", representative: "Test Member" },
    });
  });
  assert.equal(
    (await lookupArea({ lat: 47, lng: -122 })).representative,
    "Test Member",
  );
});
