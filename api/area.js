// Free lookup using official government sources. Never log addresses or coordinates.
let directoryCache = { xml: "", until: 0 };
const tag = (xml, name) =>
  (
    xml.match(
      new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`),
    )?.[1] || ""
  )
    .replace(/&amp;/g, "&")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
export function parseArea(geographies, memberXml = "") {
  const state = geographies?.States?.[0];
  if (!state)
    throw new Error(
      "No U.S. area was found. Enter a nearby public street address or continue with your town.",
    );
  const place =
    geographies["Incorporated Places"]?.[0] ||
    geographies["Census Designated Places"]?.[0] ||
    geographies.Counties?.[0];
  // Pin to the serving 119th Congress; Current_Current already contains future 120th boundaries.
  const district = geographies["119th Congressional Districts"]?.[0];
  const stateCode = state.STUSAB;
  const number = district ? Number(district.BASENAME) : null;
  const districtId =
    number !== null && Number.isFinite(number)
      ? `${stateCode}${String(number).padStart(2, "0")}`
      : "";
  const member = [...memberXml.matchAll(/<member>([\s\S]*?)<\/member>/g)]
    .map((match) => match[1])
    .find((xml) => tag(xml, "statedistrict") === districtId);
  const name = member ? tag(member, "official-name") : "";
  const id = member ? tag(member, "bioguideID") : "";
  return {
    label: `${place?.BASENAME || state.BASENAME}${place ? `, ${stateCode}` : ""}`,
    district: districtId
      ? `${stateCode} · ${number === 0 ? "At-large district" : `Congressional District ${number}`} (119th Congress)`
      : undefined,
    representative: name || undefined,
    phone: member ? tag(member, "phone") || undefined : undefined,
    contactUrl:
      id && /^[A-Z]\d{6}$/.test(id)
        ? `https://clerk.house.gov/members/${id}`
        : "https://www.house.gov/representatives/find-your-representative",
    source: "U.S. Census ACS2025 boundaries; U.S. House Clerk directory",
  };
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  const send = (status, body) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(body));
  };
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(405, { error: "Use POST for location lookup." });
  }
  if (req.headers.origin) {
    try {
      if (new URL(req.headers.origin).host !== req.headers.host)
        return send(403, { error: "Request origin rejected." });
    } catch {
      return send(403, { error: "Request origin rejected." });
    }
  }
  try {
    let payload = req.body;
    if (payload === undefined) {
      let body = "";
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 4096)
          return send(413, { error: "Address is too long." });
      }
      payload = JSON.parse(body);
    } else if (typeof payload === "string") {
      if (payload.length > 4096)
        return send(413, { error: "Address is too long." });
      payload = JSON.parse(payload);
    }
    if (!payload || typeof payload !== "object" || Array.isArray(payload))
      return send(400, { error: "Enter an address or valid coordinates." });
    const { address, lat, lng } = payload;
    const params = new URLSearchParams({
      benchmark: "Public_AR_Current",
      vintage: "ACS2025_Current",
      format: "json",
    });
    let mode;
    if (
      typeof address === "string" &&
      address.trim().length >= 5 &&
      address.length <= 200
    ) {
      mode = "onelineaddress";
      params.set("address", address.trim());
    } else if (
      typeof lat === "number" &&
      typeof lng === "number" &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      mode = "coordinates";
      params.set("x", String(lng));
      params.set("y", String(lat));
    } else
      return send(400, {
        error:
          "Enter a public street address, city, and state, or use your location.",
      });
    const response = await fetch(
      `https://geocoding.geo.census.gov/geocoder/geographies/${mode}?${params}`,
      { signal: AbortSignal.timeout(15000) },
    );
    if (!response.ok)
      return send(502, {
        error:
          "The Census lookup is temporarily unavailable. Enter your town below to continue.",
      });
    const data = await response.json();
    const geographies =
      mode === "coordinates"
        ? data.result?.geographies
        : data.result?.addressMatches?.[0]?.geographies;
    if (!geographies?.States?.length)
      return send(404, {
        error:
          "No match found. Try a full public street address with city and state, or enter your town below.",
      });
    if (Date.now() > directoryCache.until) {
      try {
        const result = await fetch(
          "https://clerk.house.gov/xml/lists/MemberData.xml",
          { signal: AbortSignal.timeout(5000) },
        );
        if (result.ok)
          directoryCache = {
            xml: await result.text(),
            until: Date.now() + 3600000,
          };
      } catch {
        /* District can still be shown when the directory is offline. */
      }
    }
    return send(200, { area: parseArea(geographies, directoryCache.xml) });
  } catch (error) {
    return send(error instanceof SyntaxError ? 400 : 502, {
      error:
        error instanceof SyntaxError
          ? "Could not read this request."
          : "Location lookup is taking a break. Enter your town below to keep going.",
    });
  }
}
