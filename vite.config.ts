import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import areaHandler from "./api/area.js";

// Use the same lookup API in development, preview, and production.
function areaApi(): Plugin {
  const configure = (server: Pick<ViteDevServer, "middlewares">) => {
    server.middlewares.use((req, res, next) => {
      const pathname = req.url?.split("?")[0];
      if (pathname === "/api/area") {
        void areaHandler(req, res).catch(next);
      } else if (pathname?.startsWith("/api/")) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not found." }));
      } else next();
    });
  };
  return {
    name: "via-area-api",
    configureServer: configure,
    configurePreviewServer: configure,
  };
}

export default defineConfig({
  plugins: [react(), areaApi()],
  publicDir: "assets",
});
