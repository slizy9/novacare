/* NOVACARE — the link between records, analysis and action.

   Every reading is compared with the person's own baseline (pre-flight exam, or their first week
   on the mission), read in the context of their medical profile and the mission, and turned into
   a finding that says: what changed, why it matters, what to do, what to measure next, when to
   ask for help, and which rule and source it comes from. What the person then does is kept as a
   decision history with its outcome.

   Also here: where a reading came from (provenance), the onboard self-test (does NovaCare really
   work without Earth?), and the levels of autonomous assistance.
   Everything runs on the device. Nothing in this file calls a network. */

const INSIGHT_VERSION = '1.0 (2026-11-15)';

/* How far from the person's own baseline counts as a change (prototype values). mass is a percentage. */
const PERSONAL_TOL = { hr: 8, sys: 10, dia: 8, spo2: 2, temp: 0.5, glu: 12, sleep: 1, mass: 3 };
const PERSONAL_IDS = Object.keys(PERSONAL_TOL);
/* Only one direction matters for these. */
const ONE_WAY = { spo2: 'low', sleep: 'low' };
/* A jump this large since the previous reading is more often a bad measurement than a real change. */
const JUMP = { hr: 35, sys: 40, dia: 30, spo2: 6, temp: 1.5, glu: 60, mass: 3 };
/* What to measure next to narrow down a finding. */
const CHECK_NEXT = { hr: ['temp', 'water', 'sleep'], sys: ['hr', 'stress'], dia: ['hr', 'stress'], spo2: ['co2', 'hr'], temp: ['hr', 'water'], glu: ['water', 'mass'],
  sleep: ['co2', 'stress'], mood: ['sleep', 'stress'], stress: ['sleep', 'mood'], water: ['mass'], exercise: ['mass'], mass: ['water', 'exercise'], vision: ['co2', 'sys'], rad: [], co2: ['spo2'] };

const READING_SRC = {
  self: { name: 'Self-measured', short: 'Self', hint: 'You took it yourself' },
  device: { name: 'Onboard device', short: 'Device', hint: 'Read from a ship monitor or wearable' },
  exam: { name: 'Exam by the Crew Medical Officer', short: 'CMO exam', hint: 'Taken and checked by the medical officer' },
  carried: { name: 'Carried over', short: 'Carried over', hint: 'Copied from the last reading, not measured again' },
};

/* Findings that only exist because the value left the person's OWN normal (the general range may still say OK). */
const PERSONAL_TEXT = {
  hr: {
    high: { title: 'Heart rate is above your own normal', why: 'A resting rate that climbs above your personal baseline is often the first sign of dehydration, short sleep, stress, a developing infection or cardiovascular deconditioning — days before it leaves the general adult range.',
      actions: ['Sit still for 5 minutes and measure again.', 'Drink a pouch of water and take your temperature.', 'Look at last night’s sleep and today’s workload.'] },
    low: { title: 'Heart rate is below your own normal', why: 'A lower rate can simply mean better fitness, but a drop from your own baseline with dizziness or tiredness needs a look.',
      actions: ['Measure again after 5 minutes of rest.', 'Note any dizziness, faintness or unusual tiredness.', 'Review any medicine you started recently.'] },
  },
  sys: {
    high: { title: 'Blood pressure is above your own normal', why: 'Fluid shifts, salt, stress and poor sleep raise blood pressure in flight. A rise from your own baseline matters even while the number is still “normal” for adults.',
      actions: ['Rest 5 minutes, arm at heart level, and measure again.', 'Go easy on salty food today.', 'Do the breathing exercise before your next reading.'] },
    low: { title: 'Blood pressure is below your own normal', why: 'A drop from your baseline can come from dehydration or deconditioning, and raises the risk of fainting when gravity returns.',
      actions: ['Drink fluids and measure again in 30 minutes.', 'Stand up or change position slowly.', 'Keep your exercise prescription — it protects blood pressure control.'] },
  },
  dia: {
    high: { title: 'Diastolic pressure is above your own normal', why: 'The lower number rising from your baseline points to sustained stress on the circulation.',
      actions: ['Rest 5 minutes and measure again.', 'Review salt, caffeine and stress today.'] },
    low: { title: 'Diastolic pressure is below your own normal', why: 'A drop from your baseline can come from dehydration.',
      actions: ['Drink fluids and measure again in 30 minutes.'] },
  },
  spo2: { low: { title: 'Blood oxygen is below your own normal', why: 'Your oxygen saturation is lower than it usually is for you. Cabin air (CO₂, pressure), a cold probe or a chest problem can all do this.',
    actions: ['Warm your hand, sit still and measure again on another finger.', 'Check cabin CO₂ and move to a well-ventilated module.', 'Take slow, deep breaths for a minute and re-measure.'] } },
  temp: {
    high: { title: 'Temperature is above your own normal', why: 'Body temperature runs slightly higher in space, but a rise from your own baseline can be the start of an infection — the immune system is weaker in flight.',
      actions: ['Measure again in 30 minutes.', 'Drink fluids and rest.', 'Check your heart rate: fever with a fast pulse needs the Crew Medical Officer.'] },
    low: { title: 'Temperature is below your own normal', why: 'Usually a measuring problem or a cold module.',
      actions: ['Measure again with the probe placed correctly.', 'Warm up and re-check.'] },
  },
  glu: {
    high: { title: 'Fasting glucose is above your own normal', why: 'Spaceflight reduces insulin sensitivity. A rise from your own baseline is worth catching early.',
      actions: ['Confirm you were fasting; repeat tomorrow morning.', 'Keep your exercise sessions — they improve glucose control.'] },
    low: { title: 'Fasting glucose is below your own normal', why: 'A drop from your baseline can mean you are not eating enough.',
      actions: ['Eat now if you feel shaky or sweaty.', 'Review your meal plan for the last two days.'] },
  },
  sleep: { low: { title: 'You are sleeping less than your own normal', why: 'You are getting noticeably less sleep than you usually do on this mission. Alertness drops before you notice it.',
    actions: ['Protect a full sleep window tonight.', 'Check light, noise and CO₂ in your sleep station.'] } },
  mass: {
    low: { title: 'Body mass is below your own baseline', why: 'Losing mass in flight usually means muscle and fluid. It weakens you for the return to gravity and for emergencies.',
      actions: ['Log everything you eat for 3 days.', 'Add a snack to each meal.', 'Keep resistance exercise — it holds on to muscle.'] },
    high: { title: 'Body mass is above your own baseline', why: 'A quick gain is usually fluid; a slow one is diet.',
      actions: ['Measure again tomorrow before breakfast.', 'Review salt intake.'] },
  },
};

/* Which onboard protocol backs each finding, chosen by hand. No match means no protocol is shown,
   never a guess from a word search (a wrong protocol is worse than none). */
const PROTOCOL_FOR = {
  'hr:low': 'MED-03', 'sys:low': 'MED-03', 'dia:low': 'MED-03', 'spo2:low': 'MED-15', 'temp:high': 'MED-06',
  sleep: 'WB-04', mood: 'WB-01', stress: 'WB-03', exercise: 'MED-13', mass: 'MED-13', vision: 'MED-09', rad: 'MED-16', co2: 'SHIP-01',
  ecg: 'MED-14', urine: 'MED-08',
  't-sleep': 'WB-04', 't-mood': 'WB-01', 't-sans': 'MED-09', 't-inf': 'MED-06', 't-ex': 'MED-13', 't-dose': 'MED-16', 'p-bone': 'MED-13', 'p-dose': 'MED-16', 'p-sleep': 'WB-04',
  'Chest pain': 'MED-14', 'Short of breath at rest': 'MED-15', 'Short of breath on effort': 'MED-15', 'Sudden vision loss or flashes': 'MED-09', 'Fainted or nearly fainted': 'MED-03',
  'Severe pain': 'MED-21', 'Severe headache': 'MED-01', 'Possible fever or infection': 'MED-06', 'Vision change': 'MED-09', 'Headache': 'MED-01', 'Nausea or dizziness': 'MED-02', 'Cough': 'MED-06',
  'Very tired': 'WB-09', 'Feeling low or anxious': 'WB-01', 'Would like to talk to someone': 'WB-01',
};
const SYM_ESC = { 3: 'Start onboard care with the Crew Medical Officer using the medical checklist.', 2: 'Inform the Crew Medical Officer today.' };
const DECISION_ACTS = { done: 'Did the steps', recheck: 'Measured again', crew: 'Told the crew', watch: 'Will keep watching', confirm: 'Confirmed the reading' };

const Insight = (() => {
  const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const num = (id, v) => Engine.fmt(IND[id], v);
  const prof = () => Medical.mine();

  /* ---------- personal baseline ---------- */
  /** The person's own reference value: pre-flight exam first, else the median of their first week of readings. */
  function baseline(id) {
    const p = prof();
    if (p.baseline && p.baseline[id]) return { v: p.baseline[id], src: 'preflight', label: 'pre-flight exam' };
    const s = Engine.series(id);
    if (s.length >= 8) { const w = s.slice(0, 7); return { v: +median(w.map((x) => x.v)).toFixed(IND[id].dec), src: 'mission', label: `first week on the mission (MD ${w[0].md}–${w[w.length - 1].md})` }; }
    return null;
  }

  /* ---------- context: the person and the mission ---------- */
  /** What changes how readings are read for THIS person on THIS mission: notes to show, and tighter or looser tolerances. */
  function context() {
    const p = prof(); const env = Engine.env(); const meds = fold(p.meds.join(' ')); const cond = fold(p.conditions.join(' '));
    const len = typeof missionLength === 'function' ? missionLength() : 180; const md = state.md;
    const tol = { ...PERSONAL_TOL }; const notes = [];
    const note = (ids, text, kind) => notes.push({ ids, text, kind });
    if (/propranolol|metoprolol|atenolol|bisoprolol|carvedilol|beta.?bloc/.test(meds)) note(['hr'], 'You take a beta-blocker: your resting heart rate runs lower, so a fast rate is more significant for you.', 'profile');
    if (/lisinopril|enalapril|ramipril|captopril|losartan|valsartan|amlodipine|hydrochlorothiazide|blood pressure|presion/.test(meds) || /hypertens|hipertens/.test(cond)) {
      tol.sys = 8; tol.dia = 6; note(['sys', 'dia'], 'Your profile lists high blood pressure or its treatment: NovaCare flags a smaller rise for you (8 mmHg instead of 10).', 'profile');
    }
    if (/asthma|asma|copd|epoc/.test(cond)) { tol.spo2 = 1; note(['spo2'], 'Your profile lists a breathing condition: a 1-point drop in oxygen is already flagged for you.', 'profile'); }
    if (/diabet/.test(cond) || /insulin|metformin/.test(meds)) { tol.glu = 10; note(['glu'], 'Your profile lists diabetes or its treatment: glucose is watched more closely for you.', 'profile'); }
    if (/warfarin|apixaban|rivaroxaban|dabigatran|heparin|anticoag/.test(meds)) note(['sys', 'dia', 'hr'], 'You take a blood thinner: any bleeding or head injury is an emergency for you.', 'profile');
    if (md <= 14) { tol.mass = 4; note(['hr', 'sys', 'dia', 'mass'], `Adaptation phase (mission day ${md} of the first 14): fluid shifts toward the head change heart rate, blood pressure and body mass. Small changes are expected now.`, 'mission'); }
    else if (md > len - 14) note(['sys', 'dia', 'hr', 'exercise', 'water'], `Return phase (last ${Math.max(1, len - md + 1)} days): blood pressure control and fitness matter most now, before gravity comes back.`, 'mission');
    else note([], `Steady phase (mission day ${md} of ${len}): slow drifts matter more than single readings.`, 'mission');
    note([], `${env.short} — ${env.comm.toLowerCase()}: ${env.commNote}`, 'mission');
    return { tol, notes, phase: md <= 14 ? 'Adaptation' : md > len - 14 ? 'Return' : 'Steady', env };
  }

  /** The person's own normal range for one indicator. */
  function range(id, c, b) {
    if (!PERSONAL_TOL[id]) return null; // scales and ship readings use the general ranges only
    b = b || baseline(id); if (!b) return null; const t = (c || context()).tol[id];
    const d = id === 'mass' ? (b.v * t) / 100 : t;
    return [+(b.v - d).toFixed(IND[id].dec), +(b.v + d).toFixed(IND[id].dec)];
  }

  /** Latest reading against the person's baseline. flag = worth telling the person about. */
  function compare(id, c) {
    if (!PERSONAL_TOL[id]) return null;
    const st = Engine.status(id); const b = baseline(id);
    if (!b || st.v == null) return { id, st, base: b, out: false, flag: false };
    c = c || context(); const r = range(id, c, b); const delta = +(st.v - b.v).toFixed(IND[id].dec);
    const dir = delta < 0 ? 'low' : 'high'; const outOf = (v) => v < r[0] || v > r[1];
    const out = outOf(st.v) && (!ONE_WAY[id] || ONE_WAY[id] === dir);
    const s = Engine.series(id); const prev = s.length > 1 ? s[s.length - 2] : null;
    const sustained = out && !!prev && outOf(prev.v) && (prev.v < b.v) === (st.v < b.v);
    const big = out && Math.abs(delta) > (r[1] - r[0]) * 0.75;
    return { id, st, base: b, range: r, delta, pct: b.v ? Math.round((delta / b.v) * 100) : 0, dir, out, sustained, flag: !st.stale && (sustained || big) };
  }

  /** One sentence: this reading against your own baseline. */
  function compareLine(id, c) {
    const x = compare(id, c); const ind = IND[id];
    if (!x) return '';
    if (x.st.v == null) return '';
    if (!x.base) return `No personal baseline for ${ind.short.toLowerCase()} yet, so this is judged against the general adult range. Add your pre-flight values in the medical profile, or keep logging: after 8 readings NovaCare uses your own first week.`;
    const sign = x.delta > 0 ? '+' : x.delta < 0 ? '−' : '±';
    return `${num(id, x.st.v)} ${ind.unit} now — ${sign}${num(id, Math.abs(x.delta))} against your ${x.base.label} baseline of ${num(id, x.base.v)} ${ind.unit}. Your own normal is ${num(id, x.range[0])}–${num(id, x.range[1])}: ${x.out ? `this is outside it${x.sustained ? ' for the second reading in a row' : ''}` : 'this is inside it'}.`;
  }

  /* ---------- provenance: where a reading came from, and whether it is confirmed ---------- */
  const srcOf = (md, id) => { const d = state.days[md]; return (d && d.src && d.src[id]) || 'self'; };
  function setSrc(day, id, kind) { if (!READING_SRC[kind] || kind === 'self') { if (day.src) delete day.src[id]; return; } day.src = day.src || {}; day.src[id] = kind; }
  /** A reading that jumped too far since the previous one and nobody has confirmed. */
  function unconfirmed(id) {
    if (!JUMP[id]) return null; const s = Engine.series(id); if (s.length < 2) return null;
    const last = s[s.length - 1], prev = s[s.length - 2]; const day = state.days[last.md];
    if (state.md - last.md > 1 || Math.abs(last.v - prev.v) <= JUMP[id]) return null;
    if (srcOf(last.md, id) === 'exam' || (day.ok && day.ok[id])) return null;
    return { id, last, prev };
  }
  function confirm(id) { const s = Engine.series(id); if (!s.length) return; const day = state.days[s[s.length - 1].md]; day.ok = day.ok || {}; day.ok[id] = new Date().toISOString(); }

  /* ---------- findings ---------- */
  /** The protocol for a finding, by key first, then indicator and direction, then indicator. */
  function protocolOf(...keys) {
    const id = keys.map((k) => k && PROTOCOL_FOR[k]).find(Boolean) || (keys.some((k) => /^Moderate pain/.test(k || '')) ? 'MED-21' : null); if (!id) return null;
    const e = KB.find((x) => x.id === id); if (!e) return null;
    return { id: 'KB-' + e.id, title: e.title, esc: e.esc, steps: e.steps || [], src: (e.src || []).map((k) => SRC[k]).filter(Boolean) };
  }
  function when(level, esc) {
    if (level >= 3) return `Now. ${esc.text} Press Help at once if you feel faint, confused, short of breath or have chest pain.`;
    if (level === 2) return `Today. ${esc.text} Press Help sooner if it gets worse or a new symptom appears.`;
    return 'Not yet. Handle it yourself and measure again at your next check-in. Tell the Crew Medical Officer if it is still there after 3 days, or as soon as you start to feel unwell.';
  }
  const whoFor = (level) => (level >= 3 ? 'Act now' : level === 2 ? 'Tell the crew' : 'Self-care');
  const nextChecks = (id) => (CHECK_NEXT[id] || []).filter((x) => IND[x] && !Engine.status(x).loggedToday);
  const sources = (id) => (typeof EVIDENCE !== 'undefined' && EVIDENCE[id] ? EVIDENCE[id] : []);

  /** Everything NovaCare has to say today, most serious first. */
  function findings(opts = {}) {
    if (!state || !state.days) return [];
    const lite = !!opts.lite; const protocol = lite ? () => null : protocolOf;
    const c = context(); const adv = Engine.advisories().filter((a) => a.key !== 'status'); const out = [];
    const ctxFor = (id) => c.notes.filter((n) => n.ids.includes(id)).map((n) => n.text);
    // one reading in the "attention" band is a "watch" until the previous reading of the same measurement was
    // out of range too; a reading in the danger band (level 3) and multi-day trends keep their level
    const calibrated = (a) => {
      if (a.trend || a.level !== 2 || !IND[a.ind]) return a.level;
      const s = Engine.series(a.ind); const prev = s.length > 1 ? s[s.length - 2] : null;
      return prev && state.md - prev.md <= 3 && Engine.classify(IND[a.ind], prev.v).level >= 1 ? 2 : 1;
    };
    // systolic and diastolic are one blood pressure finding
    const bp = adv.filter((a) => !a.trend && (a.key === 'sys' || a.key === 'dia'));
    if (bp.length === 2) {
      const [s0, d0] = [bp.find((a) => a.key === 'sys'), bp.find((a) => a.key === 'dia')];
      const high = Engine.status('sys').dir === 'high';
      adv.splice(adv.indexOf(d0), 1);
      adv[adv.indexOf(s0)] = { ...s0, key: 'bp', level: Math.max(s0.level, d0.level), title: high ? 'Blood pressure is above range' : 'Blood pressure is below range',
        detail: `${Engine.status('sys').v}/${Engine.status('dia').v} mmHg (logged MD ${Engine.status('sys').md})` };
    }
    adv.forEach((a0) => {
      const a = { ...a0, level: calibrated(a0) };
      const id = IND[a.ind] ? a.ind : null;
      out.push({ key: a.key, level: a.level, title: a.title, detail: a.detail, ind: id, kind: a.trend ? 'Trend' : a.key === 'status' ? 'Reported' : 'Reading',
        rule: a.key === 'status' ? 'N-STA-01' : a.trend ? `N-TRD-${a.key.replace(/^t-/, '').toUpperCase()}` : `N-THR-${a.key.toUpperCase()}`,
        cmp: id ? compareLine(id, c) : '', ctx: id ? ctxFor(id) : [], why: '', actions: a.actions, next: id ? nextChecks(id) : [],
        when: when(a.level, a.level === a0.level ? a.esc : { text: '' }), who: a.level === a0.level ? a.esc.who : whoFor(a.level), protocol: protocol(a.key, id && `${id}:${Engine.status(id).dir}`, id), sources: id ? sources(id) : [] });
    });
    PERSONAL_IDS.forEach((id) => {
      if (adv.some((a) => a.ind === id)) return;
      const x = compare(id, c); if (!x || !x.flag) return;
      const t = (PERSONAL_TEXT[id] || {})[x.dir]; if (!t) return;
      out.push({ key: 'p-' + id, level: 1, title: t.title, detail: `${IND[id].short}: ${num(id, x.st.v)} ${IND[id].unit} (MD ${x.st.md}) · your baseline ${num(id, x.base.v)}`, ind: id, kind: 'Personal',
        rule: `N-PER-${id.toUpperCase()}`, cmp: compareLine(id, c), ctx: ctxFor(id), why: t.why, actions: t.actions, next: nextChecks(id),
        when: when(1, {}), who: whoFor(1), protocol: protocol(`${id}:${x.dir}`, id), sources: sources(id) });
    });
    // symptoms from today's latest "How do you feel": one finding each, followed until they stop being reported
    const last = typeof Status !== 'undefined' ? Status.last() : null;
    if (last && last.md === state.md && last.level) {
      Status.evaluate(last.answers).findings.forEach((x) => {
        const slug = fold(x.text).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        if (out.some((f) => f.key === 'sym-' + slug)) return;
        out.push({ key: 'sym-' + slug, level: x.level, title: x.text, detail: `You reported it at ${new Date(last.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on MD ${last.md}`, ind: IND[x.ind] ? x.ind : null, kind: 'Reported',
          rule: `N-SYM-${slug.toUpperCase().slice(0, 18)}`, cmp: '', ctx: [], why: '', actions: [x.act], next: IND[x.ind] ? [x.ind].filter((id) => !Engine.status(id).loggedToday) : [],
          when: when(x.level, { text: SYM_ESC[x.level] || '' }), who: whoFor(x.level), protocol: protocol(x.text), sources: [], symptom: x.text });
      });
    }
    // early warnings: a trend that will leave the safe range soon, while there is time to act
    if (typeof Predict !== 'undefined') Predict.all().filter((p) => p.level > 0 && !out.some((f) => f.ind === p.ind)).forEach((p) => {
      out.push({ key: 'w-' + p.key, level: 1, title: `Early warning: ${p.title.toLowerCase()}`, detail: p.sum, ind: IND[p.ind] ? p.ind : null, kind: 'Early warning',
        rule: `N-PRD-${p.key.replace(/^p-/, '').toUpperCase()}`, cmp: `Now ${p.now} → ${p.future}${p.when ? ` in about ${Math.max(1, Math.round(p.when))} day${Math.round(p.when) === 1 ? '' : 's'}` : ''}.`, ctx: [],
        why: `${p.text} ${p.basis}`, actions: p.act, next: [], when: 'Not yet. Acting now is how it stays a warning. Tell the Crew Medical Officer if it keeps moving the same way.', who: 'Self-care',
        protocol: protocol(p.key, p.ind), sources: IND[p.ind] ? sources(p.ind) : [] });
    });
    Object.keys(JUMP).forEach((id) => {
      const u = unconfirmed(id); if (!u) return;
      out.push({ key: 'u-' + id, level: 1, title: `Confirm this reading: ${IND[id].short.toLowerCase()}`, detail: `${num(id, u.last.v)} ${IND[id].unit} on MD ${u.last.md}, after ${num(id, u.prev.v)} on MD ${u.prev.md}`, ind: id, kind: 'Unconfirmed',
        rule: `N-VAL-${id.toUpperCase()}`, cmp: `This jumped by ${num(id, Math.abs(u.last.v - u.prev.v))} ${IND[id].unit} since your previous reading (${READING_SRC[srcOf(u.last.md, id)].name.toLowerCase()}). A change this fast is more often a measuring problem than a real one.`, ctx: [],
        why: 'NovaCare does not act on a single surprising number. Until it is confirmed, the reading is kept but marked as unconfirmed.', actions: ['Measure again now, following the “How to measure” steps.', 'If the second reading agrees, confirm it — then it counts.', 'If you feel unwell, do not wait: press Help.'],
        next: [], when: 'If the second reading is just as far off, or you feel unwell, tell the Crew Medical Officer today.', who: 'Self-care', protocol: null, sources: [], confirmable: true });
    });
    return out.sort((a, b) => b.level - a.level);
  }

  /* ---------- decisions and outcomes ---------- */
  const decisions = () => (Array.isArray(state.decisions) ? state.decisions : []);
  function decide(key, act, f) {
    f = f || findings().find((x) => x.key === key); if (!f || !DECISION_ACTS[act]) return null;
    const st = f.ind ? Engine.status(f.ind) : {};
    const d = { key, title: f.title, level: f.level, ind: f.ind, v: st.v ?? null, md: state.md, at: new Date().toISOString(), act, rule: f.rule };
    state.decisions = [...decisions(), d].slice(-200); Engine.save(); return d;
  }
  const lastDecision = (key) => decisions().filter((d) => d.key === key && d.md === state.md).pop() || null;
  /** Each decision with what happened afterwards. */
  function history() {
    const now = findings();
    return decisions().slice().reverse().map((d) => {
      const live = now.find((f) => f.key === d.key); const st = d.ind && IND[d.ind] ? Engine.status(d.ind) : null;
      const moved = st && d.v != null && st.v != null && st.v !== d.v ? `${num(d.ind, d.v)} → ${num(d.ind, st.v)} ${IND[d.ind].unit}` : '';
      return { ...d, outcome: live ? (live.level < d.level ? 'Improving' : live.level > d.level ? 'Worse' : 'Still active') : 'Cleared', outLevel: live ? live.level : 0, moved };
    });
  }

  /** Table rows: you against your baseline. */
  function table() {
    const c = context();
    return PERSONAL_IDS.map((id) => ({ id, ...compare(id, c) }));
  }

  return { baseline, context, range, compare, compareLine, findings, decide, lastDecision, history, decisions, table, srcOf, setSrc, unconfirmed, confirm };
})();

/* ---------- onboard self-test: does NovaCare really work without Earth? ---------- */
const Autonomy = (() => {
  let last = null;
  const host = () => (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || /\.local(host)?$/.test(location.hostname) ? 'ship' : location.protocol === 'file:' ? 'file' : 'web');
  /** The parts NovaCare is made of, and where each one runs. */
  function parts() {
    return [
      { id: 'records', name: 'Medical records', where: 'This device', detail: 'Readings, medical profile and decisions' },
      { id: 'rules', name: 'Medication rules engine', where: 'This device', detail: `Allergies, interactions, doses · rules ${typeof RULES_VERSION !== 'undefined' ? RULES_VERSION : '—'}` },
      { id: 'kb', name: 'Medical protocols', where: 'This device', detail: `${typeof KB !== 'undefined' ? KB.length : 0} protocols · version ${typeof KB_VERSION !== 'undefined' ? KB_VERSION : '—'}` },
      { id: 'analysis', name: 'Personal analysis', where: 'This device', detail: `Baselines, trends and findings · ${INSIGHT_VERSION}` },
      { id: 'osdr', name: 'NASA research references', where: 'This device', detail: `OSDR snapshot ${typeof OSDR !== 'undefined' ? OSDR.snapshot : '—'}` },
      { id: 'cache', name: 'The app itself', where: 'This device', detail: 'Stored so it opens with no link' },
    ];
  }
  async function run() {
    const res = {}; const set = (id, ok, text) => { res[id] = { ok, text }; };
    try { const k = 'novacare.selftest'; localStorage.setItem(k, '1'); const ok = localStorage.getItem(k) === '1'; localStorage.removeItem(k);
      const days = Object.values(state.days || {}).filter((d) => Object.keys(d.vals || {}).length).length; set('records', ok, ok ? `Readable and writable · ${days} day${days === 1 ? '' : 's'} of readings stored` : 'Storage is not writable'); }
    catch (e) { set('records', false, 'Storage is blocked in this browser'); }
    try { // a known case: someone allergic to penicillin must never be cleared for amoxicillin
      const r = Rules.check('antibioticPen', { me: false, name: 'Test Crew', latest: {}, med: { blood: '', allergies: ['penicillin'], other: '', meds: [], conditions: [], notes: '', baseline: {} } });
      const ok = r.status === 'block' && r.rules.some((x) => x.id === 'R-ALG-01'); set('rules', ok, ok ? 'Test case passed: amoxicillin blocked for a penicillin allergy (R-ALG-01)' : 'Test case FAILED: an allergy was not blocked'); }
    catch (e) { set('rules', false, 'Rules engine did not answer: ' + e.message); }
    try { const h = KBSearch.search('smoke in the cabin', 1); const h2 = KBSearch.search('headache', 1); const ok = h.length > 0 && h2.length > 0;
      set('kb', ok, ok ? `Local search answered: “${h2[0].e.title}”, “${h[0].e.title}”` : 'Local search returned nothing'); }
    catch (e) { set('kb', false, 'Protocol search failed: ' + e.message); }
    try { const n = Insight.findings().length; const b = Insight.table().filter((x) => x.base).length; set('analysis', true, `${b} personal baseline${b === 1 ? '' : 's'} in use · ${n} finding${n === 1 ? '' : 's'} computed`); }
    catch (e) { set('analysis', false, 'Analysis failed: ' + e.message); }
    try { const ok = typeof OSDR !== 'undefined' && Object.keys(OSDR.systems || {}).length > 0; set('osdr', ok, ok ? `${Object.keys(OSDR.systems).length} body systems with studies stored (opening a study page needs a link)` : 'Snapshot missing'); }
    catch (e) { set('osdr', false, 'Snapshot missing'); }
    try {
      if (host() === 'file') set('cache', true, 'Opened straight from the ship’s disk — no server at all');
      else if (!('caches' in window)) set('cache', false, 'This browser cannot store the app for offline use');
      else { const keys = (await caches.keys()).filter((k) => k.startsWith('novacare-')); let n = 0; for (const k of keys) n += (await (await caches.open(k)).keys()).length;
        set('cache', n > 20, n > 20 ? `${n} files stored${host() === 'ship' ? ' and served by the ship terminal' : ''}` : 'Not stored yet — open NovaCare once with a link, then it works without one'); }
    } catch (e) { set('cache', false, 'Could not read the offline store'); }
    const core = ['records', 'rules', 'kb', 'analysis', 'cache']; const passed = core.filter((id) => res[id] && res[id].ok).length;
    let llm = false; try { llm = await LocalLLM.ping(); } catch (e) { /* not running */ }
    last = { at: new Date().toISOString(), res, passed, total: core.length, independent: passed === core.length, host: host(), online: navigator.onLine !== false, llm };
    return last;
  }
  return { run, parts, host, last: () => last };
})();

/* ---------- help when alone: "Are you OK?" after a critical reading ---------- */
const WELFARE_SECONDS = 60;
const autoAlertOn = () => !state || state.autoAlert !== false;

/* ---------- UI: built only from the app's existing components (advisory, sheet, settings row) ---------- */
/* "Are you OK?" — after a critical reading. Silence alerts the crew. */
function welfareHtml(m) {
  const left = Math.max(0, Math.ceil((m.until - Date.now()) / 1000));
  return `<div class="sheet narrow" role="alertdialog" aria-modal="true" aria-label="Are you OK?">
    <header><span class="emg-ic">${icon('siren')}</span><div class="grow"><p class="kicker">Critical reading</p><h2>Are you OK?</h2></div></header>
    <div class="sheet-b one">
      <ul class="hints">${m.items.map((x) => `<li>${esc(IND[x.id].name)}: ${Engine.fmt(IND[x.id], x.v)} ${IND[x.id].unit}</li>`).join('')}</ul>
      <p>${m.sent ? '<b>Your crew has been alerted.</b>' : `No answer in <b id="wf-left" class="num">${left}</b> seconds and NovaCare alerts your crew for you.`}</p>
      <p class="muted small">If the number looks wrong, measure again — a loose cuff or a cold finger can cause this.</p>
    </div>
    <footer><button class="btn ghost lg" data-act="wfok">${icon('check')}I am OK</button><button class="btn sos lg save-big" data-act="wfhelp">${icon('siren')}I need help</button></footer>
  </div>`;
}

/* Emergency steps before signing in: no account, no waiting. Same screens as the emergency flow. */
function firstAidHtml(m) {
  if (!m.em) {
    return `<div class="sheet narrow emg" role="dialog" aria-modal="true" aria-label="Emergency instructions">
      <header><span class="emg-ic">${icon('siren')}</span><div class="grow"><h2>Emergency instructions</h2><p class="muted small">No sign-in needed. Tap what is happening.</p></div><button class="x" data-act="close" aria-label="Close">${icon('x')}</button></header>
      <div class="sheet-b one">
        <div class="emg-pick">${EMERGENCIES.map((e) => `<button data-act="fatype" data-v="${e.id}">${icon(e.icon)}<span>${e.name}</span></button>`).join('')}</div>
        <p class="muted small">Shout for the crew first. Sign in when you can to alert them from here and to see the person’s allergies and medication.</p></div></div>`;
  }
  const e = EMG[m.em];
  return `<div class="sheet narrow emg" role="dialog" aria-modal="true" aria-label="Emergency protocol">
    <header class="emg-h"><span class="emg-ic">${icon(e.icon)}</span><div class="grow"><h2>${e.name}</h2><p class="small">Started <span id="em-timer" class="num" data-start="${m.start}">0:00</span> ago</p></div><button class="x" data-act="close" aria-label="Close">${icon('x')}</button></header>
    <div class="sheet-b one">
      <p class="emg-alg-line">${icon('care')}<b>Allergies unknown.</b> Ask them, or check their record, before giving any medicine.</p>
      <h3>Do this now</h3>
      <p><button class="btn ghost sm" data-act="emgspeak">${icon('mic')}${m.speaking ? 'Stop reading' : 'Read the steps aloud'}</button></p>
      <ol class="steps">${e.steps.map((s, k) => `<li><button data-act="fastep" data-k="${k}" aria-pressed="${!!m.done[k]}" class="${m.done[k] ? 'done' : ''}"><span class="n num">${m.done[k] ? icon('check') : k + 1}</span><span>${esc(s)}</span></button></li>`).join('')}</ol>
      <p class="emg-foot">Protocol EMG-${e.id}: ${esc(Protocols.text('EMG-' + e.id))}. Supports, never replaces, your mission’s medical checklists and the Crew Medical Officer. Prototype — not a medical device.</p>
    </div>
    <footer class="emg-bar"><button class="btn ghost lg" data-act="faback">Other situation</button><button class="btn primary lg save-big" data-act="close">${icon('user')}Sign in for the full record</button></footer>
  </div>`;
}

/* ---------- care cases: every finding is followed until it is discharged ----------
   A finding opens a case. The case schedules re-checks, tracks each reading, and closes ("discharged")
   when the measurement is back in the person's own normal on 2 separate days. Findings that needed the
   crew (Attention or higher) are not closed by NovaCare alone: they wait for the Crew Medical Officer. */
const CARE_CLEAR = 2;                       // readings back in range needed for discharge
const RECHECK_DAYS = { 1: 2, 2: 1, 3: 0 };  // when to measure again, by level (0 = today)

const Care = (() => {
  const all = () => (state.cases && typeof state.cases === 'object' ? state.cases : (state.cases = {}));
  const inRange = (id, v) => { if (!IND[id]) return true; if (Engine.classify(IND[id], v).level > 0) return false; const r = Insight.range(id); if (!r) return true; const way = ONE_WAY[id]; return way === 'low' ? v >= r[0] : way === 'high' ? v <= r[1] : v >= r[0] && v <= r[1]; };
  /** Open, update and close cases from today's findings. Returns true when something changed. */
  function sync() {
    if (!state || !state.days) return false;
    const cases = all(); const now = Insight.findings(); let changed = false; const at = new Date().toISOString();
    now.forEach((f) => {
      let c = Object.values(cases).find((x) => x.key === f.key && x.status !== 'discharged');
      if (!c) {
        c = { id: `${f.key}@${state.md}`, key: f.key, title: f.title, ind: f.ind, level: f.level, rule: f.rule, openedMd: state.md, openedAt: at,
          status: 'new', recheckMd: state.md + (RECHECK_DAYS[f.level] ?? 1), seenMd: state.md, peak: f.level, events: [{ md: state.md, at, text: 'Opened', level: f.level }] };
        cases[c.id] = c; changed = true;
      } else {
        c.seenAt = at; if (c.seenMd !== state.md || c.level !== f.level) { if (c.level !== f.level) c.events.push({ md: state.md, at, text: f.level > c.level ? 'Got worse' : 'Improving', level: f.level }); c.level = f.level; c.peak = Math.max(c.peak, f.level); c.seenMd = state.md; c.title = f.title; changed = true; }
        if (c.status === 'review' || c.status === 'clearing') { c.status = 'following'; c.events.push({ md: state.md, at, text: 'Came back', level: f.level }); changed = true; }
      }
    });
    Object.values(cases).forEach((c) => {
      if (c.status === 'discharged' || now.some((f) => f.key === c.key)) return;
      // the finding is gone: count readings back in range since it was last seen
      const clear = c.key.startsWith('sym-') ? (typeof Status !== 'undefined' ? Status.list().filter((u) => u.at > (c.seenAt || c.openedAt) && !(u.findings || []).includes(c.title)).length : 0)
        : c.ind && IND[c.ind] ? Engine.series(c.ind).filter((p) => p.md > c.seenMd && inRange(c.ind, p.v)).length : Math.max(0, state.md - c.seenMd);
      if (clear !== c.clear) { c.clear = clear; changed = true; }
      if (clear >= CARE_CLEAR) {
        if (c.peak >= 2) { if (c.status !== 'review') { c.status = 'review'; c.events.push({ md: state.md, at, text: c.key.startsWith('sym-') ? 'No longer reported — ready for discharge' : 'Back in range — ready for discharge', level: 0 }); changed = true; } }
        else { c.status = 'discharged'; c.dischargedAt = at; c.dischargedMd = state.md; c.by = c.key.startsWith('sym-') ? `NovaCare (not reported in ${CARE_CLEAR} updates)` : 'NovaCare (back in your range on 2 days)'; c.events.push({ md: state.md, at, text: 'Discharged', level: 0 }); changed = true; }
      } else if (clear >= 1 && c.status !== 'clearing') { c.status = 'clearing'; changed = true; } // no new reading is not an improvement
    });
    // discharges the Crew Medical Officer signed for me on their own device
    const u = Auth.user(); const mine = (a) => u && (a.aboutId === u.id || (u.uid && a.aboutId === u.uid));
    if (typeof Crew !== 'undefined') Crew.alerts().filter((a) => a.type === 'care' && mine(a)).forEach((a) => {
      const c = cases[a.note]; if (!c || c.status === 'discharged') return;
      c.status = 'discharged'; c.dischargedAt = a.createdAt; c.dischargedMd = state.md; c.by = a.fromName; c.events.push({ md: state.md, at: a.createdAt, text: `Discharged by ${a.fromName}`, level: 0 }); changed = true;
    });
    // keep the record small: discharged cases older than 60 days go
    Object.values(cases).forEach((c) => { if (c.status === 'discharged' && c.dischargedMd < state.md - 60) delete cases[c.id]; });
    if (changed) Engine.save();
    return changed;
  }
  const open = () => Object.values(all()).filter((c) => c.status !== 'discharged').sort((a, b) => (b.status === 'review') - (a.status === 'review') || b.level - a.level || a.openedMd - b.openedMd);
  const discharged = (days = 7) => Object.values(all()).filter((c) => c.status === 'discharged' && c.dischargedMd > state.md - days);
  const get = (id) => all()[id];
  const finding = (c) => Insight.findings().find((f) => f.key === c.key) || null;
  /** Seen = the person opened it. Started = they did something about it. */
  function seen(id) { const c = get(id); if (c && c.status === 'new') { c.status = 'following'; Engine.save(); } }
  function act(id, text) { const c = get(id); if (!c) return; if (c.status === 'new') c.status = 'following'; c.events.push({ md: state.md, at: new Date().toISOString(), text, level: c.level }); Engine.save(); }
  /** Is a re-check due now? */
  const due = (c) => c.status !== 'discharged' && c.status !== 'review' && !c.key.startsWith('sym-') && state.md >= c.recheckMd && c.ind && IND[c.ind] && !Engine.status(c.ind).loggedToday;
  function measured(id) { const c = get(id); if (!c) return; c.recheckMd = state.md + (RECHECK_DAYS[c.level] || 1); Engine.save(); }
  function discharge(id, by) { const c = get(id); if (!c) return; c.status = 'discharged'; c.dischargedAt = new Date().toISOString(); c.dischargedMd = state.md; c.by = by; c.events.push({ md: state.md, at: c.dischargedAt, text: `Discharged by ${by}`, level: 0 }); Engine.save(); }
  /** One line: where this case stands. */
  function stage(c) {
    if (c.status === 'discharged') return { label: 'Discharged', cls: 'l0', text: `Discharged MD ${c.dischargedMd} · ${c.by}` };
    if (c.status === 'review') return { label: 'Ready for discharge', cls: 'l0', text: `${c.key.startsWith('sym-') ? `Not reported in ${CARE_CLEAR} updates` : 'Back in your range on 2 days'}. The Crew Medical Officer confirms the discharge.` };
    if (c.key.startsWith('sym-')) return c.status === 'clearing' ? { label: 'Improving', cls: 'l0', text: `Not reported in ${c.clear || 0} of the ${CARE_CLEAR} updates needed for discharge.` }
      : { label: c.status === 'new' ? 'New' : 'Following', cls: lc(c.level), text: `Next check: “How do you feel” in about ${typeof Status !== 'undefined' ? Status.every() : 8} h. It closes after ${CARE_CLEAR} updates without it.` };
    if (c.status === 'clearing') return { label: 'Improving', cls: 'l0', text: `Back in range ${c.clear || 0} of ${CARE_CLEAR} times needed for discharge.` };
    const when = c.recheckMd <= state.md ? 'today' : c.recheckMd === state.md + 1 ? 'tomorrow' : `MD ${c.recheckMd}`;
    return { label: c.status === 'new' ? 'New' : 'Following', cls: lc(c.level), text: c.ind && IND[c.ind] ? `Next check ${when}: ${IND[c.ind].short.toLowerCase()}.` : `Next check ${when}.` };
  }
  return { sync, open, discharged, get, finding, seen, act, due, measured, discharge, stage, all };
})();

/* The recommendation, as the astronaut sees it: short, with the follow-up, and the reasons one tap away. */
function caseHtml(m) {
  const c = Care.get(m.id); if (!c) return '';
  const f = Care.finding(c); const st = Care.stage(c); const p = f && f.protocol;
  const steps = f ? f.actions.slice(0, 3) : [];
  return `<div class="sheet narrow case" role="dialog" aria-modal="true" aria-label="${esc(c.title)}">
    <header><div class="grow"><p class="kicker">${f ? esc(f.who) : 'Follow-up'} · since day ${c.openedMd}</p><h2>${esc(c.title)}</h2></div><button class="x" data-act="close" aria-label="Close">${icon('x')}</button></header>
    <div class="sheet-b one">
      <p class="case-st ${st.cls}"><span class="dot"></span><span><b>${st.label}.</b> ${esc(st.text)}</span></p>
      ${f ? `<p class="case-what">${esc(f.detail)}</p>
        <h3>Do this</h3><ol class="case-do">${steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
        <p class="esc"><b>Get help:</b> ${esc(f.when)}</p>` : '<p class="muted">The finding is gone. NovaCare keeps watching until it is discharged.</p>'}
      ${f ? `<details class="evid"><summary>${icon('shield')}Why, and the medical protocol</summary><div class="case-why">
        ${f.cmp ? `<p>${esc(f.cmp)}</p>` : ''}${f.why ? `<p>${esc(f.why)}</p>` : ''}${f.ctx.map((x) => `<p class="muted small">${esc(x)}</p>`).join('')}
        ${p ? `<p><b>Onboard protocol ${esc(p.id)} — ${esc(p.title)}</b> <small class="muted">(knowledge base ${esc(KB_VERSION)}, ${esc(Protocols.text(p.id))})</small></p><ol>${p.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol><p class="muted small">Escalate: ${esc(p.esc)}</p>` : ''}
        <p class="muted small">Rule ${esc(f.rule)} (finding rules ${esc(Protocols.text('ANALYSIS'))})${[...(p ? p.src : []), ...f.sources].slice(0, 3).map((s) => ` · <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join('')}</p></div></details>` : ''}
      <details class="evid"><summary>${icon('file')}Follow-up so far · ${c.events.length}</summary><ul>${c.events.slice().reverse().slice(0, 8).map((e) => `<li>MD ${e.md} — ${esc(e.text)}</li>`).join('')}</ul></details>
    </div>
    <footer>${c.status === 'review'
      ? `<button class="btn ghost lg" data-act="close">Later</button><button class="btn primary lg save-big" data-act="casedischarge" data-id="${esc(c.id)}">${icon('check')}${Protocols.signer() ? 'Discharge — I am the Crew Medical Officer' : 'Ask the Crew Medical Officer to discharge'}</button>`
      : `${f && f.level >= 2 ? `<button class="btn ghost lg" data-act="inscrew" data-key="${esc(c.key)}">${icon('users')}Tell the crew</button>` : `<button class="btn ghost lg" data-act="insask" data-q="${esc(c.ind && IND[c.ind] ? `How is my ${IND[c.ind].short.toLowerCase()}?` : c.title)}">${icon('chat')}Ask</button>`}
         ${c.ind && IND[c.ind] ? `<button class="btn ghost lg" data-act="casemeasure" data-id="${esc(c.id)}">${icon('refresh')}Measure</button>` : ''}
         <button class="btn primary lg save-big" data-act="casedid" data-id="${esc(c.id)}">${icon('check')}I did it</button>`}</footer>
  </div>`;
}

/* My health: one line per case. The detail comes as a notification and opens on tap. */
function careCard() {
  const open = Care.open(); const done = Care.discharged();
  const head = !open.length ? (done.length ? 'Nothing open — all discharged.' : 'Nothing to follow. You are in your normal range.')
    : `${open.length} ${open.length > 1 ? 'things' : 'thing'} in follow-up`;
  const show = ui.allAdv ? open : open.slice(0, 4);
  return `<section class="card care" id="findings" aria-label="Your care">
    <div class="card-h"><div><h2>${icon('care')}Your care</h2><p class="muted small">${esc(head)}${done.length ? ` · ${done.length} discharged this week` : ''}</p></div></div>
    ${show.length ? `<ul class="care-l">${show.map((c) => { const st = Care.stage(c); return `<li><button class="${lc(c.status === 'clearing' || c.status === 'review' ? 0 : c.level)}" data-act="case" data-v="${esc(c.id)}">
      <span class="dot"></span><span class="care-t"><b>${esc(c.title)}</b><small>${esc(st.text)}</small></span><span class="pill ${st.cls}">${st.label}</span>${icon('next', 'care-go')}</button></li>`; }).join('')}</ul>` : ''}
    ${open.length > 4 ? `<button class="btn quiet sm" data-act="alladv">${ui.allAdv ? 'Show fewer' : `Show ${open.length - 4} more`}</button>` : ''}
  </section>`;
}

/* ---------- charts: one measurement per small chart, the person's normal range shaded ----------
   Single series, so no categorical colours: the line is ink, the shaded band is the safe range, and the
   last point carries the status colour together with its symbol and word. Hover shows each reading. */
function miniChart(id, pts, opts = {}) {
  const ind = IND[id]; if (!ind || !pts || !pts.length) return '';
  const W = 240, H = 72, L = 6, R = 12, T = 10, B = 16;
  const c = id === 'mass' ? { baselineMass: pts[0][1], baselineHr: null } : (opts.ctx || Engine.ctx());
  const b = ind.bands(Engine.env(), c); const vs = pts.map((p) => p[1]);
  let lo = Math.min(...vs), hi = Math.max(...vs);
  const okLo = Number.isFinite(b.ok[0]) ? b.ok[0] : lo, okHi = Number.isFinite(b.ok[1]) ? b.ok[1] : hi;
  if (ind.type === 'scale') { lo = ind.min; hi = ind.max; }
  else { // scale to the readings so change is visible, but never narrower than a quarter of the safe range
    const minSpan = Math.max((okHi - okLo) * 0.25, ind.step * 4); const mid = (lo + hi) / 2;
    if (hi - lo < minSpan) { lo = mid - minSpan / 2; hi = mid + minSpan / 2; }
  }
  const pad = (hi - lo) * 0.12 || 1; lo -= pad; hi += pad;
  const d0 = pts[0][0], d1 = pts[pts.length - 1][0];
  const x = (md) => L + (d1 > d0 ? (md - d0) / (d1 - d0) : 0.5) * (W - L - R);
  const y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const lv = (v) => Engine.classify(ind, v, c).level; const last = pts[pts.length - 1];
  const bTop = Math.min(hi, okHi), bBot = Math.max(lo, okLo);
  const band = bTop > bBot ? `<rect class="mc-band" x="${L}" y="${y(bTop).toFixed(1)}" width="${W - L - R}" height="${Math.max(1, y(bBot) - y(bTop)).toFixed(1)}" rx="3"/>` : '';
  const line = pts.length > 1 ? `<path class="mc-line" d="${pts.map(([d, v], k) => `${k ? 'L' : 'M'}${x(d).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')}"/>` : '';
  const data = pts.map(([d, v]) => `${d}:${v}`).join(';');
  const label = `${ind.name}: ${pts.length} reading${pts.length > 1 ? 's' : ''} from MD ${d0} to MD ${d1}, latest ${Engine.fmt(ind, last[1])} ${ind.unit}`;
  return `<svg class="mc-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}" data-id="${id}" data-pts="${data}" data-c="${c.baselineMass || ''}">${band}${line}
    <circle class="mc-pt ${lc(lv(last[1]))}" cx="${x(last[0]).toFixed(1)}" cy="${y(last[1]).toFixed(1)}" r="4"/>
    <line class="mc-x" x1="0" x2="0" y1="${T}" y2="${H - B}" hidden/><circle class="mc-h" r="4" hidden/>
    <text class="mc-ax" x="${L}" y="${H - 3}">MD ${d0}</text><text class="mc-ax" x="${W - R}" y="${H - 3}" text-anchor="end">MD ${d1}</text></svg>`;
}
/** A chart tile: the name, the latest value with its status, and the chart. */
function chartTile(id, pts, latest, opts = {}) {
  const ind = IND[id]; const l = latest || {}; const lvl = l.v == null ? -1 : l.level;
  let val = l.v == null ? '—' : ind.type === 'scale' ? esc(Engine.label(ind, l.v)) : `${Engine.fmt(ind, l.v)}<small> ${ind.unit}</small>`;
  if (id === 'sys' && l.v != null && opts.dia != null) val = `${l.v}/${opts.dia}<small> mmHg</small>`;
  return `<figure class="mc ${lc(lvl)}"><figcaption><span class="mc-n">${esc(opts.name || ind.short)}</span><b class="num">${val}</b>
      <span class="mc-s"><span class="dot"></span>${l.v == null ? 'No readings' : `${levelText(lvl)}${l.md ? ` · MD ${l.md}` : ''}`}</span></figcaption>
    ${pts && pts.length ? miniChart(id, pts, opts) : `<p class="muted small mc-none">${l.v != null ? 'Only the latest reading is shared so far — the history appears after their next sync with the updated app.' : 'Not measured in the last 30 days.'}</p>`}<span class="mc-tip" hidden></span></figure>`;
}
/** Charts for one person: the series and latest values come from their summary (or from your own record). */
function healthCharts(m, ids) {
  const s = m.series || {};
  return `<div class="mc-grid">${ids.map((id) => chartTile(id, s[id], m.latest[id], id === 'sys' ? { name: 'Blood pressure', dia: (m.latest.dia || {}).v } : {})).join('')}</div>`;
}
/** Exam results: the latest of each, or that it has not been done. */
function examList(m) {
  return `<ul class="mres">${EXAM_IDS.map((id) => { const l = m.latest[id] || {}; const lvl = l.v == null ? -1 : l.level;
    return `<li class="${lc(lvl)}"><span class="dot"></span><b>${esc(IND[id].short)}</b><span>${l.v == null ? 'Not done yet' : `${esc(Engine.label(IND[id], l.v))} · MD ${l.md}`}</span></li>`; }).join('')}</ul>`;
}
/* hover: a crosshair and the reading under the pointer */
document.addEventListener('pointermove', (ev) => {
  const svg = ev.target.closest && ev.target.closest('.mc-svg'); const tips = document.querySelectorAll('.mc-tip:not([hidden])');
  tips.forEach((t) => { if (!svg || !svg.parentElement.contains(t)) { t.hidden = true; const s2 = t.parentElement.querySelector('.mc-svg'); if (s2) { s2.querySelector('.mc-x').setAttribute('hidden', ''); s2.querySelector('.mc-h').setAttribute('hidden', ''); } } });
  if (!svg) return;
  const ind = IND[svg.dataset.id]; const pts = svg.dataset.pts.split(';').map((p) => p.split(':').map(Number)); if (!ind || !pts.length) return;
  const r = svg.getBoundingClientRect(); const vb = svg.viewBox.baseVal; const px = ((ev.clientX - r.left) / r.width) * vb.width;
  const path = svg.querySelector('.mc-line'); const W = vb.width, L = 6, R = 12; const d0 = pts[0][0], d1 = pts[pts.length - 1][0];
  const x = (md) => L + (d1 > d0 ? (md - d0) / (d1 - d0) : 0.5) * (W - L - R);
  const near = pts.reduce((a, p) => (Math.abs(x(p[0]) - px) < Math.abs(x(a[0]) - px) ? p : a), pts[0]);
  const pt = svg.querySelector('.mc-pt'); const yy = (() => { if (!path) return +pt.getAttribute('cy'); const seg = path.getAttribute('d').split(/[ML]/).filter(Boolean)[pts.indexOf(near)]; return seg ? +seg.trim().split(' ')[1] : +pt.getAttribute('cy'); })();
  const xl = svg.querySelector('.mc-x'), hc = svg.querySelector('.mc-h');
  xl.setAttribute('x1', x(near[0])); xl.setAttribute('x2', x(near[0])); xl.removeAttribute('hidden');
  hc.setAttribute('cx', x(near[0])); hc.setAttribute('cy', yy); hc.removeAttribute('hidden');
  const c = svg.dataset.c ? { baselineMass: +svg.dataset.c } : Engine.ctx(); const lvl = Engine.classify(ind, near[1], c).level;
  const tip = svg.parentElement.querySelector('.mc-tip');
  tip.innerHTML = `<b>MD ${near[0]}</b> ${ind.type === 'scale' ? esc(Engine.label(ind, near[1])) : `${Engine.fmt(ind, near[1])} ${ind.unit}`} · <span class="${lc(lvl)}">${LEVELS[lvl].sym} ${LEVELS[lvl].name}</span>`;
  tip.hidden = false; tip.style.left = `${Math.min(Math.max(0, (x(near[0]) / W) * r.width - 40), r.width - 150)}px`;
});

/* ---------- care milestones: what the old points and patches become ---------- */
function careMilestones() {
  const p = Medical.mine(); const run = (pred) => { let best = 0, n = 0; for (let d = 1; d <= state.md; d++) { if (pred(state.days[d])) { n++; best = Math.max(best, n); } else n = 0; } return best; };
  const full = (day) => !!day && (day.checkinAt || Engine.checkedIn(day));
  const e = Engine.env(); const val = (k, f) => (day) => !!day && day.vals[k] != null && f(day.vals[k]);
  const cases = typeof Care !== 'undefined' ? Object.values(Care.all()) : [];
  return [
    { icon: '✚', name: 'Medical profile', desc: 'Allergies, medication and blood type recorded', got: !Medical.empty(p) && !!p.blood },
    { icon: '◎', name: 'Personal baseline', desc: 'Pre-flight heart rate and blood pressure recorded', got: !!(p.baseline && p.baseline.hr && p.baseline.sys) },
    { icon: '✦', name: 'First check-in', desc: 'Your record has started', got: run(full) >= 1 },
    { icon: '7', name: 'Complete week', desc: 'A check-in every day for 7 days', got: run(full) >= 7 },
    { icon: '✓', name: 'First discharge', desc: 'A follow-up closed back in your normal range', got: cases.some((c) => c.status === 'discharged') },
    { icon: '▤', name: 'Exam on record', desc: 'An ECG, urine test, ultrasound or CMO exam recorded', got: EXAM_IDS.some((id) => Engine.series(id).length) },
    { icon: '⛭', name: 'Countermeasure kept', desc: 'Exercise prescription met 5 days running', got: run(val('exercise', (v) => v >= e.exTarget * 0.75)) >= 5 },
    { icon: '☾', name: 'Sleep protected', desc: '7+ hours of sleep 5 nights running', got: run(val('sleep', (v) => v >= 7)) >= 5 },
  ];
}
