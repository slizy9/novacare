/* NOVACARE — status updates: a 30-second check every few hours between daily check-ins.
   Simple tap answers; follow-up questions appear only when an answer calls for them.
   Serious answers become an advisory (and point to emergency help); everything is saved
   with the person's mission data, so it syncs and reaches the crew summary. */

const STATUS_EVERY = [4, 6, 8, 12, 24]; // hours between updates (Settings)

/* Questions. `show(a)` decides whether a follow-up applies, from the answers so far.
   Feeling great or good is one tap; anything else asks one "what's going on" screen,
   and only red-flag answers ask a follow-up. */
const STATUS_QS = [
  { id: 'feel', q: 'How do you feel right now?', type: 'one',
    opts: [[5, 'Great'], [4, 'Good'], [3, 'Okay'], [2, 'Not well'], [1, 'Bad']] },
  { id: 'sym', q: 'What’s going on?', type: 'many', show: (a) => a.feel <= 3,
    opts: [['none', 'Nothing specific'], ['tired', 'Very tired'], ['pain', 'Pain'], ['fever', 'Fever or chills'], ['low', 'Low or anxious'],
      ['nausea', 'Nausea'], ['dizzy', 'Dizziness'], ['breath', 'Short of breath'], ['vision', 'Vision change'], ['cough', 'Cough']] },
  { id: 'painWhere', q: 'Where does it hurt?', type: 'many', show: (a) => has(a.sym, 'pain'),
    opts: [['head', 'Head'], ['chest', 'Chest'], ['back', 'Back'], ['belly', 'Stomach'], ['limbs', 'Arms or legs'], ['eyes', 'Eyes']] },
  { id: 'painHow', q: 'How bad is it?', type: 'one', show: (a) => has(a.sym, 'pain'),
    opts: [[1, 'Mild'], [2, 'Moderate'], [3, 'Severe']] },
  { id: 'breathRest', q: 'Are you short of breath right now, at rest?', type: 'one', show: (a) => has(a.sym, 'breath'),
    opts: [['no', 'No, only on effort'], ['yes', 'Yes, at rest']] },
  { id: 'visionHow', q: 'How has your vision changed?', type: 'one', show: (a) => has(a.sym, 'vision'),
    opts: [['near', 'Blurry up close'], ['far', 'Blurry far away'], ['sudden', 'Sudden loss or flashes']] },
  { id: 'dizzyFaint', q: 'Did you faint or nearly faint?', type: 'one', show: (a) => has(a.sym, 'dizzy'),
    opts: [['no', 'No'], ['yes', 'Yes']] },
  { id: 'talk', q: 'Would you like to talk to someone?', type: 'one', show: (a) => a.feel <= 1 || has(a.sym, 'low'),
    opts: [['no', 'Not now'], ['yes', 'Yes, please']] },
];
const has = (v, x) => Array.isArray(v) && v.includes(x);

const Status = (() => {
  const list = () => (Array.isArray(state.updates) ? state.updates : []);
  const every = () => (STATUS_EVERY.includes(state.updateEvery) ? state.updateEvery : 8);
  const last = () => list()[list().length - 1] || null;
  const opened = Date.now(); // never ask right after the app opens
  /** Since when to count: the later of the last update and today's check-in. Null = nothing yet. */
  function since() {
    const day = state.days && state.days[state.md];
    const ci = day && day.checkinAt ? new Date(day.checkinAt).getTime() : day && Engine.checkedIn(day) ? opened : 0;
    const l = last(); const lu = l && l.md === state.md ? new Date(l.at).getTime() : 0;
    return Math.max(ci, lu) || null;
  }
  /** Hours until the next update. Infinity = not asked today (no check-in yet). */
  function dueIn() { const s = since(); if (!s) return Infinity; return every() - (Date.now() - s) / 36e5; }
  /** Only after today's check-in, every few hours, and never in the first minutes after opening. */
  const due = () => dueIn() <= 0 && Date.now() - opened > 10 * 60000;
  /** The questions that apply, given the answers so far. */
  const steps = (a) => STATUS_QS.filter((q) => !q.show || q.show(a));

  /** Turn answers into a level (0–3), plain-language findings and what to do. */
  function evaluate(a0) {
    const f = []; // { level, text, act, ind }
    // older updates kept "feelWhy" and a separate "pain" question: fold them into one list
    const sym = [...(a0.sym || []), ...(a0.feelWhy || [])].map((x) => (x === 'sick' ? 'fever' : x));
    const a = { ...a0, sym, feelWhy: sym, pain: a0.pain === 'yes' || sym.includes('pain') ? 'yes' : 'no' };
    const where = a.painWhere || [];
    if (a.pain === 'yes' && has(where, 'chest')) f.push({ level: 3, text: 'Chest pain', act: 'Stop what you are doing, rest, and get the Crew Medical Officer now.', ind: 'hr', emg: 'chest' });
    if (a.breathRest === 'yes') f.push({ level: 3, text: 'Short of breath at rest', act: 'Measure SpO₂ now and get the Crew Medical Officer. Check the cabin air.', ind: 'spo2', emg: 'breathing' });
    if (a.visionHow === 'sudden') f.push({ level: 3, text: 'Sudden vision loss or flashes', act: 'Tell the Crew Medical Officer now — this needs an eye exam today.', ind: 'vision' });
    if (a.dizzyFaint === 'yes') f.push({ level: 3, text: 'Fainted or nearly fainted', act: 'Stay restrained, drink fluids, measure blood pressure and tell the Crew Medical Officer.', ind: 'sys' });
    if (a.pain === 'yes' && a.painHow === 3 && !has(where, 'chest')) f.push({ level: 2, text: 'Severe pain', act: 'Tell the Crew Medical Officer today. Pain relief only as the medical checklist directs.', ind: 'hr' });
    if (a.pain === 'yes' && a.painHow === 2) f.push({ level: 1, text: `Moderate pain (${where.join(', ') || 'unspecified'})`, act: 'Rest the area and repeat the status update in a few hours. Tell the crew if it gets worse.', ind: 'hr' });
    if (has(a.sym, 'fever') || has(a.feelWhy, 'sick')) f.push({ level: 2, text: 'Possible fever or infection', act: 'Log your temperature now, wash hands often and keep distance from crewmates.', ind: 'temp' });
    if (a.visionHow === 'near' || a.visionHow === 'far') f.push({ level: 1, text: 'Vision change', act: 'Log it in Vitals and mention it at the next medical conference (SANS check).', ind: 'vision' });
    if (has(where, 'head')) f.push({ level: 1, text: 'Headache', act: 'Drink water, check cabin CO₂ and rest. Sudden or severe headache is urgent.', ind: 'co2' });
    if (has(a.sym, 'nausea') || has(a.sym, 'dizzy')) f.push({ level: 1, text: 'Nausea or dizziness', act: 'Keep your head still, sip fluids and eat small amounts.', ind: 'water' });
    if (has(a.sym, 'breath') && a.breathRest !== 'yes') f.push({ level: 1, text: 'Short of breath on effort', act: 'Measure SpO₂ after rest and log it.', ind: 'spo2' });
    if (has(a.sym, 'cough')) f.push({ level: 1, text: 'Cough', act: 'Log temperature and SpO₂ today.', ind: 'temp' });
    if (has(a.feelWhy, 'tired')) f.push({ level: 1, text: 'Very tired', act: 'Protect your sleep window tonight and pair up on safety-critical tasks.', ind: 'sleep' });
    if (has(a.feelWhy, 'low') || a.talk === 'yes') f.push({ level: a.talk === 'yes' ? 2 : 1, text: a.talk === 'yes' ? 'Would like to talk to someone' : 'Feeling low or anxious', act: 'Ask for a private psychological conference — it is confidential — or talk to a crewmate you trust.', ind: 'mood' });
    if (a.feel <= 1 && !f.some((x) => x.level >= 2)) f.push({ level: 2, text: 'Feeling bad', act: 'Tell the Crew Medical Officer how you feel and log your vitals.', ind: 'hr' });
    f.sort((x, y) => y.level - x.level);
    return { level: f.length ? f[0].level : 0, findings: f };
  }

  function save(a) {
    const r = evaluate(a);
    const u = { at: new Date().toISOString(), md: state.md, answers: a, level: r.level, findings: r.findings.map((x) => x.text) };
    state.updates = [...list(), u].slice(-120); Engine.save();
    return { ...u, ...r };
  }

  /** Advisory from the most recent update of today, so the lobby, crew and analysis see it. */
  function advisory() {
    const l = last(); if (!l || l.md !== state.md || !l.level) return null;
    const r = evaluate(l.answers); const top = r.findings[0];
    return { key: 'status', level: r.level, title: `Status update: ${top.text.toLowerCase()}`, ind: top.ind,
      detail: `Reported ${new Date(l.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on MD ${l.md}${r.findings.length > 1 ? ` · also ${r.findings.slice(1, 3).map((x) => x.text.toLowerCase()).join(', ')}` : ''}.`,
      actions: r.findings.slice(0, 3).map((x) => x.act) };
  }
  return { list, every, last, due, dueIn, steps, evaluate, save, advisory };
})();

/* ---------- view ---------- */
function statusHtml(m) {
  if (m.result) {
    const r = m.result; const lvl = r.level;
    return `<div class="sheet narrow status" role="dialog" aria-modal="true" aria-label="Status update saved">
      <header><div><p class="kicker">Status update</p><h2>${lvl >= 3 ? 'Get help now' : lvl === 2 ? 'Tell the crew today' : lvl === 1 ? 'Noted — keep an eye on it' : 'All good — thanks'}</h2></div><button class="x" data-act="close" aria-label="Close">${icon('x')}</button></header>
      <div class="sheet-b one">
        ${r.findings.length ? `<ul class="st-find">${r.findings.map((f) => `<li class="${lc(f.level)}"><span class="dot"></span><div><b>${esc(f.text)}</b><p>${esc(f.act)}</p></div></li>`).join('')}</ul>`
          : '<p class="muted">Nothing to follow up. Your next status update is due in a few hours.</p>'}
        <p class="muted small">Next update in ${Status.every()} hours.</p>
      </div>
      <footer>${lvl >= 3 ? `<button class="btn sos lg save-big" data-act="emergency" data-id="${esc(Crew.members()[0].id)}">${icon('siren')}Open emergency help</button>` : `<button class="btn primary lg save-big" data-act="close">Done</button>`}</footer>
    </div>`;
  }
  const qs = Status.steps(m.ans); const q = qs[m.i]; const n = qs.length; const v = m.ans[q.id];
  const on = (x) => (q.type === 'many' ? has(v, x) : v === x);
  const feel = q.id === 'feel';
  return `<div class="sheet narrow status" role="dialog" aria-modal="true" aria-label="${esc(q.q)}">
    <header><div class="grow"><p class="kicker">Quick status</p><h2>${esc(q.q)}</h2></div>${helpMini()}<button class="x" data-act="close" aria-label="Close">${icon('x')}</button></header>
    <div class="sheet-b one">
      <div class="st-opts ${q.type} ${feel ? 'faces' : ''}">${q.opts.map(([val, label]) => `<button class="${on(val) ? 'on' : ''}" data-act="stans" data-v="${val}" aria-pressed="${on(val)}">${feel ? `<span class="st-face">${['', '😣', '🙁', '😐', '🙂', '😄'][val]}</span>` : ''}${esc(label)}</button>`).join('')}</div>
      ${feel ? '<p class="muted small center">One tap. If you feel fine, that’s it.</p>' : q.type === 'many' ? '<p class="muted small">Tap all that apply.</p>' : ''}
    </div>
    <footer>${m.i > 0 ? '<button class="btn ghost lg" data-act="stback">Back</button>' : '<button class="btn ghost lg" data-act="close">Later</button>'}
      ${q.type === 'many' ? `<button class="btn primary lg save-big" data-act="stnext" ${v && v.length ? '' : 'disabled'}>${m.i < n - 1 ? 'Next' : 'Finish'}${icon('next')}</button>` : ''}</footer>
  </div>`;
}

/* ---------- ask the crew for help ---------- */
const HELP_WHY = ['Feeling unwell', 'Injured', 'Hard to breathe', 'Pain', 'Need to talk', 'Equipment or task'];
function helpHtml(m) {
  return `<div class="sheet narrow helpreq" role="dialog" aria-modal="true" aria-label="Ask your crew for help">
    <header><div><p class="kicker">Ask your crew for help</p><h2>Everyone on your mission is alerted</h2></div><button class="x" data-act="close" aria-label="Close">${icon('x')}</button></header>
    <form id="help-form" class="sheet-b one">
      <div class="st-opts">
        <button type="button" class="${m.urgent ? 'on' : ''} urgent" data-act="helpurg" data-v="1">${icon('siren')}<span><b>I need help now</b><small>Crewmates come to you right away</small></span></button>
        <button type="button" class="${m.urgent ? '' : 'on'}" data-act="helpurg" data-v="0">${icon('users')}<span><b>I could use a hand</b><small>Not urgent — when someone is free</small></span></button>
      </div>
      <div class="field"><label>What is it about? <span class="muted">(optional)</span></label>
        <div class="chips ask-sug">${HELP_WHY.map((w) => `<button type="button" class="${m.why.includes(w) ? 'on' : ''}" data-act="helpwhy" data-v="${w}">${w}</button>`).join('')}</div></div>
      <div class="ask-row"><input id="help-note" name="note" class="text" type="text" maxlength="160" placeholder="Add a short note (where you are, what happened)">${micBtn('help-note')}</div>
      <button class="btn ${m.urgent ? 'sos' : 'primary'} lg save-big" type="submit">${icon('bell')}${m.urgent ? 'Alert the crew now' : 'Send to the crew'}</button>
      ${alertReach() === 'cloud' ? '<p class="muted small">Sent to everyone on your mission. With no signal it is saved and sent when the link is back.</p>'
        : `<p class="small l2"><b>${alertSentMsg('request').replace(/^[^:]+: (.)/, (x, c) => c.toUpperCase())}</b></p>`}
    </form></div>`;
}
