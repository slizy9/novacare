/* NOVACARE — state, status classification, guidance rules, gamification. */

const STORE_KEY = 'vigil.v1';
let state = null;

const Engine = (() => {
  /* ---------- state ---------- */
  function rng(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function fresh() {
    return { v: 1, name: '', env: 'iss', md: 1, days: { 1: { vals: {}, tasks: {} } }, demo: false };
  }

  /* 33 days of plausible history with a few developing problems to discover. */
  function demo() {
    const r = rng(2026);
    const n = (mean, sd) => mean + (r() + r() + r() - 1.5) * sd * 1.15;
    const round = (v, step) => Math.round(v / step) * step;
    const s = { v: 1, name: 'Alex Rivera', env: 'iss', md: 34, days: {}, demo: true };
    const massPlan = { 1: 74.0, 8: 73.5, 15: 73.0, 22: 72.3, 29: 71.6 };
    for (let d = 1; d <= 33; d++) {
      const p = d / 33; // mission progress
      const late = d >= 29;
      const v = {};
      v.sys = Math.round(n(113 + p * 7, 4));
      v.dia = Math.round(n(73 + p * 4, 3));
      v.hr = Math.round(n(57 + p * 14, 2.5));
      v.spo2 = Math.round(n(97.6, 0.8));
      v.temp = round(n(36.6 + p * 0.3, 0.15), 0.1);
      if (d % 3 === 1) v.glu = Math.round(n(86 + p * 9, 4));
      v.sleep = round(n(late ? 5.6 : 6.7, 0.5), 0.5);
      v.mood = late ? (r() < 0.6 ? 3 : 4) : (r() < 0.2 ? 5 : r() < 0.15 ? 3 : 4);
      v.stress = late ? 3 : (r() < 0.25 ? 3 : r() < 0.3 ? 1 : 2);
      v.water = round(n(2.2, 0.35), 0.1);
      v.exercise = round(n(112, 14), 5);
      if (d === 12 || d === 20) v.exercise = 40;
      if (massPlan[d]) v.mass = massPlan[d];
      if (d % 7 === 1) v.vision = d === 29 ? 1 : 0;
      v.rad = round(n(0.5, 0.08), 0.01);
      if (d === 21) v.rad = 1.9; // solar particle event
      v.co2 = round(n(late ? 3.7 : 2.5, 0.3), 0.1);
      for (const k in v) v[k] = +(+v[k]).toFixed(IND[k].dec);
      v.spo2 = Math.min(100, v.spo2);
      const tasks = {};
      ['vitd', 'social', 'wind'].forEach((t) => { if (r() < (late && t === 'wind' ? 0.3 : 0.82)) tasks[t] = true; });
      s.days[d] = { vals: v, tasks };
    }
    s.days[34] = { vals: {}, tasks: {} };
    return s;
  }

  // each signed-in account keeps its own mission data
  const storeKey = () => (typeof Auth !== 'undefined' && Auth.user() ? `${STORE_KEY}:${Auth.user().id}` : STORE_KEY);

  function load() {
    try {
      const raw = localStorage.getItem(storeKey());
      if (raw) { const s = JSON.parse(raw); if (s && s.v === 1 && s.days) { state = s; return; } }
    } catch (e) { /* storage unavailable — run in memory */ }
    state = fresh(); // a new account starts with no readings and no mission (the demo is in Settings)
  }
  // silent = written by the sync itself (cloud copy), so it is not queued for upload again
  function save(silent) {
    try { localStorage.setItem(storeKey(), JSON.stringify(state)); } catch (e) { /* ignore */ }
    if (!silent && typeof Sync !== 'undefined') Sync.touch();
  }

  const env = () => ENVIRONMENTS[state.env] || ENVIRONMENTS.iss;
  const today = () => (state.days[state.md] = state.days[state.md] || { vals: {}, tasks: {} });

  /* ---------- mission day follows the calendar ----------
     Day 1 is the mission's start date; each local midnight starts the next mission day.
     Missions saved before this get a start date that keeps their current day. Never goes back. */
  const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const fromKey = (k) => { const [y, m, d] = String(k).slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };
  function calendarDay() {
    if (!state) return false;
    const now = new Date(); now.setHours(0, 0, 0, 0);
    if (!state.startDate) { const s = new Date(now); s.setDate(s.getDate() - ((state.md || 1) - 1)); state.startDate = dayKey(s); }
    const md = Math.max(1, Math.round((now - fromKey(state.startDate)) / 864e5) + 1);
    if (md <= (state.md || 1)) return false;
    state.md = md; today(); return true;
  }

  /* ---------- series & status ---------- */
  function series(id) {
    const out = [];
    for (let d = 1; d <= state.md; d++) {
      const day = state.days[d];
      if (day && day.vals[id] != null) out.push({ md: d, v: day.vals[id] });
    }
    return out;
  }
  const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;

  function ctx() {
    const mass = series('mass'); const hr = series('hr');
    return {
      baselineMass: mass.length ? mass[0].v : null,
      baselineHr: hr.length >= 10 ? median(hr.slice(0, 7).map((p) => p.v)) : null,
    };
  }

  function classify(ind, v, c) {
    const b = ind.bands(env(), c || ctx());
    let level = 0;
    if (v < b.crit[0] || v > b.crit[1]) level = 3;
    else if (v < b.warn[0] || v > b.warn[1]) level = 2;
    else if (v < b.ok[0] || v > b.ok[1]) level = 1;
    return { level, dir: v < b.ok[0] ? 'low' : 'high', bands: b };
  }

  function status(id) {
    const ind = IND[id]; const s = series(id);
    if (!s.length) return { id, level: -1, v: null, md: null, age: null, due: true, loggedToday: false };
    const last = s[s.length - 1]; const age = state.md - last.md;
    const c = classify(ind, last.v);
    return { id, level: c.level, dir: c.dir, v: last.v, md: last.md, age, due: age >= ind.cadence, loggedToday: age === 0,
      stale: age > Math.max(2, ind.cadence * 2) };
  }

  function systemLevel(sysId) {
    const levels = SYS[sysId].indicators.map((i) => status(i)).filter((s) => s.level >= 0 && !s.stale).map((s) => s.level);
    // Multi-day trend findings count too, so the body map shows them.
    advisories().forEach((a) => { if (a.trend && SYS[sysId].indicators.includes(a.ind)) levels.push(a.level); });
    return levels.length ? Math.max(...levels) : -1;
  }

  function readiness() {
    const pts = [100, 74, 40, 0];
    const st = INDICATORS.map((i) => status(i.id)).filter((s) => s.level >= 0);
    if (!st.length) return null;
    const trendPenalty = advisories().filter((a) => a.trend).reduce((p, a) => p + (a.level >= 2 ? 5 : 2), 0);
    return Math.max(0, Math.round(avg(st.map((s) => pts[s.level])) - trendPenalty));
  }

  function dueList() { return INDICATORS.filter((i) => status(i.id).due).map((i) => i.id); }

  function cumulativeDose() {
    let total = 0;
    for (let d = 1; d <= state.md; d++) {
      const v = state.days[d] && state.days[d].vals.rad;
      total += v != null ? v : (d < state.md ? env().rad : 0);
    }
    return total;
  }

  /* ---------- guidance ---------- */
  function escalation(level) {
    if (level >= 3) return { who: 'Act now', text: `Start onboard care with the Crew Medical Officer using the medical checklist, and notify the flight surgeon — ${env().commNote}` };
    if (level === 2) return { who: 'Tell the crew', text: 'Inform the Crew Medical Officer today and report it at the next ground medical conference.' };
    return { who: 'Self-care', text: 'You can handle this yourself. Follow the steps and check again at your next measurement.' };
  }

  function recent(id, days) { return series(id).filter((p) => p.md > state.md - days); }

  function advisories() {
    const out = []; const c = ctx(); const e = env();
    const add = (a) => out.push({ ...a, esc: escalation(a.level) });

    for (const ind of INDICATORS) {
      const s = status(ind.id);
      if (s.level < 1 || s.stale) continue;
      const adv = ind.advice[s.dir];
      if (!adv || !adv.actions.length) continue;
      add({ key: ind.id, level: s.level, title: adv.title, ind: ind.id,
        detail: `${ind.short}: ${fmt(ind, s.v)} ${ind.unit} (logged MD ${s.md})`, actions: adv.actions });
    }

    // Trend rules — problems that only show up across several days.
    const sl = recent('sleep', 5);
    if (sl.filter((p) => p.v < 6).length >= 3) {
      add({ key: 't-sleep', level: 2, title: 'Sleep debt is building', trend: true, ind: 'sleep',
        detail: `${sl.filter((p) => p.v < 6).length} of the last ${sl.length} nights were under 6 hours (average ${avg(sl.map((p) => p.v)).toFixed(1)} h).`,
        actions: [
          'Chronic short sleep lowers alertness as much as alcohol does, and you stop noticing it.',
          'Ask ground to protect an 8.5-hour sleep window for the next three nights.',
          'Double-check procedures with a crewmate on safety-critical tasks until sleep recovers.',
          'Check cabin CO₂, noise and light in your sleep station.',
        ] });
    }
    const m7 = recent('mood', 7);
    if (m7.length >= 3 && avg(m7.map((p) => p.v)) <= 2.6) {
      add({ key: 't-mood', level: 2, title: 'Low mood for several days', trend: true, ind: 'mood',
        detail: `Average mood over the last ${m7.length} entries is ${avg(m7.map((p) => p.v)).toFixed(1)} / 5.`,
        actions: [
          'A lasting dip is common on long missions and it is treatable — it is not a personal failing.',
          'Request a private psychological conference; it is confidential.',
          'Tell the Crew Medical Officer or a crewmate you trust how you have been feeling.',
          'Keep sleep, exercise and meals regular this week.',
        ] });
    } else {
      const m5 = recent('mood', 5); const prior = series('mood').filter((p) => p.md <= state.md - 5 && p.md > state.md - 19);
      if (m5.length >= 3 && prior.length >= 5 && avg(prior.map((p) => p.v)) - avg(m5.map((p) => p.v)) >= 0.7) {
        add({ key: 't-mood', level: 1, title: 'Mood is trending down', trend: true, ind: 'mood',
          detail: `Recent average ${avg(m5.map((p) => p.v)).toFixed(1)} / 5, down from ${avg(prior.map((p) => p.v)).toFixed(1)} over the two weeks before.`,
          actions: [
            'Catch it early: plan something to look forward to this week.',
            'Schedule a call or message with family or friends.',
            'Check your sleep — mood usually follows it.',
          ] });
      }
    }
    const hr3 = recent('hr', 3);
    if (c.baselineHr && hr3.length >= 2 && avg(hr3.map((p) => p.v)) >= c.baselineHr + 10) {
      add({ key: 't-hr', level: 1, title: 'Resting heart rate is drifting up', trend: true, ind: 'hr',
        detail: `Now about ${Math.round(avg(hr3.map((p) => p.v)))} bpm versus your early-mission baseline of ${Math.round(c.baselineHr)} bpm.`,
        actions: [
          'A steady rise can mean dehydration, short sleep, stress, a coming infection or cardiovascular deconditioning.',
          'Check hydration and sleep first, and take your temperature.',
          'Make sure aerobic sessions are being completed at the prescribed intensity.',
        ] });
    }
    const sysAll = series('sys'); const sys5 = recent('sys', 5);
    if (sysAll.length >= 12 && sys5.length >= 3 && avg(sys5.map((p) => p.v)) >= avg(sysAll.slice(0, 7).map((p) => p.v)) + 12) {
      add({ key: 't-bp', level: 1, title: 'Blood pressure is trending up', trend: true, ind: 'sys',
        detail: `Systolic now averages ${Math.round(avg(sys5.map((p) => p.v)))} mmHg, up from ${Math.round(avg(sysAll.slice(0, 7).map((p) => p.v)))} at mission start.`,
        actions: ['Review sodium intake and stress.', 'Keep measuring at the same time each day.', 'Mention the trend at the next medical conference.'] });
    }
    const co2 = status('co2'); const vis = status('vision');
    if (co2.level >= 1 && !co2.stale && vis.level >= 1 && !vis.stale) {
      add({ key: 't-sans', level: 2, title: 'Vision change together with high CO₂', trend: true, ind: 'vision',
        detail: `Cabin CO₂ ${fmt(IND.co2, co2.v)} mmHg and a reported vision change (MD ${vis.md}).`,
        actions: [
          'Raised CO₂ may add to the pressure effects behind SANS, so this pair matters more than either alone.',
          'Work on lowering CO₂ exposure now: improve airflow at your work and sleep stations.',
          'Repeat the near-vision card test and report both findings to the flight surgeon.',
        ] });
    }
    const t = status('temp'); const hr = status('hr');
    if (t.level >= 0 && !t.stale && t.v >= 38 && hr.level >= 0 && hr.v > 100) {
      add({ key: 't-inf', level: Math.max(2, t.level), title: 'Fever with fast heart rate — possible infection', trend: true, ind: 'temp',
        detail: `Temperature ${fmt(IND.temp, t.v)} °C with resting heart rate ${hr.v} bpm.`,
        actions: [
          'Rest, drink fluids and re-measure both in 30 minutes.',
          'The Crew Medical Officer should examine you: throat, chest, skin, urine dipstick.',
          'Limit close contact and shared items until a cause is found.',
        ] });
    }
    const ex4 = recent('exercise', 4);
    if (ex4.length >= 3 && ex4.filter((p) => p.v < e.exTarget * 0.5).length >= 3) {
      add({ key: 't-ex', level: 2, title: 'Exercise countermeasure lapse', trend: true, ind: 'exercise',
        detail: `${ex4.filter((p) => p.v < e.exTarget * 0.5).length} of the last ${ex4.length} days were under half the prescription.`,
        actions: [
          'Bone and muscle loss resumes within days of stopping.',
          'Tell ground what is in the way — time, hardware, pain or motivation — so the plan can be changed.',
          'Restart with resistance work first.',
        ] });
    }
    const dose = cumulativeDose(); const frac = dose / CAREER_DOSE_LIMIT;
    if (frac >= 0.5) {
      add({ key: 't-dose', level: frac >= 0.8 ? 2 : 1, title: 'Cumulative radiation dose is significant', trend: true, ind: 'rad',
        detail: `Mission dose ${dose.toFixed(0)} mSv — ${Math.round(frac * 100)}% of the ${CAREER_DOSE_LIMIT} mSv career limit.`,
        actions: ['Maximise time in shielded areas.', 'Ask ground to review your EVA and excursion plan.'] });
    }
    // What the person reported in today's latest status update.
    if (typeof Status !== 'undefined') { const su = Status.advisory(); if (su) add(su); }
    // A trend finding replaces the single-reading advisory for the same indicator.
    const trends = out.filter((a) => a.trend);
    for (let i = out.length - 1; i >= 0; i--) {
      if (!out[i].trend && trends.some((t) => t.ind === out[i].ind && t.level >= out[i].level)) out.splice(i, 1);
    }
    return out.sort((a, b) => b.level - a.level || (b.trend ? 1 : 0) - (a.trend ? 1 : 0));
  }

  /* ---------- routine & gamification ---------- */
  function taskDone(task, day) {
    if (!day) return false;
    return task.auto ? task.auto(day, env()) : !!day.tasks[task.id];
  }
  const checkedIn = (day) => !!day && taskDone(TASKS[0], day) && taskDone(TASKS[1], day);

  function dayXp(day) {
    if (!day) return 0;
    let xp = Object.keys(day.vals).length * 10;
    xp += TASKS.filter((t) => taskDone(t, day)).length * 15;
    if (checkedIn(day)) xp += 50;
    return xp;
  }

  function maxRun(pred) {
    let best = 0, run = 0;
    for (let d = 1; d <= state.md; d++) { if (pred(state.days[d])) { run++; best = Math.max(best, run); } else run = 0; }
    return best;
  }

  function game() {
    let xp = 0;
    for (let d = 1; d <= state.md; d++) xp += dayXp(state.days[d]);
    let ri = 0; RANKS.forEach((r, i) => { if (xp >= r.xp) ri = i; });
    const next = RANKS[ri + 1];
    // Streak: today counts once done; an unfinished today does not break it.
    let streak = 0; let d = state.md;
    if (!checkedIn(state.days[d])) d--;
    while (d >= 1 && checkedIn(state.days[d])) { streak++; d--; }
    const e = env();
    const has = (k, f) => (day) => !!day && day.vals[k] != null && f(day.vals[k]);
    const badges = [
      { id: 'first', icon: '✦', name: 'First Light', desc: 'Complete your first full check-in', got: maxRun(checkedIn) >= 1 },
      { id: 's7', icon: '7', name: 'Steady Orbit', desc: '7-day check-in streak', got: maxRun(checkedIn) >= 7 },
      { id: 's30', icon: '30', name: 'Long Haul', desc: '30-day check-in streak', got: maxRun(checkedIn) >= 30 },
      { id: 'panel', icon: '▦', name: 'Full Panel', desc: 'Log 12 or more indicators in one day', got: maxRun((day) => !!day && Object.keys(day.vals).length >= 12) >= 1 },
      { id: 'bones', icon: '⛭', name: 'Iron Bones', desc: 'Hit the exercise target 5 days running', got: maxRun(has('exercise', (v) => v >= e.exTarget * 0.75)) >= 5 },
      { id: 'sleep', icon: '☾', name: 'Deep Sleeper', desc: '7+ hours of sleep 5 nights running', got: maxRun(has('sleep', (v) => v >= 7)) >= 5 },
      { id: 'hydro', icon: '≋', name: 'Hydro Hero', desc: 'Hydration goal 7 days running', got: maxRun(has('water', (v) => v >= 2)) >= 7 },
      { id: 'perfect', icon: '★', name: 'Perfect Sol', desc: 'Finish every routine task in one day', got: maxRun((day) => !!day && TASKS.every((t) => taskDone(t, day))) >= 1 },
    ];
    return { xp, rank: RANKS[ri], next, pct: next ? (xp - RANKS[ri].xp) / (next.xp - RANKS[ri].xp) : 1, streak, badges, todayXp: dayXp(state.days[state.md]) };
  }

  function fmt(ind, v) {
    if (v == null) return '—';
    if (ind.type === 'scale') { const o = ind.scale.find((x) => x.v === v); return o ? `${v}` : `${v}`; }
    return (+v).toFixed(ind.dec);
  }
  function label(ind, v) {
    if (ind.type !== 'scale' || v == null) return '';
    const o = ind.scale.find((x) => x.v === v); return o ? o.label : '';
  }

  function report() {
    const e = env(); const L = [];
    L.push('NOVACARE — CREW HEALTH SELF-ASSESSMENT REPORT');
    L.push(`Crew member: ${state.name || '(not set)'}`);
    L.push(`Environment: ${e.name}`);
    L.push(`Mission day: ${state.md}    Readiness score: ${readiness() ?? '—'} / 100`);
    L.push(`Cumulative mission radiation dose: ${cumulativeDose().toFixed(1)} mSv`);
    L.push(''); L.push('LATEST INDICATORS');
    for (const ind of INDICATORS) {
      const s = status(ind.id);
      const st = s.level < 0 ? 'no data' : LEVELS[s.level].name.toUpperCase();
      L.push(`  ${ind.short.padEnd(16)} ${(s.v == null ? '—' : fmt(ind, s.v) + ' ' + ind.unit).padEnd(14)} ${st.padEnd(10)} ${s.md ? 'MD ' + s.md : ''}`);
    }
    L.push(''); L.push('ACTIVE ADVISORIES');
    const adv = advisories();
    if (!adv.length) L.push('  None.');
    adv.forEach((a) => { L.push(`  [${LEVELS[a.level].name.toUpperCase()}] ${a.title} — ${a.detail}`); });
    L.push(''); L.push('Prototype output. Not a medical device.');
    return L.join('\n');
  }

  return { load, save, demo, fresh, env, today, series, ctx, classify, status, systemLevel, readiness, dueList,
    cumulativeDose, advisories, taskDone, checkedIn, calendarDay, dayKey, dayXp, game, fmt, label, report, avg };
})();
