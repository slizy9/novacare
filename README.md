# NOVACARE — Crew Health Self-Monitor

A NASA Space Apps Challenge prototype: a visual tool that lets astronauts on long missions log health indicators, see their status at a glance, and get clear steps on what to do and when to involve the crew or flight surgeons.

## Run it

No build step and no dependencies. Either open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765. It works fully offline and stores data in the browser (localStorage) — by design, since a Mars crew cannot depend on a link to Earth.

Sign in, create an account, or tap **Continue as guest** (guest data stays on the device and never syncs). New accounts start with no mission; a demo mission can be loaded from **Settings → Load demo mission**, and the **▸** button next to the mission day advances time during a demo.

Live at https://novacare.earth (GitHub Pages).

## What it does

- **Lobby** — you first: readiness, measurements due, main concern and radiation dose, then a short look at the mission (day, crew on track, emergencies, low supplies) and shortcuts to every section.
- **Personal** — *Overview* (profile, key vitals, **Add info** = check-in, **Questions**, the interactive body scan with real NASA OSDR studies per body system), *Today* (routine, XP, patches), *Vitals* (15 indicators with trends), *Hazards* (the five hazards of spaceflight) and *Medical profile* (allergies to medicines, materials and food; medication; conditions; blood type; notes).
- **Questions** — ask by text or voice (browser dictation). Answers come from your own readings, body systems, symptoms, your medical profile and the ship inventory, fully offline. "Can I take ibuprofen?" checks your allergies and what is on board. Red-flag phrases send you to emergency help.
- **Crew** — *Crewmates* (readiness, verdict, key vitals, main concern) and *Ship inventory* (add/update/use/remove items, low-stock warnings, CSV upload/download, one-click standard medical kit).
- **Emergency** — describe what is happening (text or voice, English or Spanish keywords) or pick one of 10 situations. NovaCare alerts the crew, opens the protocol checklist with a timer, shows the person's allergies, medication and latest readings, and lists **what to use from the ship inventory**, what is missing (with improvised alternatives) and **what must not be given** (allergies, blood thinners). "What medicine can I give?" is answered for that person.
- **Mission** — *Mission status* (mission day, crew readiness, roster, 7-day log, report export) and *Missions* (your missions, create, join with a code, and **All missions** — every mission people have created, with a Join button).
- **Analysis** — a verdict per astronaut with reasons, crew-wide patterns, a readiness comparison chart and the full indicator matrix.

People only appear in the missions they created or joined. A **simulated demo crew** of three synthetic astronauts (with predefined medical profiles) can be switched on or off in Mission settings.

## Database setup (Supabase)

1. Create a free project at https://supabase.com.
2. **SQL Editor → New query**: paste `supabase/setup.sql` and run it. It creates `profiles` (registered crew, with a role fixed at sign-up), `missions` (each person's data, including the medical profile), `mission_directory` (every mission people create, visible to all), `mission_members` (who is on which mission), `crew_status` (the summary crewmates see, one per person per mission), `alerts` (emergencies) and `inventory` (the shared ship inventory). Row Level Security keeps raw data private and limits crew data, alerts and inventory to members of the same mission. It is safe to re-run. If the project already had tables with these names from something else, run `supabase/rename_old_tables.sql` first.
3. **Authentication → Sign In / Providers → Email**: enabled. For a demo, turn off *Confirm email* so accounts work immediately.
4. **Project Settings → API**: copy the *Project URL* and the *anon public* key into `js/config.js`.
5. Host the folder on any static host (GitHub Pages, Netlify, Vercel). It must be served over https for offline mode to work.

Registered people appear in **Authentication → Users** and in the `profiles` table. Without step 4 the app runs in local-only mode.

## Offline sign-in (low signal)

- The **first** sign-in on a device, and creating an account, need a connection.
- After that, the device keeps a protected copy of the credentials (PBKDF2 hash, never the password), so the crew member can sign in with no signal.
- Readings always save on the device first. The header chip shows **Synced / Pending / No signal**; data uploads automatically when the link returns. If someone signed in without signal, the chip asks for their password once to resume syncing.
- If two devices edited the same account, the most recent save wins.
- The service worker caches the app, so the page itself opens with no connection after the first visit.

## Structure

- `js/data.js` — indicators, thresholds, guidance text, body systems, hazards, environments
- `js/config.js` — your Supabase URL and anon key
- `js/auth.js` — accounts, offline sign-in and cloud sync
- `js/vendor/supabase.js` — Supabase client, bundled so it loads with no signal
- `sw.js` — offline cache so the app opens without a connection
- `supabase/setup.sql` — database tables and security rules
- `js/missions.js` — missions (create, join by code, switch), the ship inventory and their screens
- `js/art.js` — illustrations drawn for the app: the interactive body scan, the crew portrait and the mission scenes
- `img/` — sign-in photo
- `js/medical.js` — medical profile, inventory-aware emergency plan, the Questions assistant and voice input
- `js/osdr.js` — offline snapshot of NASA OSDR studies per body system (rebuild with `python3 tools/osdr_snapshot.py`)
- `js/crew.js` — crew summaries, verdicts, crew-wide findings, simulated crew, emergency alerts and protocols
- `js/sections.js` — Crewmates, Mission status, Analysis and the emergency screens
- `js/icons.js` — SVG icon set
- `fonts/` — Fraunces and Inter (SIL OFL), bundled so the app works offline
- `js/engine.js` — state, status classification, trend rules, gamification
- `js/app.js` — rendering and interaction
- `css/styles.css` — styling

## Design notes

- **Look:** clinical premium and minimal — porcelain surfaces with hairline borders, one deep clinical teal for actions, muted status colours, Fraunces for titles and key numbers and Inter for everything else, a quiet side navigation and a matching dark mode (moon icon) for the sleep cycle.
- **Summarised by default:** each screen leads with the answer (e.g. "2 things need your attention today"), then the detail is one tap away — advisories open on demand, "Show more" for longer lists, system descriptions and the full indicator matrix behind disclosures.
- **Always current:** the service worker revalidates every file, so a new version shows up on the next load (the page reloads once when it does); the footer shows the version number.
- **Fluid:** the tab highlight glides to the section you pick and the new page slides in from that side (View Transitions where the browser supports them), key numbers count up on arrival, sheets slide in and out, and updates inside a section keep your scroll position instead of reloading the page. All motion turns off with the system "reduce motion" setting.
- **Accessible:** health status is always colour plus a symbol or word, text meets WCAG AA contrast in both themes, every control has a visible focus state.

## Disclaimer

Concept prototype, not a medical device. Reference ranges are simplified general adult values and the demo data is synthetic. Emergency steps are general first-aid guidance adapted for spaceflight; they support, and never replace, mission medical checklists and trained crew.
