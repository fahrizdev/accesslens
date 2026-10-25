import test from "node:test";
import assert from "node:assert/strict";
import handler, { parseArea } from "../api/area.js";
const geography = {
  States: [{ STUSAB: "WA", BASENAME: "Washington" }],
  "Incorporated Places": [{ BASENAME: "Seattle" }],
  "119th Congressional Districts": [{ BASENAME: "7" }],
};
test("finds the representative for the current district", () => {
  const xml =
    "<members><member><statedistrict>WA07</statedistrict><member-info><official-name>Test &amp; Member</official-name><bioguideID>T000001</bioguideID><phone>(202) 555-0123</phone></member-info></member></members>";
  const area = parseArea(geography, xml);
  assert.equal(area.label, "Seattle, WA");
  assert.equal(area.representative, "Test & Member");
  assert.equal(area.contactUrl, "https://clerk.house.gov/members/T000001");
});
test("skips future district boundaries", () => {
  const { ["119th Congressional Districts"]: _, ...withoutCurrent } = geography;
  const area = parseArea({
    ...withoutCurrent,
    "120th Congressional Districts": [{ BASENAME: "7" }],
  });
  assert.equal(area.district, undefined);
  assert.equal(area.representative, undefined);
});
test("rejects missing U.S. area data", () =>
  assert.throws(() => parseArea({}), /No U.S. area/));
function response() {
  return {
    headers: {},
    setHeader(k, v) {
      this.headers[k] = v;
    },
    end(body) {
      this.body = JSON.parse(body);
    },
  };
}
test("rejects invalid coordinates before lookup", async () => {
  const res = response();
  await handler(
    { method: "POST", headers: {}, body: { lat: 91, lng: 1 } },
    res,
  );
  assert.equal(res.statusCode, 400);
});
test("rejects requests from another site", async () => {
  const res = response();
  await handler(
    {
      method: "POST",
      headers: { origin: "https://other.example", host: "accesslens.example" },
      body: {},
    },
    res,
  );
  assert.equal(res.statusCode, 403);
});

test("rejects methods, malformed JSON, array payloads, and oversized bodies", async () => {
  for (const [request, status] of [
    [{ method: "GET", headers: {} }, 405],
    [{ method: "POST", headers: {}, body: "{" }, 400],
    [{ method: "POST", headers: {}, body: [] }, 400],
    [{ method: "POST", headers: {}, body: '"' + "x".repeat(5000) + '"' }, 413],
    [
      {
        method: "POST",
        headers: {},
        body: { address: "Public library", extra: "x".repeat(5000) },
      },
      413,
    ],
    [
      {
        method: "POST",
        headers: { origin: "ftp://same.example", host: "same.example" },
        body: {},
      },
      403,
    ],
  ]) {
    const res = response();
    await handler(request, res);
    assert.equal(res.statusCode, status);
  }
});

test("ignores malformed district identifiers instead of mapping them to at-large", () => {
  for (const BASENAME of ["", " ", "not-a-district", "7.5", "-1"]) {
    const area = parseArea({
      ...geography,
      "119th Congressional Districts": [{ BASENAME }],
    });
    assert.equal(area.district, undefined);
  }
  assert.match(
    parseArea({
      ...geography,
      "119th Congressional Districts": [{ BASENAME: "00" }],
    }).district,
    /At-large/,
  );
});

test("decodes streamed Unicode requests without corrupting split characters", async (t) => {
  const address = "Bibliothèque, Seattle, WA";
  const bytes = Buffer.from(JSON.stringify({ address }));
  const split = bytes.indexOf(Buffer.from("è")) + 1;
  t.mock.method(globalThis, "fetch", async (url) => {
    if (String(url).includes("geo.census.gov")) {
      assert.equal(new URL(url).searchParams.get("address"), address);
      return Response.json({
        result: { addressMatches: [{ geographies: geography }] },
      });
    }
    return new Response("", { status: 503 });
  });
  const req = {
    method: "POST",
    headers: {},
    async *[Symbol.asyncIterator]() {
      yield bytes.subarray(0, split);
      yield bytes.subarray(split);
    },
  };
  const res = response();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.area.label, "Seattle, WA");
});

test("lookup degrades gracefully when Census or the directory is unavailable", async (t) => {
  const mockFetch = t.mock.method(
    globalThis,
    "fetch",
    async () => new Response("", { status: 503 }),
  );
  const request = { method: "POST", headers: {}, body: { lat: 47, lng: -122 } };
  let res = response();
  await handler(request, res);
  assert.equal(res.statusCode, 502);
  mockFetch.mock.mockImplementation(async (url) => {
    if (String(url).includes("geo.census.gov"))
      return Response.json({ result: { geographies: geography } });
    throw new Error("offline");
  });
  res = response();
  await handler(request, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.area.representative, undefined);
  assert.match(res.body.area.contactUrl, /find-your-representative/);
});
