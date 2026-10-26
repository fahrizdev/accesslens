# AccessLens

Photo → place → brief report → share with your representative. A mobile-first accessibility reporting app built with React, TypeScript, and Vite for the Congressional App Challenge.

Live app: [accesslens-eta.vercel.app](https://accesslens-eta.vercel.app). Source: [fahrizdev/accesslens](https://github.com/fahrizdev/accesslens) (private).

The Vercel project is connected to this repository. Pushes to `main` automatically publish to the live app. Vercel's GitHub app is restricted to this repository.

## Working features

- Opening `/` or `/app` shows the centered glowing logo and reveals the bottom arrow after 1.1 seconds. The arrow opens the name, email, area, and ready setup directly, or home after setup. The animated film, character, doorway, and swipe introduction have been removed. Optional steps have one Skip for now control. Setup can be replayed from Settings; existing saved details and reports are preserved.
- Home has a time-aware greeting that refreshes while the app is open, one report action, an area summary, and recent reports. Navigation contains Home, Reports, and Settings.
- Responsive camera capture, report details, editable review, saved reports, settings, and bottom sheets share the new design. The installed web app starts at `/app`; both entry URLs continue to work.
- Name and email are saved locally and added to each new report’s sign-off. Settings supports editing/removing saved contact details; existing report snapshots keep their original signatures. Email format is checked, but inbox ownership/deliverability is not verified. This is not an email login, account, or mailing-list subscription.
- Free district lookup using U.S. Census ACS2025 geography for the **119th Congress**, matched to the live House Clerk member directory. The Census Current geography already includes future 120th districts; this version deliberately avoids mixing those boundaries with current representatives. Update the selected vintage and district parser when Congress changes.
- One photo per report. Choose a barrier type, enter a public location, optionally add a GPS pin and brief note, then generate an editable message.
- **Send report** opens native file sharing with the photo and signed report text. Users choose an app and complete addressing/sending; it does not automatically send or choose a From account. Entering an email in setup does not authenticate or grant permission to send from that inbox. Browser support varies. The app links to the verified House Clerk profile for the representative's official website/contact options. It does not guess an email address or post to government contact forms automatically.
- Copy-message and save-photo fallbacks for official contact forms; downloadable self-contained HTML document includes photo and text.
- Images resized to 1400px, with metadata removed by re-encoding, and saved in IndexedDB on the user's device. Existing multi-observation data is migrated into separate reports without deleting original records. Deleted imported reports do not reappear.
- The route/story interface has been removed. No fabricated office responses or delivery confirmations; “Shared” records a handoff to another app, not receipt by a representative.
- Web manifest for home-screen use; no offline service worker yet.

## Run locally

```sh
npm ci
npm start
```

Open http://127.0.0.1:4173/app. This serves the production build plus the area endpoint. `npm run dev` starts Vite for UI-only work; use `npm start` to test the government lookup locally.

## Deploy free on Vercel

Import this GitHub repository into a personal Vercel Hobby project. Framework: Vite. Build: `npm run build`. Output: `dist`. The `api/area.js` function is deployed automatically. No environment variables, database subscription, or paid AI API are required for this version. Future pushes to the connected main branch redeploy it.

Open the production HTTPS URL on a phone. iPhone: Safari → Share → Add to Home Screen. Android: browser menu → Add to Home screen. Camera, location permission, downloads, and persistence should also be checked on the actual demo device.

## Current limits and privacy

This version stores reports on each browser/device; there are no accounts, cloud sync, public map, official case tracking, or automatic submissions. Clearing browser data can erase reports. Download important reports. Data saved on localhost does not automatically move to the production domain.

Contact details stay local until included in a report the user shares. Removing the saved profile does not redact existing report text; users can edit or delete those separately. Setup checks email syntax only, not access to the inbox. The saved email is reply contact information, not a verified sender identity. Representative changes update a generated greeting without discarding user edits or signatures.

Area lookup sends an explicitly chosen public address or GPS position through the application server to the Census service. It is not stored by application code; infrastructure providers may retain normal request metadata. Member directory fetches contain no user location. No image is uploaded for analysis. Brief reports are generated from the user-selected barrier, location, and note; this version does not claim to analyze photos with AI. A GPS pin, if added, appears in the editable message and is shared with it.

The original `server.mjs` photo-assist endpoint is retained for the saved prototype only. It requires an OpenAI key and is **not deployed as a Vercel function**. The new zero-cost UI does not call it. Never add secrets to VITE-prefixed variables or commit `.env` files.

Government lookups can fail or return approximate results. Users confirm their area and verify the official contact. Congressional offices can help with advocacy/referrals; most local physical repairs need the relevant municipality, school, or property owner. Observations are not legal findings, compliance assessments, or navigation guarantees.

## Verification

```sh
npm run build
npm test
```

Deploy config: [Vercel Vite documentation](https://vercel.com/docs/frameworks/frontend/vite). Data: [Census geocoder](https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html), [House Clerk directory](https://clerk.house.gov/xml/lists/MemberData.xml).
