# NOVACARE — Crew Health Self-Monitor

A NASA Space Apps Challenge prototype: a visual tool that lets astronauts on long missions log health indicators, see their status at a glance, and get clear steps on what to do and when to involve the crew or flight surgeons.

## Run it

No build step and no dependencies. Either open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765. It works fully offline and stores data in the browser (localStorage) — by design, since a Mars crew cannot depend on a link to Earth.

The app opens with a 33-day demo mission. Use **Settings (environment chip) → Start a new mission** for an empty one, and the **▸** button next to the mission day to advance time during a demo.

## What it does

After signing in, NOVACARE opens on the **Lobby** and has four more sections:

- **Lobby** — the main hub. It lists your missions: **create a mission** (name, environment, planned length) to get a code to share, **join with a code** a crewmate gave you, switch between missions or leave one. Each mission keeps its own readings, crew and ship inventory. The logo and the keys 1–5 also switch sections.
- **Personal** — your profile, key vitals, health shortcuts, an interactive body scan of the seven body systems and your readiness score (Overview); today's routine, XP and patches (Today); all 15 indicators with trends (Vitals); and the five hazards of spaceflight (Hazards). Start a guided check-in from any of them.
- **Crew** — two tabs. *Ship inventory*: what the ship carries (medical, food and water, equipment, hygiene), with quantities the crew can add, update, use (+/−) or remove, a low-stock warning per item, and CSV upload/download (`name, category, quantity, unit, minimum, note`). *Crewmates*: every crew member on the same mission code: readiness, verdict, key vitals, main concern and whether they checked in today. **Emergency** opens a guided flow: pick what is happening (10 situations, e.g. unresponsive, trouble breathing, chest pain, bleeding, head injury), the crew is alerted, and NOVACARE shows a step checklist with a timer next to that person's latest readings and warning signs. Alerts work offline and reach the crew when the link returns.
- **Mission status** — mission day of the planned length, crew readiness, on-track count, open advisories and check-ins, a crew readiness chart, the roster and a 7-day mission log. It updates every mission day (**Advance to MD …**) and exports a mission report.
- **Analysis** — a verdict for each astronaut (On track / Watch / Needs attention / At risk) with reasons, crew-wide patterns (shared cabin CO₂, possible infection, sleep, exercise, mood, missed check-ins, radiation), a readiness comparison chart and a status matrix of every indicator.

Crewmates join the same mission with its **mission code** — at registration (default `NOVA-1`) or later from the Lobby. A **simulated demo crew** of three synthetic astronauts, clearly labelled, can be switched on or off in Mission settings so the crew views have data in a demo.

## Database setup (Supabase)

1. Create a free project at https://supabase.com.
2. **SQL Editor → New query**: paste `supabase/setup.sql` and run it. This creates `profiles` (registered crew), `missions` (each person's data), `crew_status` (the summary crewmates see) and `alerts` (emergencies) and `inventory` (the shared ship inventory). Row Level Security keeps raw data private and limits crew data and alerts to people on the same mission code. If you ran an earlier version, run it again: it is safe to re-run.
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
- `js/crew.js` — crew summaries, verdicts, crew-wide findings, simulated crew, emergency alerts and protocols
- `js/sections.js` — Crewmates, Mission status, Analysis and the emergency screens
- `js/icons.js` — SVG icon set
- `fonts/` — Fraunces and Inter (SIL OFL), bundled so the app works offline
- `js/engine.js` — state, status classification, trend rules, gamification
- `js/app.js` — rendering and interaction
- `css/styles.css` — styling

## Design notes

- **Look:** icy glass surfaces, navy type and a pink accent, with Inter throughout. An animated tab bar: a coloured bubble glides to the active section (each section has its own colour, which also tints the page). A dark mode (moon icon in the header) suits the sleep cycle; the choice is remembered per device.
- **Summarised by default:** each screen leads with the answer (e.g. "2 things need your attention today"), then the detail is one tap away — advisories open on demand, "Show more" for longer lists, system descriptions and the full indicator matrix behind disclosures.
- **Fluid:** the tab highlight glides to the section you pick and the new page slides in from that side (View Transitions where the browser supports them), key numbers count up on arrival, sheets slide in and out, and updates inside a section keep your scroll position instead of reloading the page. All motion turns off with the system "reduce motion" setting.
- **Accessible:** health status is always colour plus a symbol or word, text meets WCAG AA contrast in both themes, every control has a visible focus state.

## Disclaimer

Concept prototype, not a medical device. Reference ranges are simplified general adult values and the demo data is synthetic. Emergency steps are general first-aid guidance adapted for spaceflight; they support, and never replace, mission medical checklists and trained crew.
