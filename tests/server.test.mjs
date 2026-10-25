import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { createAppServer } from "../server.mjs";

async function fixture(t, built = true) {
  const dist = await mkdtemp(join(tmpdir(), "via-server-test-"));
  if (built) {
    await writeFile(
      join(dist, "index.html"),
      "<!doctype html><title>Via test</title>",
    );
    await writeFile(join(dist, "manifest.webmanifest"), '{"name":"Via"}');
    await mkdir(join(dist, "assets"));
    await writeFile(join(dist, "assets", "app.js"), "console.log('test')");
  }
  const server = createAppServer({ dist });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(dist, { recursive: true });
  });
  return `http://127.0.0.1:${server.address().port}`;
}

test("server serves app routes, static assets, HEAD, and the manifest", async (t) => {
  const base = await fixture(t);
  for (const path of ["/", "/app", "/app/report/123"]) {
    const res = await fetch(base + path);
    assert.equal(res.status, 200);
    assert.match(await res.text(), /Via test/);
    assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  }
  const head = await fetch(base + "/assets/app.js", { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  assert.match(head.headers.get("content-type"), /javascript/);
  const manifest = await fetch(base + "/manifest.webmanifest");
  assert.equal(
    manifest.headers.get("content-type"),
    "application/manifest+json",
  );
  assert.equal((await manifest.json()).name, "Via");
});

test("missing assets and directories return 404 without crashing the server", async (t) => {
  const base = await fixture(t);
  for (const path of [
    "/assets",
    "/assets/missing.js",
    "/api/analyze",
    "/api/status",
  ]) {
    const res = await fetch(base + path);
    assert.equal(res.status, 404);
  }
  assert.equal((await fetch(base)).status, 200);
  const res = await fetch(base, { method: "POST" });
  assert.equal(res.status, 405);
  assert.equal(res.headers.get("allow"), "GET, HEAD");
});

test("server rejects malformed and escaping file paths", async (t) => {
  const base = await fixture(t);
  for (const path of ["/%zz", "/%00", "/..%2Foutside.txt"]) {
    assert.equal((await fetch(base + path)).status, 400);
  }
});

test("an unbuilt app returns a clear error and its API still handles validation", async (t) => {
  const base = await fixture(t, false);
  assert.equal((await fetch(base)).status, 503);
  assert.equal((await fetch(base + "/api/area")).status, 405);
  const res = await fetch(base + "/api/area", {
    method: "POST",
    body: JSON.stringify({ lat: 91, lng: 0 }),
  });
  assert.equal(res.status, 400);
});
