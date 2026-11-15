/* NOVACARE — crew sections: Crewmates, Mission status, Analysis, and the emergency flow. */

const crewColor = (i) => `var(--crew-${i % 6})`;
const initials = (n) => String(n || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const firstName = (m) => (m.me ? 'You' : String(m.name).split(' ')[0]);
const mark = (level) => `<span class="mk ${lc(level)}" aria-hidden="true">${level < 0 ? '○' : LEVELS[level].sym}</span>`;
const levelText = (level) => (level < 0 ? 'No data' : LEVELS[level].name);

function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

function pageHead(title, desc, actions = '') {
  if (!/[<&]/.test(title)) title = title.replace(/(\S+)$/, '<em>$1</em>'); // last word in italic serif
  return `<header class="page-h"><div><h1>${SWOOSH}${title}</h1>${desc ? `<p>${desc}</p>` : ''}</div>${actions ? `<div class="page-a">${actions}</div>` : ''}</header>`;
}

function avatar(m, i, size = '') {
  return `<span class="av ${size}" style="--av:${crewColor(i)}" aria-hidden="true">${initials(m.name)}</span>`;
}

function verdictPill(v) {
  return `<span class="pill ${lc(v.level)}">${v.level < 0 ? '○' : LEVELS[v.level].sym} ${v.name}</span>`;
}

/* small readiness trend: real values, labelled, never decorative */
function miniTrend(m, i) {
  const pts = m.days.filter((d) => d.score != null).slice(-14);
  if (pts.length < 2) return '';
  const x = (k) => 2 + (k / (pts.length - 1)) * 116; const y = (v) => 30 - (v / 100) * 28;
  const d = pts.map((p, k) => `${k ? 'L' : 'M'}${x(k).toFixed(1)} ${y(p.score).toFixed(1)}`).join(' ');
  return `<svg class="mini" viewBox="0 0 120 32" role="img" aria-label="Readiness over the last ${pts.length} days, from ${pts[0].score} to ${pts[pts.length - 1].score}"><path d="${d}" style="stroke:${crewColor(i)}"/></svg>`;
}

const KEY_VITALS = [['hr', 'HR'], ['spo2', 'SpO₂'], ['temp', 'Temp'], ['sys', 'BP'], ['sleep', 'Sleep']];
function vitalCell(m, id, label) {
  const l = m.latest[id] || {}; const ind = IND[id];
  let val = l.v == null ? '—' : Engine.fmt(ind, l.v);
  if (id === 'sys' && l.v != null && m.latest.dia && m.latest.dia.v != null) val = `${l.v}/${m.latest.dia.v}`;
  return `<div class="${lc(l.level == null ? -1 : l.level)}"><dt>${label}</dt><dd>${mark(l.v == null ? -1 : l.level)}<span class="num">${val}</span>${l.v != null && id !== 'sys' ? `<small>${ind.unit}</small>` : ''}</dd></div>`;
}

/* ---------- Crewmates ---------- */
function viewCrew() {
  const all = Crew.members(); const mates = all.map((m, i) => ({ m, i })).filter((x) => !x.m.me);
  const u = Auth.user();
  const head = pageHead('Crewmates', `${esc(Missions.label())} · ${mates.length} crewmate${mates.length === 1 ? '' : 's'} · status from each person's latest check-in`,
    `<button class="btn ghost" data-act="settings">${icon('settings')}Mission settings</button>`) + crewTabs();
  if (!mates.length) {
    return head + `<section class="card empty-state">${icon('users', 'lg')}<h2>No crewmates yet</h2>
      <p>${u.crew ? `Crewmates appear here when they join with the same mission code: <b class="code">${esc(u.crew)}</b>.` : 'Join or create a mission from the Mission tab to see a real crew here.'} You can also show the simulated demo crew from Mission settings.</p>
      <button class="btn primary" data-act="togglesim">Show simulated demo crew</button></section>`;
  }
  return head + `<div class="crew-grid">${mates.map(({ m, i }) => {
    const v = Crew.verdict(m); const top = m.advisories[0];
    return `<article class="card crew-card">
      <header class="crew-h">${avatar(m, i)}<div class="crew-id"><h2>${esc(m.name)}</h2><p>${esc(m.role || 'Crew member')}</p></div>${verdictPill(v)}</header>
      <div class="crew-score"><div><b class="num" data-count="${m.readiness ?? ''}">${m.readiness ?? '—'}</b><span>readiness</span></div>${miniTrend(m, i)}</div>
      <p class="crew-concern ${lc(top ? top.level : 0)}"><span class="dot"></span><span>${top ? esc(top.title) : 'No active concerns'}</span></p>
      <dl class="crew-vitals">${KEY_VITALS.slice(0, 3).map(([id, l]) => vitalCell(m, id, l)).join('')}</dl>
      <p class="crew-meta">${m.checkedInToday ? `${icon('check')}Checked in today` : `${icon('clock')}Check-in pending`}${m.cached ? ` · ${timeAgo(m.updatedAt)}` : ''}${m.sim ? ' · <span class="tag sm" title="Synthetic demo astronaut">Simulated</span>' : ''}</p>
      <footer><button class="btn ghost sm" data-act="mate" data-id="${esc(m.id)}">View details</button>
        <button class="btn sos sm" data-act="emergency" data-id="${esc(m.id)}">${icon('siren')}Emergency</button></footer>
    </article>`;
  }).join('')}</div>
  <p class="muted small foot-note">${icon('shield')}Crewmates see the same summary of you. Raw readings stay private.</p>`;
}

function mateHtml(id) {
  const all = Crew.members(); const i = all.findIndex((m) => m.id === id); const m = all[i];
  if (!m) return '';
  const v = Crew.verdict(m);
  return `<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(m.name)}">
    <header>${avatar(m, i)}<div class="grow"><h2>${esc(m.name)}</h2><p class="muted small">${esc(m.role || '')} · MD ${m.md}${m.sim ? ' · simulated' : ''}</p></div>${verdictPill(v)}<button class="x" data-act="close" aria-label="Close">${icon('x')}</button></header>
    <div class="sheet-b">
      <div class="fields">
        <section><h3>Body systems</h3><ul class="sys-mini">${SYSTEMS.map((s) => `<li class="${lc(m.systems[s.id])}">${mark(m.systems[s.id])}${s.name}<span>${levelText(m.systems[s.id])}</span></li>`).join('')}</ul></section>
        <section><h3>Advisories</h3>${m.advisories.length ? `<ul class="adv-mini">${m.advisories.map((a) => `<li class="${lc(a.level)}">${mark(a.level)}<div><b>${esc(a.title)}</b><small>${esc(a.detail)}</small></div><span class="pill ${lc(a.level)}">${esc(a.who)}</span></li>`).join('')}</ul>` : '<p class="muted">Nothing active.</p>'}</section>
      </div>
      <div><h3>Latest readings</h3>
        <table class="tbl"><thead><tr><th>Indicator</th><th class="r">Value</th><th>Status</th><th class="r">Day</th></tr></thead><tbody>
        ${INDICATORS.map((ind) => { const l = m.latest[ind.id] || {}; return `<tr><td>${ind.short}</td><td class="r num">${l.v == null ? '—' : (ind.type === 'scale' ? esc(Engine.label(ind, l.v)) : `${Engine.fmt(ind, l.v)} <small>${ind.unit}</small>`)}</td><td class="${lc(l.v == null ? -1 : l.level)}">${mark(l.v == null ? -1 : l.level)} ${l.v == null ? 'No data' : levelText(l.level)}</td><td class="r num muted">${l.md ? 'MD ' + l.md : ''}</td></tr>`; }).join('')}
        </tbody></table>
        <div class="btnrow end"><button class="btn sos" data-act="emergency" data-id="${esc(m.id)}">${icon('siren')}Emergency for ${esc(firstName(m))}</button></div>
      </div>
    </div></div>`;
}

/* ---------- Emergency ---------- */
function emergencyHtml(md) {
  const all = Crew.members(); const i = all.findIndex((m) => m.id === md.id); const m = all[i] || { name: md.name || 'Crew member', latest: {}, advisories: [], systems: {}, med: null, id: md.id };
  const env = Engine.env();
  if (md.step === 'pick') {
    return `<div class="sheet narrow emg" role="dialog" aria-modal="true" aria-label="Emergency">
      <header><span class="emg-ic">${icon('siren')}</span><div class="grow"><h2>Emergency for ${esc(m.name)}</h2><p class="muted small">Describe what is happening, or choose it below. The crew is alerted and NovaCare tells you what to do with what is on board.</p></div><button class="x" data-act="close" aria-label="Close">${icon('x')}</button></header>
      <div class="sheet-b one">
        <form id="emg-describe" class="emg-desc">
          <label for="emg-text">Describe the situation</label>
          <div class="ask-row"><textarea id="emg-text" name="text" class="text" rows="2" maxlength="400" placeholder="e.g. She ate something with peanuts, her lips are swelling and she is wheezing">${esc(md.text || '')}</textarea>${micBtn('emg-text')}</div>
          ${md.noMatch ? '<p class="auth-err">I could not tell which situation this is — choose the closest one below.</p>' : ''}
          <button class="btn sos" type="submit">${icon('siren')}Get instructions</button>
        </form>
        <p class="emg-or"><span>or choose the situation</span></p>
        <div class="emg-pick">${EMERGENCIES.map((e) => `<button data-act="emgtype" data-v="${e.id}">${icon(e.icon)}<span>${e.name}</span></button>`).join('')}</div>
      <p class="muted small">If you are unsure, choose the closest match — you can switch protocol later. In a life-threatening situation, act first and log after.</p></div></div>`;
  }
  const e = EMG[md.em] || EMERGENCIES[0]; const alert = Crew.alerts().find((a) => a.id === md.alertId);
  const sent = !alert ? '' : !Auth.cloud() ? 'Crew on this device alerted' : alert.pending ? 'Saved — the crew is alerted as soon as the link is back' : 'Crew alerted';
  const rel = e.ind.map((id) => ({ id, l: m.latest[id] || {} }));
  const hints = [];
  rel.forEach(({ id, l }) => { if (l.v != null && l.level >= 2) hints.push(`${IND[id].short} was ${Engine.fmt(IND[id], l.v)} ${IND[id].unit} on MD ${l.md} — ${levelText(l.level).toLowerCase()}.`); });
  m.advisories.filter((a) => a.level >= 2).slice(0, 3).forEach((a) => hints.push(`Active finding: ${a.title}.`));
  return `<div class="sheet emg" role="dialog" aria-modal="true" aria-label="Emergency protocol">
    <header class="emg-h"><span class="emg-ic">${icon(e.icon)}</span><div class="grow"><h2>${e.name}</h2><p class="small">${esc(m.name)} · started <span id="em-timer" class="num" data-start="${alert ? alert.createdAt : new Date().toISOString()}">0:00</span> ago</p></div>
      <span class="emg-sent">${icon(alert && alert.pending ? 'cloudOff' : 'bell')}${sent}</span><button class="x" data-act="close" aria-label="Close">${icon('x')}</button></header>
    <div class="sheet-b">
      <section>
        ${md.text ? `<p class="emg-said">${icon('chat')}<span>“${esc(md.text)}”</span>${(md.others || []).length ? ` <span class="muted small">Also possible:</span> ${md.others.map((o) => `<button class="chip-s" data-act="emgtype" data-v="${o}">${esc(EMG[o].name)}</button>`).join('')}` : ''}</p>` : ''}
        <h3>Do this now</h3>
        <ol class="steps">${e.steps.map((s, k) => `<li><button data-act="emgstep" data-k="${k}" aria-pressed="${!!md.done[k]}" class="${md.done[k] ? 'done' : ''}"><span class="n num">${md.done[k] ? icon('check') : k + 1}</span><span>${esc(s)}</span></button></li>`).join('')}</ol>
        <p class="esc"><b>Ground support:</b> ${env.name} — ${env.commNote}</p>
        ${emgSuppliesHtml(e.id, m)}
        ${emgAskHtml(md)}
      </section>
      <aside class="emg-side">
        <h3>What NOVACARE knows about ${esc(firstName(m))}</h3>
        ${emgProfileHtml(m)}
        <dl class="crew-vitals col">${rel.map(({ id }) => vitalCell(m, id, IND[id].short)).join('')}</dl>
        ${hints.length ? `<ul class="hints">${hints.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : '<p class="muted small">No earlier warning signs in the latest readings.</p>'}
        <p class="muted small">Last readings may be hours old. Measure again now and trust what you see over stored data.</p>
        <div class="btnrow col">
          <button class="btn ghost" data-act="emgswitch">Switch protocol</button>
          <button class="btn primary" data-act="emgresolve">${icon('check')}Mark resolved</button>
        </div>
      </aside>
    </div>
    <p class="emg-foot">Supports, never replaces, your mission's medical checklists and the Crew Medical Officer. Prototype — not a medical device.</p>
  </div>`;
}

function bannerHtml() {
  const act = Crew.active();
  if (!act.length) return '';
  const u = Auth.user();
  return act.slice(-3).reverse().map((a) => `<div class="banner" role="alert">${icon('siren')}
    ${HELP_TYPES[a.type] ? `<p><b>${a.fromId === u.id ? 'You asked the crew for help' : `${esc(a.fromName)} is asking for help`}</b> — ${esc(alertName(a.type).toLowerCase())}${a.note ? ` · “${esc(a.note)}”` : ''} · ${timeAgo(a.createdAt)}${a.pending ? ' · waiting for link' : ''}</p>`
      : `<p><b>Emergency: ${a.aboutId === u.id || (u.uid && a.aboutId === u.uid) ? 'you' : esc(a.aboutName)}</b> — ${esc(alertName(a.type))} · raised by ${esc(a.fromName)} · ${timeAgo(a.createdAt)}${a.pending ? ' · waiting for link' : ''}</p>`}
    ${HELP_TYPES[a.type] && a.fromId === u.id ? '' : `<button class="btn sm light" data-act="emgopen" data-id="${a.id}">${HELP_TYPES[a.type] ? 'Help them' : 'Open protocol'}</button>`}<button class="btn sm ghost-light" data-act="emgdone" data-id="${a.id}">${HELP_TYPES[a.type] && a.fromId === u.id ? 'Cancel request' : 'Resolve'}</button></div>`).join('');
}

/* ---------- crew charts ---------- */
function crewChart(members, span, avgOnly) {
  const W = 960, H = 280, L = 40, R = avgOnly ? 16 : 100, T = 14, B = 30;
  const end = state.md, start = Math.max(1, end - span + 1);
  const x = (md) => L + ((md - start) / Math.max(1, end - start)) * (W - L - R);
  const at0 = (m, d) => { const r = m.days.find((p) => p.md === d); return r ? r.score : null; };
  let lo = 100; members.forEach((m) => { for (let d = start; d <= end; d++) { const v = at0(m, d); if (v != null) lo = Math.min(lo, v); } });
  const y0 = Math.max(0, Math.min(60, Math.floor((lo - 10) / 10) * 10));
  const y = (v) => T + (1 - (v - y0) / (100 - y0)) * (H - T - B);
  let g = '';
  const tick = 100 - y0 > 50 ? 20 : 10; const ticks = []; for (let v = y0; v <= 100; v += tick) ticks.push(v);
  ticks.forEach((v) => { g += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`; });
  g += `<rect class="band l0" x="${L}" y="${y(100)}" width="${W - L - R}" height="${y(85) - y(100)}"/>`;
  const step = Math.max(1, Math.ceil((end - start) / 7));
  for (let d = start; d <= end; d += step) g += `<text class="ax" x="${x(d)}" y="${H - 8}" text-anchor="middle">MD ${d}</text>`;
  const at = (m, d) => { const r = m.days.find((p) => p.md === d); return r ? r.score : null; };
  if (avgOnly) {
    const rows = [];
    for (let d = start; d <= end; d++) { const v = members.map((m) => at(m, d)).filter((s) => s != null); if (v.length) rows.push({ d, avg: Engine.avg(v), lo: Math.min(...v), hi: Math.max(...v) }); }
    if (rows.length) {
      g += `<path class="range" d="${rows.map((r, k) => `${k ? 'L' : 'M'}${x(r.d)} ${y(r.hi)}`).join(' ')} ${rows.slice().reverse().map((r) => `L${x(r.d)} ${y(r.lo)}`).join(' ')} Z"/>`;
      g += `<path class="line" pathLength="1" d="${rows.map((r, k) => `${k ? 'L' : 'M'}${x(r.d).toFixed(1)} ${y(r.avg).toFixed(1)}`).join(' ')}"/>`;
      rows.forEach((r) => { g += `<circle class="pt l0" cx="${x(r.d)}" cy="${y(r.avg)}" r="3.5"><title>MD ${r.d}: crew average ${Math.round(r.avg)} (lowest ${r.lo}, highest ${r.hi})</title></circle>`; });
    }
    return `<svg class="chart" style="--ar:${W}/${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Crew average readiness by mission day">${g}</svg>
      <div class="chart-key"><span><i class="key-line"></i>Crew average</span><span><i class="key-range"></i>Lowest to highest crew member</span><span><i class="l0"></i>Mission-ready zone (85+)</span></div>`;
  }
  const labels = [];
  members.forEach((m, i) => {
    const pts = []; for (let d = start; d <= end; d++) { const v = at(m, d); if (v != null) pts.push([d, v]); }
    if (!pts.length) return;
    g += `<path class="cline" style="stroke:${crewColor(i)}" d="${pts.map(([d, v], k) => `${k ? 'L' : 'M'}${x(d).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')}"/>`;
    pts.forEach(([d, v]) => { g += `<circle class="cpt" style="fill:${crewColor(i)}" cx="${x(d)}" cy="${y(v)}" r="2.6"><title>${esc(m.name)} · MD ${d}: ${v}</title></circle>`; });
    const [ld, lv] = pts[pts.length - 1]; labels.push({ y: y(lv), x: x(ld), t: `${firstName(m)} ${lv}`, c: crewColor(i) });
  });
  labels.sort((a, b) => a.y - b.y).forEach((l, k, arr) => { if (k && l.y - arr[k - 1].y < 14) l.y = arr[k - 1].y + 14; });
  labels.forEach((l) => { g += `<text class="dlabel" x="${l.x + 8}" y="${l.y + 4}" style="fill:${l.c}">${esc(l.t)}</text>`; });
  return `<svg class="chart" style="--ar:${W}/${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Readiness by crew member over the last ${span} days">${g}</svg>`;
}

/* ---------- Mission status ---------- */
function missionLength() { return state.missionDays || 180; }

function viewMission() {
  const crew = Crew.members(); const env = Engine.env(); const u = Auth.user();
  const len = missionLength(); const md = state.md; const frac = clamp(md / len, 0, 1);
  const phase = frac < 0.15 ? 'Adaptation phase' : frac < 0.75 ? 'Mid-mission' : frac < 1 ? 'Late mission' : 'Planned duration reached';
  const scores = crew.map((m) => m.readiness).filter((s) => s != null);
  const avgNow = scores.length ? Math.round(Engine.avg(scores)) : null;
  const yday = crew.map((m) => { const d = m.days.find((p) => p.md === md - 1); return d ? d.score : null; }).filter((s) => s != null);
  const avgY = yday.length ? Math.round(Engine.avg(yday)) : null;
  const delta = avgNow != null && avgY != null ? avgNow - avgY : null;
  const verdicts = crew.map((m) => Crew.verdict(m));
  const onTrack = verdicts.filter((v) => v.level === 0).length;
  const adv = crew.reduce((n, m) => n + m.advisories.length, 0);
  const advAct = crew.reduce((n, m) => n + m.advisories.filter((a) => a.level >= 2).length, 0);
  const checked = crew.filter((m) => m.checkedInToday).length;
  const alerts = Crew.alerts();

  const kpi = (label, value, sub, cls = '') => `<div class="kpi ${cls}"><span>${label}</span><b class="num">${value}</b><small>${sub}</small></div>`;
  const deltaTxt = delta == null ? 'no data for yesterday' : delta === 0 ? 'same as yesterday' : `${delta > 0 ? '+' : '−'}${Math.abs(delta)} since yesterday`;

  // daily log, newest first
  const log = [];
  for (let d = md; d >= Math.max(1, md - 6); d--) {
    const items = [];
    crew.forEach((m) => { const row = m.days.find((p) => p.md === d); if (row) row.newAdv.filter((a) => a.level >= 2).forEach((a) => items.push({ level: a.level, text: `${m.me ? 'You' : esc(m.name)}: ${esc(a.title)}` })); });
    alerts.filter((a) => a.md === d).forEach((a) => items.push({ level: 3, text: `${HELP_TYPES[a.type] ? `${esc(a.fromName)} asked the crew for help` : `Emergency raised for ${esc(a.aboutName)} — ${esc(alertName(a.type))}`}${a.status === 'resolved' ? ' (resolved)' : ''}` }));
    const n = crew.filter((m) => { const row = m.days.find((p) => p.md === d); return row && row.checkedIn; }).length;
    if (items.length || d === md) log.push({ d, items, n });
  }

  return pageHead('Mission status', `${esc(Missions.label())} · ${env.name} · updates every mission day`,
    `<button class="btn ghost" data-act="mreport">${icon('download')}Mission report</button><button class="btn primary" data-act="nextday">${icon('next')}Advance to MD ${md + 1}</button>`) + missionTabs() +
  `<section class="card mission-hero">
     <div class="mh-top"><div><span class="muted small">Mission day</span><p class="mh-day" data-count-wrap><b class="num">${md}</b><span class="num">of ${len}</span></p></div>
       <div class="mh-meta"><span>${phase}</span><span class="num">${Math.max(0, len - md)} days to go</span><span>${crew.length} crew</span></div></div>
     <div class="track" role="progressbar" aria-valuemin="1" aria-valuemax="${len}" aria-valuenow="${md}" aria-label="Mission progress"><i style="width:${frac * 100}%"></i>${[0.25, 0.5, 0.75].map((f) => `<em style="left:${f * 100}%"></em>`).join('')}</div>
     <div class="kpis">
       ${kpi('Crew readiness', avgNow ?? '—', deltaTxt, delta != null && delta < 0 ? 'down' : '')}
       ${kpi('On track', `${onTrack}/${crew.length}`, `${crew.length - onTrack} need watching or care`)}
       ${kpi('Open advisories', adv, `${advAct} need crew or medical action`)}
       ${kpi('Check-ins today', `${checked}/${crew.length}`, checked === crew.length ? 'everyone has checked in' : `${crew.length - checked} still to check in`)}
     </div>
   </section>
   <section class="card"><div class="card-h"><h2>Crew readiness over the mission</h2><span class="muted small">Last 30 days</span></div>${crewChart(crew, 30, true)}</section>
   <div class="grid-2">
     <section class="card"><div class="card-h"><h2>Crew roster</h2><span class="muted small">Today, MD ${md}</span></div>
       <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Crew member</th><th class="r">Readiness</th><th>Check-in</th><th>Main concern</th><th class="r">Dose</th></tr></thead><tbody>
       ${crew.map((m, i) => { const v = verdicts[i]; return `<tr><td><span class="who">${avatar(m, i, 'sm')}<span><b>${m.me ? 'You' : esc(m.name)}</b><small>${esc(m.role || '')}</small></span></span></td>
         <td class="r"><span class="num ${lc(v.level)}">${m.readiness ?? '—'}</span>${v.delta ? `<small class="dlt ${v.delta < 0 ? 'neg' : ''}">${v.delta > 0 ? '+' : '−'}${Math.abs(v.delta)}</small>` : ''}</td>
         <td>${m.checkedInToday ? `<span class="ok-t">${icon('check')}Done</span>` : '<span class="muted">Pending</span>'}</td>
         <td>${m.advisories[0] ? `${mark(m.advisories[0].level)} ${esc(m.advisories[0].title)}` : '<span class="muted">None</span>'}</td>
         <td class="r num">${m.dose.toFixed(1)} <small>mSv</small></td></tr>`; }).join('')}
       </tbody></table></div></section>
     <section class="card"><div class="card-h"><h2>Mission log</h2><span class="muted small">New findings needing action · 7 days</span></div>
       <ol class="mlog">${log.map((l) => `<li><div class="mlog-d"><b class="num">MD ${l.d}</b><small class="num">${l.n}/${crew.length} checked in</small></div>
         <ul>${l.items.length ? l.items.sort((a, b) => b.level - a.level).slice(0, 3).map((it) => `<li class="${lc(it.level)}"><span class="dot"></span><span>${it.text}</span></li>`).join('') + (l.items.length > 3 ? `<li class="quiet">+${l.items.length - 3} more</li>` : '') : '<li class="quiet">Nothing new needing action</li>'}</ul></li>`).join('')}</ol>
</section>
   </div>`;
}

function missionReport() {
  const crew = Crew.members(); const env = Engine.env(); const u = Auth.user(); const L = [];
  L.push('NOVACARE — MISSION STATUS REPORT');
  L.push(`${Missions.label()} · ${env.name}`);
  L.push(`Mission day ${state.md} of ${missionLength()} · generated ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`);
  L.push('');
  L.push('CREW');
  crew.forEach((m) => {
    const v = Crew.verdict(m);
    L.push(`  ${(m.me ? (state.name || u.name) : m.name).padEnd(22)} ${String(m.role || '').padEnd(22)} readiness ${String(m.readiness ?? '—').padStart(3)}  ${v.name.toUpperCase()}${m.sim ? '  (simulated)' : ''}`);
    m.advisories.slice(0, 3).forEach((a) => L.push(`      - [${LEVELS[a.level].name}] ${a.title}`));
  });
  L.push(''); L.push('CREW-WIDE FINDINGS');
  const f = Crew.findings(crew);
  if (!f.length) L.push('  None.');
  f.forEach((x) => { L.push(`  [${LEVELS[x.level].name}] ${x.title}`); L.push(`      ${x.detail}`); L.push(`      Action: ${x.act}`); });
  const act = Crew.active();
  L.push(''); L.push('ACTIVE EMERGENCIES');
  if (!act.length) L.push('  None.');
  act.forEach((a) => L.push(`  ${a.aboutName}: ${(EMG[a.type] || {}).name || a.type} (raised by ${a.fromName}, MD ${a.md})`));
  L.push(''); L.push('Prototype output. Not a medical device.');
  return L.join('\n');
}

/* ---------- Analysis ---------- */
function viewAnalysis() {
  const crew = Crew.members(); const find = Crew.findings(crew);
  const ranked = crew.map((m, i) => ({ m, i, v: Crew.verdict(m) })).sort((a, b) => b.v.level - a.v.level || (a.m.readiness ?? 0) - (b.m.readiness ?? 0));
  const seen = new Set();
  const groups = SYSTEMS.map((s) => ({ s, ids: s.indicators.filter((id) => !seen.has(id) && seen.add(id)) })).filter((g) => g.ids.length);
  const ahead = crew.filter((m) => !m.me && (m.predict || []).length);
  return pageHead('Analysis', 'Every reading, trend and prediction in NovaCare, applied to the whole crew. Most urgent first.') +
  predictCard(Predict.all()) +
  (ahead.length ? `<section class="card"><div class="card-h"><h2>${icon('chart')}Risks ahead for the crew</h2><span class="muted small">If current trends continue</span></div>
    <ul class="findings">${ahead.flatMap((m) => m.predict.map((p) => `<li class="${lc(p.level)}">${mark(p.level)}<div><b>${esc(firstName(m))}: ${esc(p.title)}</b><p>${esc(p.text)}</p></div></li>`)).join('')}</ul></section>` : '') +
  `<div class="an-grid">
    <section class="card"><div class="card-h"><h2>How each astronaut is doing</h2></div>
      <ul class="verdicts">${ranked.map(({ m, i, v }) => `<li class="${lc(v.level)}">
        <div class="vd-h">${avatar(m, i)}<div class="grow"><b>${m.me ? 'You' : esc(m.name)}</b><small>${esc(m.role || '')}</small></div>${verdictPill(v)}</div>
        <ul class="reasons">${v.reasons.slice(0, 3).map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
        ${m.me ? '<button class="btn ghost sm" data-act="view" data-v="overview">Open my status</button>' : `<button class="btn ghost sm" data-act="mate" data-id="${esc(m.id)}">View details</button>`}
      </li>`).join('')}</ul>
    </section>
    <section class="card"><div class="card-h"><h2>Crew-wide patterns</h2><span class="muted small">${find.length ? `${find.length} found` : ''}</span></div>
      ${find.length ? `<ul class="findings">${(ui.allFind ? find : find.slice(0, 3)).map((f) => `<li class="${lc(f.level)}">${mark(f.level)}<div><b>${esc(f.title)}</b><p>${esc(f.detail)}</p><p class="act"><span>What to do</span>${esc(f.act)}</p></div></li>`).join('')}</ul>${find.length > 3 ? `<button class="btn quiet sm more" data-act="allfind">${ui.allFind ? 'Show fewer' : `Show ${find.length - 3} more`}</button>` : ''}`
        : `<p class="empty">No crew-wide pattern found. Individual findings are listed on the left.</p>`}
    </section>
  </div>
  <section class="card"><div class="card-h"><h2>Readiness by crew member</h2><span class="muted small">Last 14 days</span></div>${crewChart(crew, 14, false)}</section>
  <details class="card disclose"><summary><h2>Full indicator matrix</h2><span class="muted small">Latest value of every indicator, by crew member</span>${icon('next')}</summary>
    <div class="tbl-wrap"><table class="heat"><thead><tr><th rowspan="2">Crew member</th>${groups.map((g) => `<th colspan="${g.ids.length}" class="grp">${g.s.name}</th>`).join('')}</tr>
      <tr>${groups.map((g) => g.ids.map((id) => `<th class="ind" title="${esc(IND[id].name)}">${IND[id].short}</th>`).join('')).join('')}</tr></thead>
      <tbody>${crew.map((m, i) => `<tr><th class="who">${avatar(m, i, 'sm')}${m.me ? 'You' : esc(firstName(m))}</th>${groups.map((g) => g.ids.map((id) => { const l = m.latest[id] || {}; const lvl = l.v == null ? -1 : l.level;
        return `<td class="${lc(lvl)}" title="${esc(IND[id].short)}: ${l.v == null ? 'no data' : `${Engine.fmt(IND[id], l.v)} ${IND[id].unit} · ${levelText(lvl)}`}">${mark(lvl)}<span class="num">${l.v == null ? '—' : Engine.fmt(IND[id], l.v)}</span></td>`; }).join('')).join('')}</tr>`).join('')}</tbody>
    </table></div>
    <p class="legend">${LEVELS.map((l, k) => `<span class="${lc(k)}">${l.sym} ${l.name}</span>`).join('')}<span class="ln">○ No recent data</span></p>
  </details>`;
}
