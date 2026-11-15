/* NOVACARE — crew: crewmate summaries, simulated demo crew, emergency alerts and protocols.
   Engine functions read the global `state`, so another astronaut is evaluated by swapping
   their mission data in for a moment (withState). */

/* Profile photos: each person uploads their own (state.photo, a small JPEG kept with their data).
   A few crew members have one set for them until they choose their own; 'none' means no photo. */
const KNOWN_PHOTOS = { 'bruno llobet chanto': 'img/crew/bruno-llobet-chanto.jpg' };
const normName = (n) => String(n || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim().replace(/\s+/g, ' ');
function photoFor(name, own) { if (own === 'none') return ''; return own || KNOWN_PHOTOS[normName(name)] || ''; }

/* Mission NOVA-1 is the shared showcase mission: the guest (Bruno) is on it, registered people can
   join it, and visitors browsing as guest see those real crew members (without their medical data).
   It has a fixed start date so everyone on it is on the same mission day. */
const SHOWCASE = { code: 'NOVA-1', name: 'Mission NOVA-1', start: '2026-10-12', days: 180 };

/* The mission log was reset at this moment: earlier alerts, notes and log lines are left out. */
const LOG_EPOCH = '2026-11-15T03:10:00Z';

const DEFAULT_CREW = 'NOVA-1'; // legacy default mission code (new accounts start with no mission)
const ROLES = ['Commander', 'Pilot', 'Flight Engineer', 'Mission Specialist', 'Crew Medical Officer', 'Payload Specialist'];

const Crew = (() => {
  function withState(s, fn) {
    const prev = state; state = s;
    try { return fn(); } finally { state = prev; }
  }

  /* ---------- simulated demo crew ----------
     Deterministic per day, so the same mission day always shows the same values
     and advancing the day adds new readings instead of rewriting history. */
  const SIM = [
    { id: 'sim:tanaka', name: 'Mei Tanaka', role: 'Commander', seed: 11, base: { sys: 114, dia: 72, hr: 56, sleep: 7.1, mood: 4, stress: 2, water: 2.4, ex: 125, mass: 61 } },
    { id: 'sim:okafor', name: 'Samuel Okafor', role: 'Crew Medical Officer', seed: 23, base: { sys: 121, dia: 78, hr: 61, sleep: 6.6, mood: 4, stress: 2, water: 2.1, ex: 115, mass: 82 }, bpDrift: 0.45, lapse: [1, 5, 15] },
    { id: 'sim:fischer', name: 'Lena Fischer', role: 'Flight Engineer', seed: 37, base: { sys: 110, dia: 70, hr: 59, sleep: 6.9, mood: 4, stress: 2, water: 2.3, ex: 118, mass: 66 }, fever: [14, 17, 19] },
  ];
  function rng(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const inCycle = (d, c) => c && (d % c[2]) >= c[0] && (d % c[2]) <= c[1];
  const cabinCo2 = (d) => { const r = rng(9001 + d); return (d % 12 >= 9 ? 3.7 : 2.5) + (r() - 0.5) * 0.4; }; // shared cabin air

  function simDay(p, d, envKey, partial) {
    const r = rng(p.seed * 100003 + d * 7919); const b = p.base; const e = ENVIRONMENTS[envKey] || ENVIRONMENTS.iss;
    const n = (mean, sd) => mean + (r() + r() + r() - 1.5) * sd * 1.15;
    const rd = (v, step) => Math.round(v / step) * step;
    const fever = inCycle(d, p.fever), lapse = inCycle(d, p.lapse);
    const v = {};
    v.sys = Math.round(n(b.sys + (p.bpDrift ? Math.min(18, d * p.bpDrift) : 0), 3.5));
    v.dia = Math.round(n(b.dia + (p.bpDrift ? Math.min(8, d * p.bpDrift * 0.4) : 0), 2.5));
    v.hr = Math.round(fever ? n(106, 3) : n(b.hr + Math.min(6, d * 0.12), 2.5));
    v.spo2 = Math.min(100, Math.round(n(fever ? 95.8 : 97.6, 0.7)));
    v.temp = rd(fever ? n(38.4, 0.15) : n(36.6, 0.15), 0.1);
    if (d % 3 === 1) v.glu = Math.round(n(88, 4));
    v.sleep = rd(n(fever ? 5.3 : b.sleep, 0.45), 0.5);
    v.mood = fever ? 3 : (r() < 0.15 ? b.mood - 1 : r() < 0.15 ? Math.min(5, b.mood + 1) : b.mood);
    v.stress = fever ? 3 : (r() < 0.2 ? b.stress + 1 : b.stress);
    v.water = rd(n(b.water, 0.3), 0.1);
    v.exercise = rd(lapse ? n(e.exTarget * 0.3, 8) : fever ? n(e.exTarget * 0.4, 10) : n(b.ex, 12), 5);
    if (d % 7 === 1) v.mass = +(b.mass - d * 0.03).toFixed(1);
    if (d % 7 === 1) v.vision = 0;
    v.rad = rd(n(e.rad, e.rad * 0.15), 0.01);
    v.co2 = rd(cabinCo2(d), 0.1);
    for (const k in v) v[k] = +(+v[k]).toFixed(IND[k].dec);
    const tasks = {};
    ['vitd', 'social', 'wind'].forEach((t) => { if (r() < (fever ? 0.4 : 0.85)) tasks[t] = true; });
    if (partial) { // today: morning check-in may not be done yet
      const did = r() < 0.7;
      if (!did) ['sys', 'dia', 'hr', 'spo2', 'temp', 'sleep', 'mood', 'stress'].forEach((k) => { delete v[k]; });
      ['water', 'exercise', 'glu', 'mass', 'vision', 'rad'].forEach((k) => { if (r() < 0.5) delete v[k]; });
      Object.keys(tasks).forEach((k) => { if (r() < 0.6) delete tasks[k]; });
    }
    return { vals: v, tasks };
  }

  function simState(p, md, envKey) {
    const s = { v: 1, name: p.name, env: envKey, md, days: {}, demo: true, sim: true };
    for (let d = 1; d <= md; d++) s.days[d] = simDay(p, d, envKey, d === md);
    return s;
  }

  /* ---------- summaries ---------- */
  function summarize(s, meta) {
    return withState(s, () => {
      const md = s.md; const adv = Engine.advisories();
      const days = [];
      let prevKeys = null;
      const from = Math.max(1, md - 29);
      for (let d = Math.max(1, from - 1); d <= md; d++) {
        const sd = { ...s, md: d };
        const r = withState(sd, () => {
          const a = d >= md - 10 ? Engine.advisories() : null;
          return { score: Engine.readiness(), checkedIn: Engine.checkedIn(sd.days[d]), adv: a };
        });
        const keys = r.adv ? r.adv.map((a) => a.key) : null;
        const fresh = r.adv && prevKeys ? r.adv.filter((a) => !prevKeys.includes(a.key)).map((a) => ({ title: a.title, level: a.level })) : [];
        prevKeys = keys;
        if (d >= from) days.push({ md: d, score: r.score, checkedIn: r.checkedIn, newAdv: fresh });
      }
      const latest = {};
      INDICATORS.forEach((i) => { const st = Engine.status(i.id); latest[i.id] = { v: st.v, level: st.stale ? -1 : st.level, md: st.md }; });
      const systems = {};
      SYSTEMS.forEach((x) => { systems[x.id] = Engine.systemLevel(x.id); });
      const last7 = days.slice(-7);
      return {
        id: meta.id, name: meta.name || s.name || 'Crew member', role: meta.role || '', sim: !!meta.sim, me: !!meta.me,
        photo: photoFor(meta.name || s.name, s.photo),
        md, env: s.env, readiness: Engine.readiness(), days, latest, systems,
        advisories: adv.map((a) => ({ key: a.key, title: a.title, level: a.level, trend: !!a.trend, ind: a.ind, detail: a.detail, who: a.esc.who })),
        dose: Engine.cumulativeDose(), checkedInToday: Engine.checkedIn(s.days[md]),
        med: typeof Medical !== 'undefined' ? Medical.of(s, meta.sim ? meta.id : null) : null, // allergies etc., for the emergency flow
        predict: typeof Predict !== 'undefined' ? Predict.all().filter((p) => p.level > 0).slice(0, 3).map(({ key, title, level, text, when, now, future }) => ({ key, title, level, text, when, now, future })) : [], // risks ahead
        compliance: last7.length ? last7.filter((x) => x.checkedIn).length / last7.length : 0,
        updatedAt: meta.updatedAt || new Date().toISOString(), cached: !!meta.cached,
      };
    });
  }

  /* ---------- crew roster ---------- */
  const simCache = {};
  function simSummaries() {
    const key = `${state.md}|${state.env}`;
    if (!simCache[key]) simCache[key] = SIM.map((p) => summarize(simState(p, state.md, state.env), { id: p.id, name: p.name, role: p.role, sim: true }));
    return simCache[key];
  }

  function localMates() { // other accounts on this device with the same mission code
    const me = Auth.user(); let all = {};
    try { all = JSON.parse(localStorage.getItem('novacare.accounts')) || {}; } catch (e) { /* ignore */ }
    return Object.entries(all).filter(([id, a]) => id !== me.id && me.crew && a.crew === me.crew).map(([id, a]) => {
      let s = null; try { s = JSON.parse(localStorage.getItem(`${STORE_KEY}:${id}`)); } catch (e) { /* ignore */ }
      return s && s.days ? summarize(s, { id, name: a.name, role: a.role }) : null;
    }).filter(Boolean);
  }

  function cloudMates() {
    try {
      const rows = JSON.parse(localStorage.getItem('novacare.crew:' + Auth.user().id)) || [];
      return rows.map((r) => ({ ...r.summary, id: r.user_id, name: r.name || r.summary.name, role: r.role || r.summary.role, updatedAt: r.updated_at, cached: true }));
    } catch (e) { return []; }
  }

  let list = [], stamp = '';
  function refresh(force) {
    if (!Auth.user() || !state) { list = []; return list; }
    const k = JSON.stringify([state.md, state.env, Object.keys(state.days[state.md].vals).length, Object.keys(state.days[state.md].tasks).length, state.showSim, Auth.user().crew, localStorage.getItem('novacare.crew:' + Auth.user().id) || ''].join('|'));
    if (!force && k === stamp) return list;
    stamp = k;
    const u = Auth.user();
    const me = summarize(state, { id: u.id, name: state.name || u.name, role: u.role, me: true });
    // only real people who registered and joined this mission (the simulated demo crew was retired);
    // a guest on the showcase mission sees its real crew, read from the database
    const mates = Auth.cloud() ? cloudMates() : [...localMates(), ...(u.guest && u.crew === SHOWCASE.code ? cloudMates() : [])];
    list = [me, ...mates];
    return list;
  }

  /* ---------- verdicts ---------- */
  const VERDICTS = [
    { level: 0, name: 'On track' }, { level: 1, name: 'Watch' }, { level: 2, name: 'Needs attention' }, { level: 3, name: 'At risk' },
  ];
  function verdict(m) {
    const maxAdv = m.advisories.reduce((x, a) => Math.max(x, a.level), 0);
    const hist = m.days.filter((d) => d.score != null);
    const now = m.readiness; const then = hist.length > 7 ? hist[hist.length - 8].score : null;
    const delta = now != null && then != null ? now - then : null;
    let level = 0;
    if (now == null) level = -1;
    else if (maxAdv >= 3 || now < 50) level = 3;
    else if (maxAdv === 2 || now < 70) level = 2;
    else if (maxAdv === 1 || now < 85 || (delta != null && delta <= -8)) level = 1;
    const reasons = [];
    if (now != null) reasons.push(`Readiness ${now}${delta != null && delta !== 0 ? `, ${delta > 0 ? 'up' : 'down'} ${Math.abs(delta)} in 7 days` : ', steady over 7 days'}`);
    m.advisories.slice(0, 3).forEach((a) => reasons.push(a.title));
    if (!m.checkedInToday) reasons.push('No full check-in yet today');
    if (m.compliance < 0.6) reasons.push(`Checked in on ${Math.round(m.compliance * 7)} of the last 7 days`);
    return { level, name: level < 0 ? 'No data' : VERDICTS[level].name, delta, reasons };
  }

  /* ---------- crew-wide findings ---------- */
  function findings(members) {
    const out = []; const N = members.length;
    const names = (arr) => arr.map((m) => m.me ? 'you' : m.name.split(' ')[0]).join(', ');
    const co2 = members.filter((m) => m.latest.co2 && m.latest.co2.level >= 1);
    if (co2.length >= 2) out.push({ level: 2, title: 'Cabin CO₂ is high for several crew', detail: `${co2.length} of ${N} crew logged elevated CO₂ (${names(co2)}).`, act: 'Because the crew shares the same air, treat this as an environment problem: check CO₂ scrubber status and airflow at work and sleep stations before looking at individual causes.' });
    const inf = members.filter((m) => m.advisories.some((a) => a.key === 't-inf'));
    if (inf.length) {
      const others = members.filter((m) => !inf.includes(m));
      out.push({ level: 3, title: `Possible infection: ${names(inf)}`, detail: `Fever with a fast heart rate. Other crew temperatures: ${others.map((m) => `${m.me ? 'you' : m.name.split(' ')[0]} ${m.latest.temp && m.latest.temp.v != null ? m.latest.temp.v + ' °C' : 'not logged'}`).join(', ') || '—'}.`, act: 'Limit close contact and shared items, clean shared surfaces, and have every crew member log temperature daily until the cause is known.' });
    }
    const sleepy = members.filter((m) => m.advisories.some((a) => a.ind === 'sleep') || (m.latest.sleep && m.latest.sleep.v != null && m.latest.sleep.v < 6));
    if (sleepy.length >= Math.max(2, Math.ceil(N / 2))) out.push({ level: 2, title: 'Short sleep across the crew', detail: `${sleepy.length} of ${N} crew are sleeping under 6 hours or building sleep debt (${names(sleepy)}).`, act: 'Review the crew timeline: protect an 8.5-hour sleep window, move late tasks, and check noise and light in sleep stations.' });
    else if (sleepy.length === 1) out.push({ level: 1, title: `Short sleep: ${names(sleepy)}`, detail: 'One crew member is below 6 hours of sleep or building sleep debt.', act: 'Pair them with a crewmate on safety-critical tasks until sleep recovers.' });
    const ex = members.filter((m) => m.advisories.some((a) => a.key === 't-ex'));
    if (ex.length) out.push({ level: 2, title: `Exercise lapse: ${names(ex)}`, detail: `${ex.length} crew missed most of their exercise prescription in recent days.`, act: 'Bone and muscle loss resumes within days. Find what is blocking it (time, hardware, pain) and adjust the plan.' });
    const mood = members.filter((m) => m.advisories.some((a) => a.ind === 'mood'));
    if (mood.length) out.push({ level: mood.length >= 2 ? 2 : 1, title: `Mood trending down: ${names(mood)}`, detail: 'Low or falling mood over several days.', act: 'Offer a private psychological conference and plan shared downtime as a crew.' });
    const bp = members.filter((m) => m.advisories.some((a) => a.key === 't-bp'));
    if (bp.length) out.push({ level: 1, title: `Blood pressure rising: ${names(bp)}`, detail: 'Systolic pressure is well above the mission-start average.', act: 'Review sodium intake and stress; raise it at the next medical conference.' });
    const lowComp = members.filter((m) => m.compliance < 0.6);
    if (lowComp.length) out.push({ level: 1, title: 'Missed check-ins', detail: `${names(lowComp)} checked in on fewer than 5 of the last 7 days.`, act: 'Gaps hide trends. A two-minute morning check-in keeps the analysis reliable.' });
    const doses = members.map((m) => m.dose / CAREER_DOSE_LIMIT);
    const maxDose = Math.max(...doses);
    if (maxDose >= 0.5) out.push({ level: maxDose >= 0.8 ? 2 : 1, title: 'Radiation dose is significant', detail: `Highest mission dose is ${Math.round(maxDose * 100)}% of the career limit.`, act: 'Review EVA and excursion plans; maximise time in shielded areas.' });
    return out.sort((a, b) => b.level - a.level);
  }

  /* ---------- emergency alerts ---------- */
  const alertKey = () => 'novacare.alerts:' + (Auth.user() && Auth.user().crew ? Auth.user().crew : '-');
  // alerts raised before the log was reset (LOG_EPOCH) no longer exist for anyone
  const readAlerts = () => { try { return (JSON.parse(localStorage.getItem(alertKey())) || []).filter((a) => !a.createdAt || a.createdAt >= LOG_EPOCH); } catch (e) { return []; } };
  const writeAlerts = (a) => { try { localStorage.setItem(alertKey(), JSON.stringify(a.slice(-100))); } catch (e) { /* ignore */ } };
  const uuid = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }));

  function raise(about, type, note) {
    const u = Auth.user();
    const a = { id: uuid(), crew: u.crew, fromId: u.id, fromName: state.name || u.name, aboutId: about.id, aboutName: about.name,
      type, note: note || '', status: 'active', md: state.md, createdAt: new Date().toISOString(), resolvedAt: null, pending: Auth.cloud() };
    writeAlerts([...readAlerts(), a]);
    if (typeof Sync !== 'undefined') Sync.run();
    return a;
  }
  function resolve(id) {
    writeAlerts(readAlerts().map((a) => a.id === id ? { ...a, status: 'resolved', resolvedAt: new Date().toISOString(), pending: Auth.cloud() } : a));
    if (typeof Sync !== 'undefined') Sync.run();
  }
  function merge(remote) { // alerts pulled from the cloud
    const mine = readAlerts(); const byId = Object.fromEntries(mine.map((a) => [a.id, a]));
    remote.forEach((r) => {
      const l = byId[r.id];
      // resolved wins: once anyone resolves an alert it is resolved on every device
      if (!l || (r.status === 'resolved' && l.status === 'active') || (!l.pending && r.status !== l.status)) byId[r.id] = { ...r, pending: false };
    });
    writeAlerts(Object.values(byId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
  }

  return { refresh, members: () => list, verdict, findings, summarize, withState, raise, resolve, merge,
    alerts: readAlerts, writeAlerts, active: () => readAlerts().filter((a) => a.status === 'active'), SIM };
})();

/* ---------- emergency protocols ----------
   General first-aid steps adapted for a spacecraft. They support, and never replace,
   the mission's own medical checklists and the Crew Medical Officer. */
const EMERGENCIES = [
  { id: 'unresponsive', icon: 'siren', name: 'Unresponsive or not breathing normally', ind: ['hr', 'spo2', 'sys', 'temp'],
    steps: [
      'Call out to the whole crew and send for the Crew Medical Officer and the medical kit with the defibrillator (AED).',
      'Tap the shoulders and shout their name. Check for normal breathing for no more than 10 seconds.',
      'If they are not breathing normally, start CPR now. In microgravity, restrain them to a firm surface (the medical restraint or a wall) and brace your own feet, or use the handstand position with your feet against the opposite wall.',
      'Push hard and fast in the centre of the chest: about 5–6 cm deep, 100–120 compressions per minute. Give 2 rescue breaths after every 30 compressions if trained.',
      'Turn on the AED as soon as it arrives and follow its voice prompts. Swap the compressor every 2 minutes.',
      'If they are breathing, keep the airway open, give oxygen, and stay with them while you measure heart rate and SpO₂.',
    ] },
  { id: 'breathing', icon: 'breath', name: 'Trouble breathing or low oxygen', ind: ['spo2', 'hr', 'co2', 'temp'],
    steps: [
      'Check the cabin first: alarms, smoke, a leak or high CO₂. If the air is the problem, everyone puts on masks and moves to a safe module.',
      'Help them into a supported upright position and loosen anything tight around the chest.',
      'Give oxygen from the medical kit by mask and measure SpO₂ and heart rate.',
      'Look for an allergic reaction (hives, swelling of lips or tongue). If you see it, switch to the allergic reaction protocol.',
      'Re-measure SpO₂ every 5 minutes. Below 90% despite oxygen means the Crew Medical Officer takes over care now.',
    ] },
  { id: 'chest', icon: 'heart', name: 'Chest pain', ind: ['hr', 'sys', 'dia', 'spo2'],
    steps: [
      'Stop all activity. Have them rest, restrained, in the position they find most comfortable.',
      'Measure blood pressure, heart rate and SpO₂ now and every 5 minutes.',
      'Give oxygen if SpO₂ is under 94%.',
      'Record a 12-lead ECG if the medical kit has one and send it to the flight surgeon.',
      'Open the onboard chest pain checklist. Give medication only as the checklist or flight surgeon directs.',
      'Keep the AED close and stay with them.',
    ] },
  { id: 'bleeding', icon: 'drop', name: 'Severe bleeding or injury', ind: ['hr', 'sys', 'spo2'],
    steps: [
      'Put on gloves and eye protection. In microgravity, blood forms floating droplets — keep absorbent pads ready.',
      'Press firmly and directly on the wound with a dressing and keep pressing for at least 10 minutes.',
      'For life-threatening bleeding from an arm or leg that pressure does not stop, apply a tourniquet above the wound and note the time.',
      'Watch for shock: pale clammy skin, fast heart rate, confusion. Keep them warm and measure blood pressure.',
      'Once bleeding is controlled, the Crew Medical Officer cleans and closes the wound per the medical checklist.',
    ] },
  { id: 'head', icon: 'brain', name: 'Head injury, confusion or seizure', ind: ['hr', 'sys', 'spo2', 'vision'],
    steps: [
      'Keep them still and protect them from hitting equipment. During a seizure, do not hold them down or put anything in their mouth.',
      'Check responsiveness: can they say their name, where they are and the mission day?',
      'Look at the pupils and ask about headache, vision change and nausea.',
      'Vomiting is dangerous in microgravity — have an emesis bag ready and turn their head to the side.',
      'Repeat the checks every 15 minutes and write down any change. Do not leave them alone.',
    ] },
  { id: 'allergy', icon: 'zap', name: 'Severe allergic reaction', ind: ['spo2', 'hr', 'sys'],
    steps: [
      'Signs: swelling of face, lips or tongue, wheezing, hives, sudden dizziness.',
      'Give the epinephrine auto-injector from the medical kit into the outer thigh, as the checklist directs.',
      'Give oxygen and help them breathe upright. If they feel faint, lay them flat and raise the legs.',
      'Measure blood pressure, heart rate and SpO₂ every 5 minutes. A second dose may be needed after 5–15 minutes if there is no improvement.',
      'Remove or isolate what caused it (food, chemical, payload material).',
    ] },
  { id: 'toxic', icon: 'wind', name: 'Smoke, toxic gas or high CO₂ exposure', ind: ['spo2', 'co2', 'hr'],
    steps: [
      'Sound the alarm and put on masks or breathing apparatus before helping anyone.',
      'Move the affected person out of the contaminated area into clean air.',
      'Follow the vehicle emergency procedure for the source (fire, ammonia, toxic release).',
      'Give oxygen and measure SpO₂ and heart rate. Flush eyes or skin with water if exposed.',
      'Monitor for delayed breathing problems over the next hours.',
    ] },
  { id: 'burn', icon: 'flame', name: 'Burn', ind: ['hr', 'temp'],
    steps: [
      'Make the area safe and stop the burning (power off equipment, smother flames).',
      'Cool the burn with cool water or cold packs for 20 minutes. Do not use ice.',
      'Remove rings or tight items near the burn before it swells.',
      'Cover loosely with a non-stick dressing or cling film.',
      'Burns to the face or airway, or larger than their palm, need the Crew Medical Officer now.',
    ] },
  { id: 'fracture', icon: 'bone', name: 'Possible fracture or sprain', ind: ['hr'],
    steps: [
      'Keep the injured part still. Do not try to straighten it.',
      'Immobilise it with a splint from the medical kit, padding the joints above and below.',
      'Check feeling, colour and pulse beyond the injury before and after splinting.',
      'Apply a cold pack wrapped in cloth for up to 20 minutes.',
      'Pain relief only as the medical checklist or flight surgeon directs.',
    ] },
  { id: 'psych', icon: 'users', name: 'Panic or psychological crisis', ind: ['mood', 'stress', 'sleep', 'hr'],
    steps: [
      'Stay with them. Speak calmly, keep your sentences short and give them space.',
      'Move to a quiet, safe area and secure tools or hazards nearby.',
      'Breathe with them: in for 4 seconds, out for 6, for a few minutes.',
      'Do not argue with what they are feeling. Ask what would help right now.',
      'Arrange a private psychological conference with ground as soon as the link allows, and keep a crewmate with them.',
    ] },
];
const EMG = Object.fromEntries(EMERGENCIES.map((e) => [e.id, e]));
/* "Ask the crew for help" requests travel as alerts too, so every crewmate gets them. */
const HELP_TYPES = { help: { name: 'Needs help now', urgent: true }, assist: { name: 'Asked for a hand (not urgent)', urgent: false } };
const alertName = (type) => (HELP_TYPES[type] || EMG[type] || {}).name || type;
