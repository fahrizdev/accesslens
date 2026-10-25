import { createServer } from "node:http";
import { stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import areaHandler from "./api/area.js";

const defaultDist = fileURLToPath(new URL("./dist", import.meta.url));
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
};

function json(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
}

export function createAppServer({ dist = defaultDist } = {}) {
  dist = resolve(dist);
  return createServer(async (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Permissions-Policy",
      "geolocation=(self), camera=(self), microphone=()",
    );
    try {
      const url = new URL(req.url || "/", "http://localhost");
      if (url.pathname === "/api/area") return await areaHandler(req, res);
      if (url.pathname.startsWith("/api/"))
        return json(res, 404, { error: "Not found." });
      if (req.method !== "GET" && req.method !== "HEAD") {
        res.setHeader("Allow", "GET, HEAD");
        return json(res, 405, { error: "Use GET or HEAD for app files." });
      }
      let requested;
      try {
        requested = decodeURIComponent(url.pathname);
      } catch {
        return json(res, 400, { error: "Bad path." });
      }
      if (requested.includes("\0"))
        return json(res, 400, { error: "Bad path." });
      const appRoute =
        requested === "/" ||
        requested === "/app" ||
        requested.startsWith("/app/");
      const file = resolve(dist, `.${appRoute ? "/index.html" : requested}`);
      if (!file.startsWith(dist + sep))
        return json(res, 400, { error: "Bad path." });
      let info;
      try {
        info = await stat(file);
      } catch (error) {
        if (error.code !== "ENOENT" && error.code !== "ENOTDIR") throw error;
        return json(res, appRoute ? 503 : 404, {
          error: appRoute
            ? "Build the app first with npm run build."
            : "Not found.",
        });
      }
      if (!info.isFile()) return json(res, 404, { error: "Not found." });
      res.writeHead(200, {
        "Content-Type": mimeTypes[extname(file)] || "application/octet-stream",
        "Content-Length": info.size,
        "Cache-Control": "no-cache",
      });
      if (req.method === "HEAD") return res.end();
      const stream = createReadStream(file);
      stream.on("error", () => res.destroy());
      res.on("close", () => stream.destroy());
      stream.pipe(res);
    } catch {
      if (res.headersSent) res.destroy();
      else json(res, 500, { error: "Could not serve this request." });
    }
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const port = Number(process.env.PORT || 4173);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("PORT must be an integer between 0 and 65535.");
  }
  const server = createAppServer();
  server.on("error", (error) => {
    console.error(`Could not start Via: ${error.message}`);
    process.exitCode = 1;
  });
  server.listen(port, "127.0.0.1", () => {
    console.log(`Via running at http://localhost:${server.address().port}`);
  });
}
