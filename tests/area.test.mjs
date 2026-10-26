import test from "node:test";
import assert from "node:assert/strict";
import handler, { parseArea } from "../api/area.js";
const geography = {
  States: [{ STUSAB: "WA", BASENAME: "Washington" }],
  "Incorporated Places": [{ BASENAME: "Seattle" }],
  "119th Congressional Districts": [{ BASENAME: "7" }],
};
test("matches only the current district to the official member directory", () => {
  const xml =
    "<members><member><statedistrict>WA07</statedistrict><member-info><official-name>Test &amp; Member</official-name><bioguideID>T000001</bioguideID><phone>(202) 555-0123</phone></member-info></member></members>";
  const area = parseArea(geography, xml);
  assert.equal(area.label, "Seattle, WA");
  assert.equal(area.representative, "Test & Member");
  assert.equal(area.contactUrl, "https://clerk.house.gov/members/T000001");
});
test("never matches future boundaries to currently serving members", () => {
  const { ["119th Congressional Districts"]: _, ...withoutCurrent } = geography;
  const area = parseArea({
    ...withoutCurrent,
    "120th Congressional Districts": [{ BASENAME: "7" }],
  });
  assert.equal(area.district, undefined);
  assert.equal(area.representative, undefined);
});
test("rejects positions outside supported U.S. geography", () =>
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
test("rejects invalid coordinates without external calls", async () => {
  const res = response();
  await handler(
    { method: "POST", headers: {}, body: { lat: 91, lng: 1 } },
    res,
  );
  assert.equal(res.statusCode, 400);
});
test("rejects browser cross-origin requests", async () => {
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
