# Jobsøgning

Public route: `https://extruda.dk/jobsoegning/`.

A curated snapshot reviewed on 7 November 2026. 46 listings: 44 within the 45-minute limit or provisionally estimated, one with changing/unknown work locations, and one measured at 48 minutes. The two latter records are excluded by the default travel filter. 38 records have a checked address or work at home; the remaining eight have estimated or unknown locations. This is not a complete inventory of Jobnet.

`jobs.json` is the public dataset; `data.js` contains the same object as a classic-script global so the page also works without fetch/module imports. Keep the two in sync. `index.html`, `styles.css` and `app.js` provide the interface; shared Extruda fonts, logo and header controls are loaded from the existing local asset paths.

Priority: `apply` (10), `clarify` (31), `reserve` (5). This is distinct from the 1–5 fit score. Education requirements, specialist gaps, unknown work locations and conflicting source information are retained in each record. No training arrangement is confirmed. The page offers Danish and English controls; original advert details and individual assessments remain in Danish and are labelled accordingly.

Public data contains no personal health information. The user's browser keeps saved jobs, workflow status, notes and filter selections in `extruda-jobsearch-private-v1`. They are never transmitted, bundled into public data or included in JSON exports. No server-side database, analytics, application submission or recurring automation exists. The page is publicly accessible and stored in this public repository; noindex/nofollow is not access control.

Validation: source/database consistency, data invariants, filtering, unknown/over-limit routes, empty state and export payload are checked with Node. Desktop dark and mobile light layouts, English UI, filters retained across language change, detail dialog, saved jobs and private notes retained after reload were checked in Edge. Mobile layout had no horizontal overflow. The browser-native download completion could not be verified because the browser tool's download wait stalled; the generated JSON payload is tested separately.
