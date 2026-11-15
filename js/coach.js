/* NOVACARE — improvement coach.
   Looks at the last 7 days against the 7 before, finds the one or two habits furthest from their
   goal, and gives one concrete thing to do today. It also says what is getting better, so
   progress is visible. "Done today" is remembered so the person sees their streak.
   Everything is computed from the person's own readings, on the device. */

const COACH_AREAS = [
  { id: 'sleep', label: 'Sleep', unit: 'h', dec: 1, better: 1, goal: () => 7.5,
    tip: 'Protect an 8-hour sleep window tonight: screens off an hour before, eye mask and earplugs.', why: 'Short sleep slows reactions and weakens the immune system.' },
  { id: 'stress', label: 'Stress', scale: true, better: -1, goal: () => 2,
    tip: 'After each work block, take 2 minutes of slow breathing: in for 4 seconds, out for 6.', why: 'Lower stress protects sleep, mood and decisions.' },
  { id: 'exercise', label: 'Exercise', unit: 'min', dec: 0, better: 1, goal: (env) => Math.round(env.exTarget * 0.75),
    tip: 'Book your exercise slot now — resistance first, then cardio.', why: 'Daily exercise is the proven countermeasure for bone and muscle loss.' },
  { id: 'water', label: 'Hydration', unit: 'L', dec: 1, better: 1, goal: () => 2,
    tip: 'Drink one pouch with every meal and one between meals.', why: 'Thirst is blunted in space; low fluids raise kidney-stone risk.' },
  { id: 'mood', label: 'Mood', scale: true, better: 1, goal: () => 4,
    tip: 'Plan one thing you enjoy today and share a meal with the crew.', why: 'Mood drifts down slowly on long missions; small daily habits keep it up.' },
];

const Coach = (() => {
  const avg = (id, from, to) => { const s = Engine.series(id).filter((p) => p.md >= from && p.md <= to).map((p) => p.v); return s.length ? s.reduce((a, b) => a + b, 0) / s.length : null; };
  const doneLog = () => (state.coach && typeof state.coach === 'object' ? state.coach : {});
  const doneOn = (md, id) => (doneLog()[md] || []).includes(id);
  const doneCount = (id) => { let n = 0; for (let d = state.md - 6; d <= state.md; d++) if (doneOn(d, id)) n++; return n; };
  const checkins = (from, to) => { let n = 0; for (let d = from; d <= to; d++) { const day = state.days[d]; if (day && (day.checkinAt || Engine.checkedIn(day))) n++; } return n; };

  function fmt(a, v) { return a.scale ? `${Engine.label(IND[a.id], Math.round(v))}` : `${v.toFixed(a.dec)} ${a.unit}`; }
  function change(a, d) { if (a.scale) return d * a.better > 0 ? 'better' : 'worse'; return `${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(a.dec)} ${a.unit}`; }

  /** Every area with this week, last week, goal, how far from it and whether it is improving. */
  function analyze() {
    if (!state || !state.days) return { areas: [], focus: [], wins: [], enough: false };
    const env = Engine.env(); const md = state.md;
    const areas = COACH_AREAS.map((a) => {
      const cur = avg(a.id, md - 6, md), prev = avg(a.id, md - 13, md - 7), goal = a.goal(env);
      if (cur == null) return null;
      const span = a.scale ? 3 : goal;
      const gap = a.better > 0 ? Math.max(0, (goal - cur) / span) : Math.max(0, (cur - goal) / span);
      const delta = prev == null ? null : cur - prev;
      const improving = delta != null && delta * a.better > (a.scale ? 0.25 : goal * 0.04);
      const worse = delta != null && delta * a.better < -(a.scale ? 0.25 : goal * 0.04);
      const progress = a.better > 0 ? Math.min(1, cur / goal) : Math.min(1, Math.max(0, (5 - cur) / (5 - goal)));
      return { ...a, cur, prev, goal, gap, delta, improving, worse, progress, done: doneOn(md, a.id), streak: doneCount(a.id) };
    }).filter(Boolean);
    // checking in every day is a habit too: gaps hide problems
    const ci = checkins(md - 6, md), ciPrev = checkins(md - 13, md - 7);
    if (md > 3) areas.push({ id: 'checkin', label: 'Daily check-in', count: true, cur: ci, prev: md > 10 ? ciPrev : null, goal: 6, better: 1,
      gap: Math.max(0, (6 - ci) / 6), delta: md > 10 ? ci - ciPrev : null, improving: md > 10 && ci > ciPrev, worse: md > 10 && ci < ciPrev, progress: Math.min(1, ci / 6),
      tip: 'Check in as soon as you wake up — it takes about a minute.', why: 'Gaps in check-ins hide problems until they are bigger.', done: doneOn(md, 'checkin'), streak: doneCount('checkin') });
    const inCase = typeof Care !== 'undefined' && !state.sim ? new Set(Care.open().map((c) => c.ind)) : new Set();
    const focus = areas.filter((a) => a.gap > 0.04 || inCase.has(a.id)).sort((x, y) => inCase.has(y.id) - inCase.has(x.id) || y.gap - x.gap).slice(0, 2);
    const wins = areas.filter((a) => a.improving && !focus.includes(a)).slice(0, 3);
    return { areas, focus, wins, enough: areas.length >= 2 };
  }

  function markDone(id) {
    const log = { ...doneLog() }; const today = log[state.md] || [];
    log[state.md] = today.includes(id) ? today.filter((x) => x !== id) : [...today, id];
    Object.keys(log).forEach((d) => { if (+d < state.md - 30) delete log[d]; }); // keep it small
    state.coach = log; Engine.save();
    return log[state.md].includes(id);
  }

  /** One line after a check-in: today against the person's own last week. */
  function feedback() {
    const day = state.days[state.md]; if (!day) return '';
    const { focus } = analyze();
    for (const a of [...focus, ...COACH_AREAS]) {
      if (a.count || day.vals[a.id] == null) continue;
      const base = avg(a.id, state.md - 7, state.md - 1); if (base == null) continue;
      const v = day.vals[a.id]; const d = v - base; const area = COACH_AREAS.find((x) => x.id === a.id);
      if (d * area.better > 0.01) return `${area.label}: ${fmt(area, v)} — better than your ${fmt(area, base)} average this week.`;
    }
    return '';
  }
  return { analyze, markDone, feedback, fmt, change };
})();

function coachCard(opts = {}) {
  const r = Coach.analyze(); const me = Crew.members()[0]; const v = me ? Crew.verdict(me) : null;
  const cls = `card coach${opts.space ? ' space' : ''}`;
  if (!r.enough) {
    return `<section class="${cls}" aria-label="Your plan to improve"><div class="card-h"><div><h2>${icon('chart')}Your plan to improve</h2>
      <p class="muted small">Check in for a few days and NovaCare will find what to work on first.</p></div>
      <button class="btn primary sm" data-act="checkin">Check in</button></div></section>`;
  }
  const head = r.focus.length ? `This week, focus on ${r.focus.map((a) => a.label.toLowerCase()).join(' and ')}.` : 'You are meeting every goal — keep it up.';
  if (opts.compact) r.focus = r.focus.slice(0, 1); // Home shows the main habit; the full plan is in My health
  const val = (a) => (a.count ? `${a.cur} of 7 days` : Coach.fmt(a, a.cur));
  const goalTxt = (a) => (a.count ? `${a.goal}+ days` : a.scale ? Engine.label(IND[a.id], a.goal) + (a.better < 0 ? ' or lower' : ' or better') : `${a.goal} ${a.unit}${a.better > 0 ? '+' : ''}`);
  const trend = (a) => (a.delta == null ? '' : a.improving ? `<span class="ch-trend up">↑ ${a.count ? `${a.delta > 0 ? '+' : ''}${a.delta} days` : Coach.change(a, a.delta)} vs last week</span>`
    : a.worse ? `<span class="ch-trend down">↓ ${a.count ? `${a.delta} days` : Coach.change(a, a.delta)} vs last week</span>` : '<span class="ch-trend flat">Same as last week</span>');
  const delta = v && v.delta != null && v.delta !== 0 ? `Readiness ${v.delta > 0 ? 'up' : 'down'} ${Math.abs(v.delta)} in 7 days` : '';
  return `<section class="${cls}" aria-label="Your plan to improve">
    <div class="card-h"><div><h2>${icon('chart')}Your plan to improve</h2><p class="muted small">${head}${delta ? ` · ${delta}` : ''}</p></div>
      ${opts.compact ? `<button class="btn ghost sm" data-act="view" data-v="personal">Full plan${icon('next')}</button>` : ''}</div>
    ${r.focus.length ? `<ul class="coach-list">${r.focus.map((a) => `<li>
      <div class="ch-h"><b>${esc(a.label)}</b>${trend(a)}</div>
      <div class="ch-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(a.progress * 100)}" aria-label="${esc(a.label)} toward goal"><i style="width:${Math.max(4, a.progress * 100)}%"></i></div>
      <p class="ch-n">This week <b>${val(a)}</b> · goal ${goalTxt(a)}</p>
      <p class="ch-tip"><b>Today:</b> ${esc(a.tip)}</p>
      <div class="ch-act"><button class="btn sm ${a.done ? 'primary' : 'ghost'}" data-act="coachdone" data-v="${a.id}" aria-pressed="${a.done}">${icon('check')}${a.done ? 'Done today' : 'I did it'}</button>
        <small>${a.streak ? `${a.streak} of the last 7 days` : esc(a.why)}</small></div></li>`).join('')}</ul>` : ''}
    ${r.wins.length ? `<p class="coach-wins">${icon('check')}<span><b>Getting better:</b> ${r.wins.map((a) => `${esc(a.label)} ${a.count ? `(${a.cur} of 7 days)` : `(${Coach.change(a, a.delta)})`}`).join(' · ')}</span></p>` : ''}
  </section>`;
}
