/* NOVACARE — risk prediction. Looks ahead instead of only at today:
   1. Trend projection: a least-squares line through the last readings of each measurable indicator;
      if it keeps going, when does it leave the safe range (and then the warning range)?
   2. Radiation: dose at the end of the mission at the recent daily rate, against the 600 mSv career limit.
   3. Bone: estimated bone density loss by the end of the mission (1–1.5 % per month in microgravity,
      lower when the exercise prescription is followed).
   4. Sleep debt: where the last week's sleep leads over the next 7 days.
   Every prediction says how it was computed, how sure it is, and what to do now to avoid it.
   It runs on whatever `state` is current, so crew summaries can use it too. */

const PREDICT_IDS = ['sys', 'dia', 'hr', 'spo2', 'temp', 'glu', 'mass', 'sleep', 'water', 'co2'];
const HORIZON = 30; // days ahead

const Predict = (() => {
  /** Least-squares fit of value against mission day. */
  function fit(pts) {
    const n = pts.length; const mx = pts.reduce((s, p) => s + p.md, 0) / n; const my = pts.reduce((s, p) => s + p.v, 0) / n;
    let sxy = 0, sxx = 0, syy = 0;
    pts.forEach((p) => { sxy += (p.md - mx) * (p.v - my); sxx += (p.md - mx) ** 2; syy += (p.v - my) ** 2; });
    const slope = sxx ? sxy / sxx : 0; const r2 = sxx && syy ? (sxy * sxy) / (sxx * syy) : 0;
    return { slope, at: (d) => my + slope * (d - mx), r2, n };
  }
  const days = (n) => (n < 1.5 ? 'within a day' : `in about ${Math.round(n)} days`);

  /** One indicator: projected crossing of the next band edge, if the trend is real and steep enough. */
  function trend(id) {
    const ind = IND[id]; const pts = Engine.series(id).filter((p) => p.md > state.md - 14);
    if (pts.length < 5) return null;
    const f = fit(pts); if (f.r2 < 0.3 || Math.abs(f.slope) < 1e-6) return null;
    const now = f.at(state.md); const c = Engine.classify(ind, now);
    if (c.level >= 2) return null; // already flagged by today's advisories
    const b = c.bands; const up = f.slope > 0;
    const edge = c.level === 0 ? (up ? b.ok[1] : b.ok[0]) : (up ? b.warn[1] : b.warn[0]);
    if (!Number.isFinite(edge)) return null;
    const dAhead = (edge - now) / f.slope; if (dAhead <= 0 || dAhead > HORIZON) return null;
    const into = c.level === 0 ? 1 : 2; const lvl = dAhead <= 7 ? Math.min(2, into + 1) : into;
    const fmt = (v) => `${Engine.fmt(ind, v)} ${ind.unit}`;
    const adv = ind.advice[up ? 'high' : 'low'];
    return { key: 'p-' + id, ind: id, level: lvl, title: `${ind.short} ${up ? 'rising' : 'falling'}`,
      now: fmt(now), future: fmt(edge), when: dAhead,
      sum: `Could ${c.level === 0 ? 'leave the safe range' : 'reach the warning range'} ${days(dAhead)}.`,
      text: `At the current trend (${f.slope > 0 ? '+' : ''}${Engine.fmt(ind, f.slope * 7)} ${ind.unit} a week) it would ${c.level === 0 ? 'leave the target range' : 'reach the warning range'} (${fmt(edge)}) ${days(dAhead)}.`,
      act: adv ? adv.actions.slice(0, 2) : ['Measure again at the same time tomorrow to confirm the trend.'],
      basis: `Linear trend of the last ${f.n} readings (fit R² ${f.r2.toFixed(2)}).`, conf: f.r2 >= 0.6 && f.n >= 7 ? 'high' : 'moderate' };
  }

  /** Radiation dose at the end of the mission at the recent rate. */
  function dose() {
    const len = state.missionDays || 180; const left = Math.max(0, len - state.md);
    const rad = Engine.series('rad').filter((p) => p.md > state.md - 7);
    // needs 3+ readings to trust the measured rate; otherwise the environment's typical rate
    const rate = rad.length >= 3 ? rad.reduce((s, p) => s + p.v, 0) / rad.length : Engine.env().rad;
    const now = Engine.cumulativeDose(); const end = now + rate * left; const frac = end / CAREER_DOSE_LIMIT;
    const lvl = frac >= 0.8 ? 2 : frac >= 0.5 ? 1 : 0;
    return { key: 'p-dose', ind: 'rad', level: lvl, title: 'Radiation', now: `${now.toFixed(0)} mSv`, future: `${end.toFixed(0)} mSv`, when: left,
      sum: `${Math.round(frac * 100)}% of your lifetime limit by mission end${lvl ? '.' : ' — safe.'}`,
      text: `At ${rate.toFixed(2)} mSv a day, the mission will end at about ${end.toFixed(0)} mSv — ${Math.round(frac * 100)}% of the ${CAREER_DOSE_LIMIT} mSv career limit.`,
      act: lvl ? ['Maximise time in shielded areas and sleep in the most shielded module.', 'Ask ground to review EVA and excursion plans.'] : ['Keep wearing your dosimeter and logging it daily.'],
      basis: `${rad.length >= 3 ? `Average of the last ${rad.length} dosimeter readings` : `Typical rate for ${Engine.env().name}`} × ${left} days left.`, conf: rad.length >= 5 ? 'high' : 'moderate' };
  }

  /** Bone density loss by the end of the mission (microgravity only). */
  function bone() {
    const env = Engine.env(); if (!/0 g|micro/i.test(env.gravity || '')) return null;
    const len = state.missionDays || 180; const ex = Engine.series('exercise').filter((p) => p.md > state.md - 14);
    if (ex.length < 5) return null; // missing records are not missed exercise: estimate only with at least 5 days logged
    const kept = ex.length ? ex.filter((p) => p.v >= env.exTarget * 0.75).length / ex.length : 0;
    const perMonth = kept >= 0.75 ? 1.0 : kept >= 0.4 ? 1.25 : 1.5; const lossEnd = (len / 30) * perMonth; const lossNow = (state.md / 30) * perMonth;
    const lvl = lossEnd >= 8 ? 2 : lossEnd >= 5 ? 1 : 0;
    const exTxt = !ex.length ? 'No exercise logged in the last 2 weeks' : `Full exercise on ${ex.filter((p) => p.v >= env.exTarget * 0.75).length} of the last ${ex.length} days logged`;
    return { key: 'p-bone', ind: 'exercise', level: lvl, title: 'Bone loss', now: `≈${lossNow.toFixed(1)}%`, future: `≈${lossEnd.toFixed(1)}%`, when: len - state.md,
      sum: kept >= 0.75 ? 'Exercise is keeping bone loss low.' : `${exTxt} — bones lose more without it.`,
      text: `${exTxt}, so the estimated loss is ${perMonth}% a month — about ${lossEnd.toFixed(1)}% of hip and spine density by day ${len}.`,
      act: kept >= 0.75 ? ['Keep the full resistance-exercise prescription every day.'] : ['Complete your full exercise session every day.','Tell ground what is getting in the way (time, hardware, pain).'],
      basis: 'Published spaceflight average of 1–1.5% hip and spine loss per month, adjusted by your exercise.', conf: 'moderate' };
  }

  /** Sleep debt over the next week if the last 7 nights continue. */
  function sleep() {
    const s = Engine.series('sleep').filter((p) => p.md > state.md - 7); if (s.length < 4) return null;
    const avg = s.reduce((a, p) => a + p.v, 0) / s.length; if (avg >= 7) return null;
    const debt = (8 - avg) * 7; const lvl = avg < 6 ? 2 : 1;
    return { key: 'p-sleep', ind: 'sleep', level: lvl, title: 'Sleep debt', now: `${avg.toFixed(1)} h a night`, future: `${debt.toFixed(0)} h short`, when: 7,
      sum: 'Not enough sleep — alertness will drop.',
      text: `Averaging ${avg.toFixed(1)} h, you will be about ${debt.toFixed(0)} hours short of sleep a week from now — alertness drops like a night without sleep.`,
      act: ['Ask ground to protect an 8.5-hour sleep window for the next three nights.', 'Pair up on safety-critical tasks until sleep recovers.'],
      basis: `Average of the last ${s.length} nights against an 8-hour need.`, conf: s.length >= 6 ? 'high' : 'moderate' };
  }

  /** Every prediction for the current person, most serious first (info-only ones last). */
  function all() {
    if (!state || !state.days) return [];
    const out = [];
    PREDICT_IDS.forEach((id) => { const p = trend(id); if (p) out.push(p); });
    const sl = sleep(); if (sl && !out.some((p) => p.ind === 'sleep')) out.push(sl);
    const b = bone(); if (b) out.push(b);
    out.push(dose());
    return out.sort((a, b2) => b2.level - a.level || (a.when ?? 99) - (b2.when ?? 99));
  }
  return { all, fit };
})();

/* ---------- views ---------- */
function predictCard(list, opts = {}) {
  const items = opts.limit ? list.slice(0, opts.limit) : list;
  const risky = list.filter((p) => p.level > 0).length;
  return `<section class="card predict${opts.space ? ' space' : ''}" aria-label="Predicted risks">
    <div class="card-h"><div><h2>${icon('chart')}What’s ahead</h2><p class="muted small">${risky ? `${risky} thing${risky > 1 ? 's' : ''} to act on` : 'Nothing to worry about'}</p></div>
      ${opts.more ? `<button class="btn ghost sm" data-act="view" data-v="analysis">See all${icon('next')}</button>` : opts.toggle && list.length > 2 ? `<button class="btn ghost sm" data-act="allpred">${ui.allPred ? 'Show fewer' : `Show all ${list.length}`}</button>` : ''}</div>
    <ul class="pred">${items.map((p) => `<li class="${lc(p.level)}">
      <div class="pred-h"><span class="pill ${lc(p.level)}">${p.level ? LEVELS[p.level].sym + ' ' + (p.level >= 2 ? 'Act now' : 'Watch') : '● OK'}</span><b>${esc(p.title)}</b></div>
      <div class="pred-n"><span><small>Now</small><b class="num">${esc(p.now)}</b></span><span class="pred-arrow">${icon('next')}</span><span><small>${p.key === 'p-dose' || p.key === 'p-bone' ? 'Mission end' : p.when != null ? `In ${Math.max(1, Math.round(p.when))} days` : 'Ahead'}</small><b class="num">${esc(p.future)}</b></span></div>
      <p>${esc(p.sum || p.text)}</p>
      ${p.level ? `<p class="pred-do"><b>What to do:</b>${esc(p.act[0])}</p>` : ''}
      <details class="pred-why"><summary>Why</summary><p>${esc(p.text)}</p><p class="pred-basis">${esc(p.basis)} · Confidence ${p.conf}.</p></details></li>`).join('')}</ul></section>`;
}
