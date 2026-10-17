# AccessLens

Small steps. More open doors. A mobile-first accessibility journal built with React, TypeScript, and Vite for the Congressional App Challenge.

## Working features

- Warm welcome and area onboarding with GPS, public-address lookup, and manual fallback.
- Free district lookup using U.S. Census ACS2025 geography for the **119th Congress**, matched to the live House Clerk member directory. The Census Current geography already includes future 120th districts; this version deliberately avoids mixing those boundaries with current representatives. Update the selected vintage and district parser when Congress changes.
- Create a route, capture multiple barrier photos, edit observations, and track personal follow-up status.
- Images resized to 1400px and saved in IndexedDB on the user's device. Existing prototype observations migrate without deleting the old storage key.
- Editable contact message and self-contained HTML action packet with photos. GPS export is opt-in.
- Separate, clearly labeled example story; no fabricated reports or agency responses.
- Web manifest for home-screen use; no offline service worker yet.

## Run locally

```sh
npm ci
npm start
```

Open http://127.0.0.1:4173. This serves the production build plus the area endpoint. `npm run dev` starts Vite for UI-only work; use `npm start` to test the government lookup locally.

## Deploy free on Vercel

Import this GitHub repository into a personal Vercel Hobby project. Framework: Vite. Build: `npm run build`. Output: `dist`. The `api/area.js` function is deployed automatically. No environment variables, database subscription, or paid AI API are required for this version. Future pushes to the connected main branch redeploy it.

Open the production HTTPS URL on a phone. iPhone: Safari → Share → Add to Home Screen. Android: browser menu → Add to Home screen. Camera, location permission, downloads, and persistence should also be checked on the actual demo device.

## Current limits and privacy

This version stores routes on each browser/device; there are no accounts, cloud sync, public map, official case tracking, or automatic submissions. Clearing browser data can erase reports. Download important stories. Data saved on localhost does not automatically move to the production domain.

Area lookup sends an explicitly chosen public address or GPS position through the application server to the Census service. It is not stored by application code; infrastructure providers may retain normal request metadata. Member directory fetches contain no user location. No image is uploaded for analysis in the new UI. Writing assistance uses labeled templates and does not pretend to detect barriers.

The original `server.mjs` photo-assist endpoint is retained for the saved prototype only. It requires an OpenAI key and is **not deployed as a Vercel function**. The new zero-cost UI does not call it. Never add secrets to VITE-prefixed variables or commit `.env` files.

Government lookups can fail or return approximate results. Users confirm their area and verify the official contact. Congressional offices can help with advocacy/referrals; most local physical repairs need the relevant municipality, school, or property owner. Observations are not legal findings, compliance assessments, or navigation guarantees.

## Verification

```sh
npm run build
node --test tests/area.test.mjs
```

Deploy config: [Vercel Vite documentation](https://vercel.com/docs/frameworks/frontend/vite). Data: [Census geocoder](https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html), [House Clerk directory](https://clerk.house.gov/xml/lists/MemberData.xml).
