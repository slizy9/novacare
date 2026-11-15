# NOVACARE — Crew Health Self-Monitor

A NASA Space Apps Challenge prototype: a visual tool that lets astronauts on long missions log health indicators, see their status at a glance, and get clear steps on what to do and when to involve the crew or flight surgeons.

## Run it

No build step and no dependencies. Either open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765. It works fully offline and stores data in the browser (localStorage) — by design, since a Mars crew cannot depend on a link to Earth.

Sign in, create an account, or tap **Continue as guest** (guest data stays on the device and never syncs). New accounts start with no mission; a demo mission can be loaded from **Settings → Load demo mission**. The mission day follows the calendar: day 1 is the mission's start date and a new day starts at local midnight (crewmates who join share the creator's start date).

Live at https://novacare.earth (GitHub Pages).

## What it does

- **Lobby** — you first: the check-in prompt and, beside it, **Add info**, **How do you feel** and **Questions**; then your plan to improve, readiness, measurements due, main concern and radiation dose, and a short look at the mission (day, crew on track, emergencies, low supplies). Predicted risks (*What’s ahead*) are in **Insights**.
- **Personal** — *Overview* (profile, key vitals, what to do about each finding, the interactive body scan with real NASA OSDR studies per body system), *Today* (routine, XP, patches), *Vitals* (15 indicators with trends), *Hazards* (the five hazards of spaceflight, most urgent first; each opens the charts of what NovaCare measures to catch it) and *Medical profile* (allergies to medicines, materials and food; medication; conditions; blood type; notes).
- **Questions** — ask by text or voice (browser dictation). Answers come from your own readings, body systems, symptoms, your medical profile and the ship inventory, fully offline. "Can I take ibuprofen?" checks your allergies and what is on board. Red-flag phrases send you to emergency help.
- **Crew** — *Crewmates* (readiness, verdict, key vitals, main concern) and *Ship inventory* (add/update/use/remove items, low-stock warnings, CSV upload/download, one-click standard medical kit).
- **Emergency** — describe what is happening (text or voice, English or Spanish keywords) or pick one of 10 situations. NovaCare alerts the crew, opens the protocol checklist with a timer, shows the person's allergies, medication and latest readings, and lists **what to use from the ship inventory**, what is missing (with improvised alternatives) and **what must not be given** (allergies, blood thinners). "What medicine can I give?" is answered for that person.
- **Mission** — *Mission status* (mission day, crew readiness, roster, 7-day log, report export) and *Missions* (your missions, create, join with a code, and **All missions** — every mission people have created, with a Join button).
- **Insights** — one expandable row per astronaut, most urgent first: open it for small charts of the last 30 days (heart rate, blood pressure, SpO₂, temperature, sleep, body mass — safe range shaded, hover for each reading), their medical results (ECG, urine test, ultrasound, CMO exam) and their open follow-ups. Below, one list of crew-wide patterns and risks ahead, and the readiness chart.

People only appear in the missions they created or joined, and the crew is made only of real registered people. Forgot your password? **Forgot password?** on the sign-in screen emails a reset link (in Supabase, Authentication → URL Configuration must list the site URL); on the ship server it asks for the crew reset code instead. Each person can add a profile photo (Settings, or tap the photo in My health).

## From data to action: recommendations, follow-up and discharge

- **Compared with you** (`js/insight.js`) — each reading is compared with the person's own baseline (pre-flight values from the medical profile, else their first mission week). Tolerances adapt to the medical profile (blood-pressure treatment, asthma, diabetes, beta-blockers, blood thinners) and to the mission phase (adaptation, steady, return).
- **Recommendations arrive as notifications** — a new finding becomes a *care case* and is announced under the bell (and as a system notification when allowed). Urgent ones arrive one by one; small ones are grouped into one reminder. Tapping opens a short sheet: where the follow-up stands, what changed, three steps, when to get help. The reasons, the onboard protocol (knowledge-base id and version) and the NASA sources are folded under "Why".
- **Follow-up until discharge** — each case schedules a re-check (today for critical, tomorrow for Attention, in 2 days for Watch) and reminds when it is due. A case is discharged when the measurement is back in the person's own range on 2 separate days; anything that needed the crew waits for the Crew Medical Officer to confirm. No new reading is never counted as improvement. Opening, follow-up steps and discharge are kept in the case and in the mission log. (Shared records travel with the last 7 days of alerts; each device keeps the approvals it has seen.)
- **Protocols are drafts until a medical officer approves them** — every onboard protocol (`KB-…`), emergency protocol (`EMG-…`), the medication rules (`RULES`) and the finding rules (`ANALYSIS`) starts as a draft. Answers, recommendations and emergency protocols say which they use and whether it is approved. The Crew Medical Officer approves from the mission log terminal: `/protocols` lists them, `/approve KB-MED-09 ISS Medical Checklist` approves one against a named document, `/revoke KB-MED-09` withdraws it. Approvals are shared with the crew through the alert channel and written to the mission log. A guest can approve for training, and it is labelled as not valid for real care.
- **Only the Crew Medical Officer discharges** — anyone else pressing discharge sends a review request to the crew. The officer sees each crewmate's open follow-ups on their card and signs the discharge there; it closes on the crewmate's device with the next sync.
- **My health stays short** — profile, key vitals and body scan first, then *Your care*: one line per open case. The improvement coach no longer has a card; its daily habit arrives as a reminder.
- **One source of truth** — readings, multi-day trends, readings outside the person's own normal, symptoms reported in *How do you feel* and early warnings from *What's ahead* are all findings, and every finding becomes a care case. A symptom is followed until 2 later status updates no longer report it. The crew summary, the verdicts in *Insights*, the improvement habit and readiness all read the same findings.
- **Calibrated alerts** — one reading in the attention band is something to watch; it becomes "tell the crew" only when the previous reading was out of range too. Readings in the danger band and multi-day trends keep their level. Systolic and diastolic make one blood-pressure finding. Predictions need data: bone loss is only estimated with at least 5 days of exercise logged.
- **Questions in the asker's language** — a question in Spanish is answered in Spanish (the onboard protocol text itself is still in English, and the answer says so). When a medicine question also names a symptom, the answer adds that symptom's protocol and a button to record it. New rule R-VIT-01: anti-inflammatories are a caution when today's blood pressure is high.
- **Recommendations read in order** — level and day, what happened in one line, the steps, when to get help; the comparison with the person's baseline and the protocol are under *Why*. A headache is one finding, not "pain in the head" and "headache".
- **Symptoms in the check-in** — *Anything bothering you?* lists the same symptoms as *How do you feel*. Symptoms that need detail (where it hurts, how bad, at rest or not) open only those follow-up questions after saving.
- **Readiness is explained** — the most serious open finding sets the band (ready, keep watch, needs attention, act now); every other finding lowers it a little. The text beside it says why, e.g. "Readiness 57 — 1 needs attention, 6 to watch". It is an operational status, not a clinical score.
- **Exams in the record** — ECG rhythm, urine dipstick, ultrasound and the Crew Medical Officer's physical exam are recorded like any measurement (Vitals → Log), marked as exam results, and open or close cases. They are never "due" until the first one is on record.
- **Protocols are linked by hand** — each finding points to the onboard protocol chosen for it; when there is no clear one, none is shown rather than a guess from a word search.
- **Care, not points** — the routine keeps its tasks, but XP, ranks and patches are gone. *Today* shows how complete the health record is (check-ins, follow-ups, discharges) and care milestones: medical profile, personal baseline, first discharge, exam on record, exercise and sleep kept.
- **Less to look at** — the body scan opens on the system of the most important follow-up, NASA research shows the 3 most relevant studies, and the key vitals with a follow-up come first.
- **Where a reading came from** — the check-in records self-measured, device or CMO exam; values copied with *Same as last time* are marked as carried over. A reading that jumps too far must be confirmed before it counts.
- **Emergencies** — the protocol names the patient and the rescuer, can read the steps aloud, times each ticked step, keeps progress if the window is closed, and saves a record to the mission log when resolved. The Help sheet opens the instructions directly, and the sign-in screen offers them with no account.
- **Calls for help reach the whole mission** — every crew member's device checks for alerts every 8 seconds while online, and an active one covers the screen until it is answered. Guests on the showcase mission NOVA-1 send and receive its alerts too, through `showcase_alerts` and `showcase_raise` in `supabase/setup.sql` (guests can only cancel guest alerts; at most 10 guest alerts per 10 minutes). Whoever asked for help can cancel it from the red bar or the *Help requested* button, with no dialog; resolving someone else's emergency asks for a second tap.
- **Help when alone** — after a critical reading NovaCare asks "Are you OK?" and alerts the crew after 60 s without an answer (Settings → Emergencies). Physical robotic assistance is not part of the prototype.
- **Works without Earth** — Settings → Data & sync runs a self-test of storage, the medication rules (a known allergy case), protocol search, analysis and the offline copy of the app.

## Restarting missions and the mission loadout

- **Restart every active mission on day 1:** run `supabase/setup.sql` (adds the `mission_epochs` table), then `supabase/restart_missions.sql` in the Supabase SQL editor. On the ship server: `node ship/server.js restart-missions`. Nothing is deleted on the database: each crew member's app moves what was recorded before (readings, mission log, follow-ups, decisions, status updates, emergency records) into an archive kept with their data (Settings → Raw data exports it), starts the mission again on day 1 and loads the mission loadout. Running it again on a later day restarts the missions again from that day.
- **Mission loadout:** every new or restarted mission gets an inventory of what the crew takes, scaled to crew size and mission length — food and contingency water, the medical kit plus monitoring and exam supplies, hygiene, safety and repair equipment, and personal items. Each item has a low-stock level of about two weeks of use. Quantities are prototype estimates from public figures for long-duration station missions; adjust them in Crew → Ship inventory. Items have fixed ids per mission, so two devices loading it at once do not duplicate it.

## How Questions answers (and why it cannot invent a dose)

NovaCare does not use a "trained" container. Three separate layers, all running on the ship's terminal with no internet:

1. **Rules engine — the authority** (`js/rules.js`, `js/medical.js`). Medication questions are decided here, before anything else: allergies from the medical profile (R-ALG), interactions with what the person takes and their conditions (R-INT, R-CON), stock in the ship inventory (R-STK), and reference doses — by body weight where it applies (paracetamol 15 mg/kg). Every line shows its rule id and its source. Thresholds, pre-flight baselines and red-flag symptoms are also rules.
2. **Onboard knowledge base — versioned, searched, not trained** (`js/kb.js`). Short protocols for medical problems, emotional wellbeing and ship failures (CO₂, fire, depressurisation, toxic leak, power, water, comms…), each with steps, when to escalate and its NASA source. Questions are matched by local search (BM25). The mission profile (environment, communication delay) and NASA OSDR evidence (`js/osdr.js`) complete it.
3. **Small local language model — wording only** (`js/llm.js`, optional). It rewords the protocols the search found, cites them as `[KB-…]`, and must reply "No onboard protocol — escalate" when they do not cover the question. It never receives medication questions.

If nothing in the knowledge base matches, NovaCare answers **"No onboard protocol for this question — escalate"** instead of guessing.

**Demo:** add penicillin to your allergies in the medical profile, then ask "Can I take amoxicillin?". The rules engine blocks it with `R-ALG-01` and its source, and says no language model was involved.

### Run everything on the terminal (docker-compose)

```bash
docker compose up -d
```

Then open http://localhost:8080. The first start downloads the images and the small model (`qwen2.5:1.5b`) once; after that the stack runs fully offline. Without the `llm` service the app still answers, showing the protocol text directly. The public website (novacare.earth) never calls a model.

The same command also starts the **ship server**, so crew accounts, alerts and the inventory work between devices with no internet (next section).

## Ship server (crew network, no internet)

On the website, crewmates reach each other through Supabase in the cloud. On a spacecraft that would mean one person's emergency never reaches another without a link to Earth. So `docker compose up -d` also runs `ship` (`ship/server.js`): a small crew database on the ship's own network. It serves the same tables and access rules as `supabase/setup.sql` — accounts, `missions`, `mission_directory`, `mission_members`, `crew_status`, `alerts`, `inventory` — and speaks the part of the Supabase API the app uses, so the app's sync code runs unchanged against it.

- **Switch:** `SHIP_SERVER_URL` in `js/config.js`. When set, sign-up, sign-in, sync, crew status, emergency alerts and the shared inventory all go to the ship server, and Supabase is not used. The docker `web` service serves `ship/config.js` (with `SHIP_SERVER_URL: 'ship/'`) in place of `js/config.js`, and nginx forwards `/ship/` to the server — one address and port for everything. The repository's `js/config.js` leaves it empty, so GitHub Pages / novacare.earth keep using Supabase as before.
- **Accounts live on the ship.** Creating an account and signing in work against the ship server alone: no email confirmation, no first sign-in against the cloud. After one sign-in, a device can still sign in on its own if the ship server is down (same device copy as below).
- **Forgotten password, no email:** *Forgot password?* opens the ship's reset page, which asks for the **crew reset code**. Whoever runs the terminal reads it with `docker compose logs ship` (or `docker compose exec ship node server.js code`). Choose your own with `SHIP_RESET_CODE=ABCD-1234 docker compose up -d`. A reset signs the person out on every device.
- **Data:** one SQLite file in the `ship-data` volume. Zero dependencies: Node 22's built-in SQLite. To run it without docker: `node ship/server.js` (port 8787, data in `ship/data/`).
- **Earth link:** not wired yet. While `SHIP_SERVER_URL` is set, nothing is copied to Supabase; the ship database is the record.

**Try it: two crew members, internet off**

1. On the ship terminal: `docker compose up -d`. Find its address on the crew network (for example `ipconfig getifaddr en0` on a Mac, `hostname -I` on Linux).
2. Disconnect the internet (keep the local Wi-Fi / network up).
3. Device A opens `http://<terminal-address>:8080`, **Register**s, then **Mission → Create a mission** and notes the code.
4. Device B opens the same address, registers, and joins with that code (or from **All missions**). Each now sees the other in the crew roster.
5. On A, tap **Help → I need help now → Alert the crew now**. Within about 8 seconds B gets the full-screen *"… needs help"* alert. `docker compose logs ship` shows the alert arriving.
6. On A, **Cancel request**: B's alert clears.

On a crew network the page is plain `http://`, which browsers treat as not secure: the app works, but the service worker (opening with no server at all) and the stronger device copy of the password (PBKDF2) need `https` or `localhost`. Put the terminal behind https on the ship network if that matters.

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
- `js/config.js` — the database: `SHIP_SERVER_URL` (ship server) or your Supabase URL and anon key
- `ship/` — the ship server (`server.js`), its reset page, the nginx config and the ship `config.js` used by `docker-compose.yml`
- `js/auth.js` — accounts, offline sign-in and cloud sync
- `js/vendor/supabase.js` — Supabase client, bundled so it loads with no signal
- `sw.js` — offline cache so the app opens without a connection
- `supabase/setup.sql` — database tables and security rules
- `js/missions.js` — missions (create, join by code, switch), the ship inventory and their screens
- `js/art.js` — illustrations drawn for the app: the interactive body scan, the crew portrait and the mission scenes
- `img/` — sign-in photo
- `js/medical.js` — medical profile, inventory-aware emergency plan, the Questions assistant and voice input
- `js/rules.js` — medication rules engine: allergies, interactions, conditions, stock, weight-based reference doses
- `js/kb.js` — onboard knowledge base (versioned protocols: medical, wellbeing, ship) and its local search
- `js/llm.js` — optional local language model (wording only), used by `docker-compose.yml`
- `js/status.js` — periodic status updates with follow-up questions, and "Ask crew for help"
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
