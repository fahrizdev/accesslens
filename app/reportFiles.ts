import type { BarrierReport } from "./reports.ts";

export function photoFile(report: BarrierReport): File | null {
  const match = report.image.match(
    /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/,
  );
  if (!match) return null;
  let bytes: Uint8Array<ArrayBuffer>;
  try {
    bytes = Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
  return new File(
    [bytes],
    `curb-photo.${match[1] === "jpeg" ? "jpg" : "png"}`,
    {
      type: `image/${match[1]}`,
    },
  );
}
export function downloadPhoto(report: BarrierReport) {
  const file = photoFile(report);
  if (!file) return;
  downloadBlob(file, file.name);
}
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}
const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function downloadReport(report: BarrierReport) {
  const photo = photoFile(report)
    ? `<img src="${report.image}" alt="Photo of the reported barrier">`
    : "";
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Curb — ${escapeHtml(report.category)}</title><style>body{max-width:700px;margin:40px auto;padding:24px;font:16px/1.6 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;color:#20211f}h1{font-size:32px;letter-spacing:-1px}img{max-width:100%;max-height:500px;border-radius:12px}pre{white-space:pre-wrap;font:inherit;background:#f5f5ef;padding:24px;border-radius:12px}small{color:#72736c}@media print{body{margin:0}}</style><small>CURB · ${escapeHtml(new Date(report.created).toLocaleDateString())}</small><h1>${escapeHtml(report.category)}</h1><p>${escapeHtml(report.place)}</p>${photo}<pre>${escapeHtml(report.summary)}</pre><small>Personal observation, not a compliance assessment. This file does not confirm delivery to an office.</small></html>`;
  downloadBlob(new Blob([html], { type: "text/html" }), "curb-report.html");
}
