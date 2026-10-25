import test from "node:test";
import assert from "node:assert/strict";
import { preparePhoto } from "../app/photos.ts";

test("photo preparation rejects unsupported files and oversize inputs before decoding", async () => {
  await assert.rejects(
    preparePhoto({ type: "text/plain", size: 1 }),
    /Choose an image/,
  );
  await assert.rejects(
    preparePhoto({ type: "image/jpeg", size: 21 * 1024 * 1024 }),
    /smaller than 20 MB/,
  );
});

test("photo bitmap resources close even when canvas preparation fails", async (t) => {
  let closed = false;
  const originalBitmap = globalThis.createImageBitmap;
  const originalDocument = globalThis.document;
  t.after(() => {
    if (originalBitmap === undefined) delete globalThis.createImageBitmap;
    else globalThis.createImageBitmap = originalBitmap;
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  });
  globalThis.createImageBitmap = async () => ({
    width: 2000,
    height: 1000,
    close: () => {
      closed = true;
    },
  });
  globalThis.document = { createElement: () => ({ getContext: () => null }) };
  await assert.rejects(
    preparePhoto({ type: "image/png", size: 1 }),
    /Could not open this image/,
  );
  assert.equal(closed, true);
});
