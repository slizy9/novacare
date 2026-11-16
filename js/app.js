/* NOVACARE — user interface. */

const ui = { view: 'lobby', sub: 'overview', sys: null, modal: null, range: 14, auth: 'login', authErr: '', busy: false };
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const lc = (level) => (level < 0 ? 'ln' : 'l' + level);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const fin = Number.isFinite;

function pill(level, extra = '') {
  if (level < 0) return `<span class="pill ln">○ No data${extra}</span>`;
  return `<span class="pill ${lc(level)}">${LEVELS[level].sym} ${LEVELS[level].name}${extra}</span>`;
}

function valueText(ind, v) {
  if (v == null) return '—';
  if (ind.type === 'scale') return esc(Engine.label(ind, v));
  return `${Engine.fmt(ind, v)}<small> ${ind.unit}</small>`;
}

function targetText(ind) {
  const b = ind.bands(Engine.env(), Engine.ctx()); const [lo, hi] = b.ok;
  if (ind.type === 'scale') {
    const a = Engine.label(ind, Math.max(lo, ind.min)), z = Engine.label(ind, Math.min(hi, ind.max));
    return 'Target: ' + (a === z ? a : `${a} – ${z}`);
  }
  const loOpen = !fin(lo) || lo <= ind.min, hiOpen = !fin(hi) || hi >= ind.max;
  const f = (x) => (+x).toFixed(ind.dec);
  if (loOpen && hiOpen) return 'Your first entry sets the baseline';
  if (loOpen) return `Target: up to ${f(hi)} ${ind.unit}`;
  if (hiOpen) return `Target: ${f(lo)} ${ind.unit} or more`;
  return `Target: ${f(lo)}–${f(hi)} ${ind.unit}`;
}

/* ---------- small visual components ---------- */
function rangeBar(ind, v) {
  const env = Engine.env(), ctx = Engine.ctx();
  const [a, b] = ind.view(env, ctx); const bands = ind.bands(env, ctx);
  const pts = [...new Set([a, bands.crit[0], bands.warn[0], bands.ok[0], bands.ok[1], bands.warn[1], bands.crit[1], b]
    .filter((x) => fin(x) && x >= a && x <= b))].sort((x, y) => x - y);
  let segs = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const mid = (pts[i] + pts[i + 1]) / 2; const lvl = Engine.classify(ind, mid, ctx).level;
    segs += `<i class="${lc(lvl)}" style="flex:${(pts[i + 1] - pts[i]) / (b - a)}"></i>`;
  }
  if (ind.type === 'scale') {
    segs = ind.scale.map((o) => `<i class="${lc(Engine.classify(ind, o.v, ctx).level)}" style="flex:1"></i>`).join('');
  }
  let marker = '';
  if (v != null && fin(v)) {
    const pos = ind.type === 'scale'
      ? ((v - ind.min + 0.5) / (ind.max - ind.min + 1)) * 100
      : clamp((v - a) / (b - a), 0, 1) * 100;
    marker = `<b style="left:${pos}%"></b>`;
  }
  return `<div class="rbar" aria-hidden="true">${segs}${marker}</div>`;
}

function sparkline(id) {
  const s = Engine.series(id).slice(-14);
  if (s.length < 2) return '<svg class="spark" viewBox="0 0 120 32"></svg>';
  const vs = s.map((p) => p.v); const lo = Math.min(...vs), hi = Math.max(...vs); const span = hi - lo || 1;
  const x = (i) => 3 + (i / (s.length - 1)) * 114; const y = (v) => 28 - ((v - lo) / span) * 24;
  const d = s.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ');
  const last = s[s.length - 1];
  return `<svg class="spark" viewBox="0 0 120 32" aria-hidden="true"><path d="${d}"/><circle cx="${x(s.length - 1)}" cy="${y(last.v)}" r="3"/></svg>`;
}

function chart(ind, range) {
  const ctx = Engine.ctx(); const all = Engine.series(ind.id);
  const start = range ? Math.max(1, state.md - range + 1) : (all.length ? all[0].md : 1);
  const data = all.filter((p) => p.md >= start);
  const W = 680, H = 250, L = 46, R = 14, T = 12, B = 30;
  if (!data.length) return `<div class="chart-empty">No readings in this period yet.</div>`;
  const bands = ind.bands(Engine.env(), ctx);
  let y0, y1;
  if (ind.type === 'scale') { y0 = ind.min - 0.3; y1 = ind.max + 0.3; }
  else {
    const c = data.map((p) => p.v);
    bands.ok.forEach((x) => { if (fin(x) && x > ind.min && x < ind.max) c.push(x); });
    y0 = Math.min(...c); y1 = Math.max(...c); const pad = (y1 - y0 || 1) * 0.12; y0 -= pad; y1 += pad;
  }
  const end = Math.max(state.md, start + 1);
  const x = (md) => L + ((md - start) / (end - start)) * (W - L - R);
  const y = (v) => T + (1 - (v - y0) / (y1 - y0)) * (H - T - B);
  const band = (lo, hi, cls) => {
    const a = Math.max(lo, y0), z = Math.min(hi, y1);
    return z > a ? `<rect class="band ${cls}" x="${L}" y="${y(z)}" width="${W - L - R}" height="${y(a) - y(z)}"/>` : '';
  };
  let g = band(bands.warn[0], bands.ok[0], 'l1') + band(bands.ok[1], bands.warn[1], 'l1') + band(bands.ok[0], bands.ok[1], 'l0');
  for (let i = 0; i <= 4; i++) {
    const v = y0 + ((y1 - y0) * i) / 4;
    const lab = ind.type === 'scale' ? '' : v.toFixed(ind.dec);
    g += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${lab}</text>`;
  }
  if (ind.type === 'scale') ind.scale.forEach((o) => { g += `<text class="ax" x="${L - 8}" y="${y(o.v) + 4}" text-anchor="end">${o.v}</text>`; });
  const stepX = Math.max(1, Math.ceil((end - start) / 8));
  for (let md = start; md <= end; md += stepX) g += `<text class="ax" x="${x(md)}" y="${H - 8}" text-anchor="middle">MD ${md}</text>`;
  const d = data.map((p, i) => `${i ? 'L' : 'M'}${x(p.md).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ');
  g += `<path class="line" d="${d}" pathLength="1"/>`;
  data.forEach((p) => {
    const lvl = Engine.classify(ind, p.v, ctx).level;
    g += `<circle class="pt ${lc(lvl)}" cx="${x(p.md)}" cy="${y(p.v)}" r="4.5"><title>MD ${p.md}: ${Engine.fmt(ind, p.v)} ${ind.unit} ${Engine.label(ind, p.v)} — ${LEVELS[lvl].name}</title></circle>`;
  });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(ind.name)} over time">${g}</svg>
    <div class="chart-key"><span><i class="l0"></i>Target range</span><span><i class="l1"></i>Watch range</span><span>Hover a point for its value</span></div>`;
}

function ring(score) {
  const C = 2 * Math.PI * 54; const lvl = score == null ? -1 : score >= 85 ? 0 : score >= 70 ? 1 : score >= 50 ? 2 : 3;
  const word = ['Mission ready', 'Keep watch', 'Needs attention', 'Act now'][lvl] || 'No data yet';
  return `<div class="ring ${lc(lvl)}">
    <svg viewBox="0 0 128 128"><circle class="bg" cx="64" cy="64" r="54"/><circle class="fg" cx="64" cy="64" r="54" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - (score || 0) / 100)}" transform="rotate(-90 64 64)"/></svg>
    <div class="ring-in"><b ${score != null ? `data-count="${score}"` : ''}>${score ?? '—'}</b><span>readiness</span></div></div>
    <div class="ring-word ${lc(lvl)}">${word}</div>`;
}

/* ---------- views ---------- */
/* App shell: four sections, Personal has its own sub-views. */
const SECTIONS = [
  { v: 'lobby', label: 'Home', icon: 'home', c: '#2f6bff', desc: 'How you are today and what to do next' },
  { v: 'personal', label: 'My health', icon: 'user', c: '#f0388a', desc: 'Your readings, routine and medical profile' },
  { v: 'crew', label: 'Crew', icon: 'users', c: '#7c5cff', desc: 'Your crewmates, their allergies and the ship inventory' },
  { v: 'mission', label: 'Mission', icon: 'rocket', c: '#e8590c', desc: 'Mission status, the log, and switching missions' },
  { v: 'analysis', label: 'Insights', icon: 'bars', c: '#12a594', desc: 'Who is doing well and who needs help' },
];
const PERSONAL = [
  { v: 'overview', label: 'Overview', icon: 'pulse' },
  { v: 'today', label: 'Today', icon: 'checks' },
  { v: 'vitals', label: 'Vitals', icon: 'heart' },
  { v: 'hazards', label: 'Hazards', icon: 'hazard' },
  { v: 'mind', label: 'Mind', icon: 'brain' },
  { v: 'medical', label: 'Medical profile', icon: 'care' },
];
const SUB_ALIAS = { mind: 'mind', status: 'overview', routine: 'today', vitals: 'vitals', hazards: 'hazards', overview: 'overview', today: 'today', medical: 'medical' };

const LOGO = '<svg class="logo" viewBox="0 0 48 48" aria-hidden="true"><circle class="lg-o" cx="24" cy="24" r="19.5"/><path class="lg-ecg" d="M9.5 25h8l4.2-9 6 16.5 4.2-10.5 2.6 3H38.5"/></svg>';
const SWOOSH = '<svg class="swoosh" viewBox="0 0 220 44" aria-hidden="true"><defs><linearGradient id="swg" x1="0" x2="1"><stop offset="0" stop-color="#ff4f9a" stop-opacity="0"/><stop offset="1" stop-color="#ff4f9a"/></linearGradient></defs><path d="M4 40C50 14 120 6 196 12" fill="none" stroke="url(#swg)" stroke-width="3" stroke-linecap="round"/><path d="M206 0c1.5 7 3.5 9 10 11-6.5 2-8.5 4-10 11-1.5-7-3.5-9-10-11 6.5-2 8.5-4 10-11z" fill="#ff4f9a"/></svg>';

function renderTop() {
  const env = Engine.env(); const u = Auth.user(); const on = navigator.onLine !== false; const mission = Missions.current();
  $('#top').innerHTML = `
    <div class="brand" role="button" tabindex="0" data-act="view" data-v="lobby" title="Back to the mission lobby">${LOGO}
      <div><b>NovaCare</b><span>${esc(mission.name)}</span></div></div>
    <div class="sysline ${on ? 'on' : 'off'}" role="status"><i></i>${on ? 'System Online' : 'Offline mode'}</div>
    <div class="top-r" id="topr">
      ${I18N.picker()}
      <button class="chip hide-s" data-act="settings" title="Environment and mission settings">${icon('orbit')}${env.short}</button>
      ${(() => { const n = Reminders.list().length; return `<button class="chip bell ${n ? 'has' : ''}" data-act="reminders" title="Reminders" aria-label="Reminders${n ? `, ${n} pending` : ''}">${icon('bell')}${n ? `<em class="num">${n}</em>` : ''}</button>`; })()}
      ${syncChip()}
      <button class="chip icon-only hide-s" data-act="theme" title="Switch to ${document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'} mode" aria-label="Switch to ${document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'} mode">${icon(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon')}</button>
      ${Missions.has() ? `<div class="md" title="Mission day — changes at midnight">MD <b class="num">${state.md}</b></div>` : ''}
      <div class="user-chip" title="${u.guest ? 'Guest — data stays on this device' : `Signed in as ${esc(u.id)}`}"><span class="avatar ${myPhoto() ? 'ph' : ''}" aria-hidden="true">${myPhoto() ? `<img src="${esc(myPhoto())}" alt="" data-name="${esc(u.guest ? u.name : state.name || u.name)}">` : esc(initials(state.name || u.name))}</span><span class="uname">${esc(state.name || u.name)}</span><button data-act="logout" title="Sign out" aria-label="Sign out">${icon('logout')}</button></div>
    </div>`;
}

function renderNav() {
  const alerts = Crew.active().length; const cur = SECTIONS.find((t) => t.v === ui.view) || SECTIONS[0];
  document.documentElement.style.setProperty('--tab', cur.c);
  const none = Missions.locked(); const free = (v) => v === 'lobby' || v === 'mission';
  $('#nav').innerHTML = `<ul><li class="ind" aria-hidden="true"></li>${SECTIONS.map((t, i) => `<li><button class="nav-i ${ui.view === t.v ? 'on' : ''} ${none && !free(t.v) ? 'locked' : ''}" data-act="view" data-v="${t.v}" title="${none && !free(t.v) ? 'Create or join a mission first' : `${t.label} (press ${i + 1})`}" ${ui.view === t.v ? 'aria-current="page"' : ''} ${none && !free(t.v) ? 'aria-disabled="true"' : ''}>
      <span class="nav-ic">${icon(t.icon)}</span><span>${t.label}</span>${t.v === 'crew' && alerts ? `<em class="nav-badge" aria-label="${alerts} active emergencies">${alerts}</em>` : ''}</button></li>`).join('')}</ul>
    <button class="nav-set" data-act="settings" title="Mission settings" aria-label="Mission settings">${icon('settings')}</button>`;
  slideInd($('#nav ul'), 'nav');
}

/* ---------- mission lobby: you first, then a short look at the mission ---------- */
function viewLobby() {
  const u = Auth.user(); const first = (state.name || u.name || '').split(' ')[0];
  const has = Missions.has(); const locked = Missions.locked(); const cur = Missions.current();
  const crew = Crew.members(); const me = crew[0]; const v = Crew.verdict(me); const due = Engine.dueList().length;
  const alerts = Crew.active().length; const len = missionLength();
  const pct = clamp(state.md / len, 0, 1); const left = Math.max(0, len - state.md);
  const lead = locked ? '<p class="lobby-lead">Welcome aboard. Create your own mission or join one to start tracking your health with a crew.</p>'
    : has ? `<div class="day-prog" role="progressbar" aria-valuemin="1" aria-valuemax="${len}" aria-valuenow="${state.md}" aria-label="Mission day ${state.md} of ${len}">
        <div class="day-prog-t"><span>Day <b class="num">${state.md}</b> of ${len}</span><span>${left ? `${left} day${left === 1 ? '' : 's'} to go` : 'Last day'}</span></div>
        <div class="day-prog-bar"><i style="width:${Math.max(2, pct * 100)}%"></i></div></div>`
    : '<p class="lobby-lead">Your personal space. Log check-ins and explore every section — join or create a mission any time from the Mission tab.</p>';
  const day = Engine.today(); const done = checkinDone(day);
  const cta = locked
    ? `<button class="btn primary lg" data-act="view" data-v="mission">${icon('rocket')}Choose a mission</button>`
    : ''; // Questions, How do you feel and Add info are in the panel on the right; Help is the red button on every page
  // the check-in is offered, never forced: Start, or Not today
  const choice = locked ? '' : done
    ? (() => { const waiting = Care.open().filter((c) => c.status === 'new').length; // never "nothing to do" while recommendations wait
        return `<div class="ci-choice ok">${icon('check')}<div><b>Check-in done</b><small>${Status.due() ? 'Quick status due' : waiting ? `${waiting} new recommendation${waiting > 1 ? 's' : ''} to read` : 'Nothing else to fill in right now'}</small></div>${Status.due() ? `<button class="btn primary sm" data-act="status">How do you feel?</button>` : waiting ? `<button class="btn primary sm" data-act="reminders">See</button>` : `<button class="btn quiet sm" data-act="checkin">Edit</button>`}</div>`; })()
    : day.skipCheckin
      ? `<div class="ci-choice skip">${icon('plus')}<div><b>No check-in today</b><small>You can still do it any time</small></div><button class="btn ghost sm" data-act="checkin">Start check-in</button></div>`
      : `<div class="ci-choice">${icon('pulse')}<div><b>Do today’s check-in?</b><small>About a minute · one screen</small></div>
          <button class="btn quiet sm" data-act="skipcheckin">Not today</button><button class="btn primary sm" data-act="checkin">Start</button></div>`;
  // header in the style of the references: eyebrow, headline with an italic word, key numbers, a glass "live" panel
  const hero = `<section class="card hero lobby-hero">
      <div class="hero-main"><p class="lobby-clock" id="lobby-clock">${clockHtml()}</p>
        <h1 class="hero-title"><span>${greeting()}</span>${first ? `, <em>${esc(first)}.</em>` : '.'}</h1>
        ${lead}
        ${choice}
        <div class="hero-cta">${cta}</div></div>
      ${locked ? '' : `<div class="hero-live acts"><nav class="glass lobby-acts" aria-label="Your health">
        <p class="glass-h"><span>Your health</span></p>
        ${[['checkin', 'plus', 'Add info', done ? 'Check-in done · add more' : 'Today’s check-in · about a minute'],
          ['status', 'checks', 'How do you feel', Status.due() ? 'Quick status is due' : 'Quick status · 30 seconds'],
          ['ask', 'chat', 'Questions', 'Voice or text, works offline'],
          ['mindgo', 'brain', 'Mind', Mind.checkDue() ? 'Weekly check is due · 2 minutes' : 'Programs and Window to Earth']].map(([act, ic, t, s]) => `<button class="la" data-act="${act}">${icon(ic)}<span><b>${t}</b><small>${s}</small></span>${icon('next', 'la-go')}</button>`).join('')}
      </nav></div>`}
    </section>`;
  if (locked) return hero;

  // one card: readiness + the vitals that matter most, each with its status
  const top = me.advisories[0];
  const vital = (id, label) => {
    const st = Engine.status(id); const lvl = st.v == null ? -1 : st.level;
    let val = valueText(IND[id], st.v);
    if (id === 'sys' && st.v != null) { const d = Engine.status('dia'); val = `${st.v}/${d.v ?? '—'}<small> mmHg</small>`; }
    return `<button class="tv ${lc(lvl)}" data-act="detail" data-id="${id}" aria-label="${esc(IND[id].name)}, open trend">
      <span class="tv-l">${label}</span><b class="tv-v num">${val}</b>
      <span class="tv-s"><span class="dot"></span>${st.v == null ? 'Not logged' : levelText(lvl)}${st.v != null && st.age > 0 ? ` · MD ${st.md}` : ''}</span></button>`;
  };
  const today = `<section class="card today space" aria-label="You today">
      <div class="today-score">${ring(me.readiness)}</div>
      <div class="today-main">
        <div class="today-h"><div><h2>You today</h2><p class="muted small">${v.level < 0 ? 'Log a check-in to get your readiness score.' : esc(v.reasons[0] || v.name)}</p></div>
          <button class="btn ghost sm" data-act="view" data-v="personal">My health${icon('next')}</button></div>
        <div class="tv-grid">${[['hr', 'Heart rate'], ['sys', 'Blood pressure'], ['spo2', 'Oxygen (SpO₂)'], ['sleep', 'Sleep']].map(([id, l]) => vital(id, l)).join('')}</div>
        <div class="today-foot">
          <span class="${top ? lc(top.level) : 'l0'}"><span class="dot"></span>${top ? esc(top.title) : 'No active concerns'}</span>
          <span class="ln">${icon('zap')}${me.dose.toFixed(1)} mSv this mission</span>
        </div>
      </div></section>`;

  let mission;
  if (has) {
    const verdicts = crew.map((m) => Crew.verdict(m)); const onTrack = verdicts.filter((x) => x.level === 0).length;
    const items = Inventory.items(); const low = items.filter((i) => Inventory.level(i) > 0).length;
    const frac = clamp(state.md / len, 0, 1);
    mission = `<section class="card lobby-mission space">
        <div><span class="kicker">${esc(ENVIRONMENTS[cur.env].short)}</span><h2>${esc(cur.name)}</h2></div>
        <ul class="lm-list">
          <li>${icon('users')}<span>Crew on track</span><b class="num">${onTrack}/${crew.length}</b></li>
          <li class="${alerts ? 'hot' : ''}">${icon('siren')}<span>Active emergencies</span><b class="num">${alerts}</b></li>
          <li class="${low ? 'warn' : ''}">${icon('box')}<span>Supplies low or out</span><b class="num">${low}</b></li>
        </ul>
        <div class="lm-acts"><button class="btn ghost sm" data-act="missiontab" data-v="missions">Switch</button><button class="btn primary sm" data-act="missiontab" data-v="status">Mission status${icon('next')}</button></div>
      </section>`;
  } else {
    mission = `<section class="card lobby-mission space">
        <div><span class="kicker">Guest</span><h2>No mission yet</h2></div>
        <p class="muted small">Use every section on your own, or join a mission to share your status with a crew on this device.</p>
        <div class="lm-acts"><button class="btn primary sm" data-act="missiontab" data-v="missions">${icon('rocket')}Browse missions</button></div></section>`;
  }
  // most important first: you today and your plan, then the crew, then the first-visit guide and what is ahead
  return hero + `<div class="lobby-grid">${today}${mission}</div>` + guideHtml();
}

/* First visit: the three things to know, in plain words. Hidden for good with "Got it". */
function guideHtml() {
  if (state.guideDone) return '';
  const step = (n, ic, t, d, act, label) => `<li><span class="gd-n">${n}</span><div><b>${icon(ic)}${t}</b><p>${d}</p></div>${act ? `<button class="btn ghost sm" ${act}>${label}</button>` : ''}</li>`;
  return `<section class="card guide space" aria-label="How NovaCare works">
    <div class="card-h"><div><h2>How NovaCare works</h2><p class="muted small">Three things — that’s all you need.</p></div><button class="btn primary sm" data-act="guidedone">Got it</button></div>
    <ol class="gd">
      ${step(1, 'pulse', 'Check in once a day', 'About a minute: how you feel and your vitals. NovaCare tells you if anything needs attention.', 'data-act="checkin"', 'Check in')}
      ${step(2, 'siren', 'Press Help when you need it', 'The red Help button is on every screen. Your whole crew is alerted at once.', '', '')}
      ${step(3, 'care', 'Fill in your medical profile', 'Allergies and medication — your crew sees them in an emergency.', 'data-act="sub" data-v="medical"', 'Fill in')}
    </ol></section>`;
}

/* ---------- Mission tab: "Status" and "Missions" (switch, create, join, browse) ---------- */
function missionTabs() {
  if (!Missions.has()) return '';
  const on = ['missions', 'log'].includes(ui.missionTab) ? ui.missionTab : 'status';
  const tabs = [['status', 'Mission status', 'bars'], ['log', 'Log', 'file'], ['missions', 'Missions', 'layers']];
  return `<nav class="subnav" aria-label="Mission sections"><span class="ind" aria-hidden="true"></span>${tabs.map(([v, l, ic]) => `<button class="${on === v ? 'on' : ''}" data-act="missiontab" data-v="${v}" ${on === v ? 'aria-current="page"' : ''}>${icon(ic)}${l}</button>`).join('')}</nav>`;
}
function missionPage() { return ui.missionTab === 'missions' || !Missions.has() ? viewMissions() : ui.missionTab === 'log' ? viewLog() : viewMission(); }

function viewMissions() {
  const all = Missions.list(); const u = Auth.user();
  Missions.refreshDirectory(false, () => { if (ui.view === 'mission' && !ui.modal && Auth.user()) render(); });
  const missions = all.map((m) => { const e = ENVIRONMENTS[m.env];
    return `<article class="mcard ${m.active ? 'on' : ''}" style="--m:${(MISSION_ART[m.env] || MISSION_ART.iss).c}">
      <button class="mcard-main" data-act="mission" data-code="${esc(m.code)}" aria-pressed="${m.active}">
        <span class="mcard-art">${missionArt(m.env)}${m.active ? `<span class="mcard-badge">${icon('check')}Active</span>` : ''}</span>
        <span class="mcard-b"><span class="mcard-k">${esc(e.short)}</span><b>${esc(m.name)}</b>
          <span class="mcard-facts"><span>${icon('clock')}Mission day ${m.md} of ${m.len}</span><span>${icon('zap')}${e.rad} mSv/day · ${esc(e.gravity)}</span><span>${icon('user')}${m.role === 'creator' ? 'Created by you' : 'Joined with a code'}</span></span>
          <span class="mcard-go">${m.active ? 'Open mission status' : 'Switch to this mission'}${icon('next')}</span></span></button>
      <footer class="mcard-foot"><button class="codechip" data-act="copycode" data-code="${esc(m.code)}" title="Copy the code to share it with your crew">${icon('copy')}<span>${esc(m.code)}</span></button>
        <button class="btn quiet sm" data-act="leavemission" data-code="${esc(m.code)}">Leave</button></footer></article>`; }).join('');
  const onShow = all.some((m) => m.code === SHOWCASE.code);
  const adds = (onShow || u.guest ? '' : `<button class="mcard add show" data-act="joindir" data-code="${SHOWCASE.code}"><span class="add-ic">${icon('users')}</span><b>Join ${SHOWCASE.name}</b><small>The shared crew. Visitors who open NovaCare as a guest will see you on it (never your medical history).</small></button>`) +
    `<button class="mcard add" data-act="newmission"><span class="add-ic">${icon('plus')}</span><b>Create a mission</b><small>Name it, pick where it happens and get a code to share with your crew.</small></button>
    <button class="mcard add join" data-act="joinmission"><span class="add-ic">${icon('users')}</span><b>Join with a code</b><small>Enter the code a crewmate shared to join their mission.</small></button>`;
  return pageHead('Missions', Missions.has() ? 'Switch between your missions, create a new one or join one' : `${u.guest ? 'Optional for guests: ' : ''}create your own mission or join one to work with a crew`) + missionTabs() +
    `<section class="lobby-sec"><div class="lobby-h"><h2>Your missions</h2><p>${all.length ? `${all.length} mission${all.length === 1 ? '' : 's'} · each one keeps its own readings, crew and ship inventory.` : 'None yet — create one or join a mission from the list below.'}</p></div>
      <div class="mgrid">${missions}${adds}</div></section>
    ${directoryHtml(all)}`;
}

/* Every mission people have created (shared database), so anyone can find one and join it. */
function directoryHtml(mine) {
  if (!Auth.configured()) return '';
  const have = new Set(mine.map((m) => m.code));
  const list = Missions.directory().filter((m) => !have.has(m.code));
  const cards = list.map((m) => { const env = ENVIRONMENTS[m.env] ? m.env : 'iss'; const e = ENVIRONMENTS[env];
    return `<article class="mcard dir" style="--m:${(MISSION_ART[env] || MISSION_ART.iss).c}">
      <div class="mcard-main"><span class="mcard-art">${missionArt(env)}</span>
        <span class="mcard-b"><span class="mcard-k">${esc(e.short)}</span><b>${esc(m.name)}</b>
          <span class="mcard-facts"><span>${icon('clock')}${m.mission_days} days planned</span><span>${icon('zap')}${e.rad} mSv/day · ${esc(e.gravity)}</span><span>${icon('user')}Created by ${esc(m.creator_name || 'a crew member')}</span></span></span></div>
      <footer class="mcard-foot"><span class="codechip static">${icon('rocket')}<span>${esc(m.code)}</span></span>
        <button class="btn primary sm" data-act="joindir" data-code="${esc(m.code)}">${icon('users')}Join</button></footer></article>`; }).join('');
  return `<section class="lobby-sec"><div class="lobby-h"><h2>All missions</h2><p>${list.length ? `Missions created by people on NovaCare. Join one to see its crew and ship inventory.${Auth.user().guest ? ' As a guest, a mission you join stays on this device.' : ''}` : 'No other missions yet. Create one and it will show up here for everyone.'}</p></div>
      ${list.length ? `<div class="mgrid">${cards}</div>` : ''}</section>`;
}

/* Personal overview: who you are, key vitals, health shortcuts and the body scan. */
function overviewTop() {
  const u = Auth.user(); const hr = Engine.status('hr'); const mission = Missions.current();
  // the body scan opens on the system of the most important open follow-up
  const topSys = (() => { const c = Care.open().find((x) => x.ind); const s0 = c && SYSTEMS.find((x) => x.indicators.includes(c.ind)); return s0 ? s0.id : null; })();
  const sel = SYS[ui.sys] ? ui.sys : topSys; const sys = sel ? SYS[sel] : null;
  const item = (act, v, ic, label) => `<button class="hl" data-act="${act}" ${v ? `data-v="${v}"` : ''}>${icon(ic)}<span>${label}</span>${icon('next', 'hl-go')}</button>`;
  return `<div class="ov">
    <div class="ov-col">
      <section class="card ov-id"><button class="ov-photo" data-act="photopick" title="Change your profile photo" aria-label="Change your profile photo">${myPhoto() ? `<img src="${esc(myPhoto())}" alt="" data-name="${esc(u.guest ? u.name : state.name || u.name)}">` : crewPortrait(state.name || u.name)}<span class="ov-photo-edit">${icon('plus')}${myPhoto() ? 'Change' : 'Add photo'}</span></button>
        <div><h2>${esc(state.name || u.name)}</h2><p>${icon('users')}${esc(u.role)}</p><p>${icon('rocket')}${esc(mission.name)}</p><p>${icon('clock')}Mission day ${state.md}</p></div></section>
      <section class="card ov-kv"><h2>Key Vitals</h2>
        <button class="ov-hr ${lc(hr.level)}" data-act="detail" data-id="hr" aria-label="Heart rate, open trend"><span class="ov-heart">${icon('heart')}</span>
          <span class="ov-n"><b class="num" ${hr.v == null ? '' : `data-count="${hr.v}"`}>${hr.v == null ? '—' : hr.v}</b><small>bpm</small></span>
          <svg class="ecg" viewBox="0 0 170 60" aria-hidden="true"><path d="M0 34h38l8-8 8 8h10l7-26 9 48 8-30 6 8h12l7-14 8 14h41"/></svg></button>
        <ul class="kv-list">${(() => { const fu = new Set(Care.open().map((c) => c.ind)); return [['sys', 'Blood pressure', 'drop'], ['spo2', 'Blood oxygen', 'wind'], ['temp', 'Temperature', 'zap'], ['sleep', 'Sleep', 'clock'], ['stress', 'Stress', 'brain']].sort((a, b) => fu.has(b[0]) - fu.has(a[0])); })().map(([id, label, ic]) => {
          const st = Engine.status(id); const lvl = st.v == null ? -1 : st.level;
          let val = st.v == null ? '—' : IND[id].type === 'scale' ? esc(Engine.label(IND[id], st.v)) : `${Engine.fmt(IND[id], st.v)}<small> ${IND[id].unit}</small>`;
          if (id === 'sys' && st.v != null) { const d = Engine.status('dia'); val = `${st.v}/${d.v ?? '—'}<small> mmHg</small>`; }
          return `<li><button class="${lc(lvl)}" data-act="detail" data-id="${id}" aria-label="${esc(label)}, open trend"><span class="kv-ic">${icon(ic)}</span><span class="kv-l">${label}</span><b class="kv-v num">${val}</b><span class="kv-s"><span class="dot"></span>${st.v == null ? 'Not logged' : levelText(lvl)}${Care.open().some((c) => c.ind === id) ? ' · follow-up' : ''}</span></button></li>`;
        }).join('')}</ul></section>
    </div>
    <section class="card ov-health"><h2>Health</h2>
      ${item('sub', 'vitals', 'pulse', 'Vitals')}${item('sub', 'today', 'calendar', 'Routine')}${item('sub', 'hazards', 'hazard', 'Hazards')}${item('sub', 'medical', 'care', 'Medical profile')}${item('bodystatus', '', 'layers', 'Body Status')}</section>
    <section class="card ov-body" id="systems"><div class="ov-holo">${bodyModel(sel)}</div>
      <div class="ov-sys" aria-live="polite">${sys
        ? `<div class="ov-sys-h"><h2>${esc(sys.name)}</h2>${pill(Engine.systemLevel(sel))}</div>
          <div class="ov-ind">${sys.indicators.map((id) => { const st = Engine.status(id); return `<button class="${lc(st.level)}" data-act="detail" data-id="${id}"><span class="dot"></span>${esc(IND[id].short)}<b>${valueText(IND[id], st.v)}</b></button>`; }).join('')}</div>`
        : `<p class="ov-hint">${icon('layers')}Tap a label on the scan to see that body system.</p>`}</div></section>
  </div>${sys ? osdrCard(sel) : ''}`;
}

/* Real NASA spaceflight biology studies for the selected body system (OSDR snapshot in js/osdr.js). */
function osdrCard(sel) {
  const r = typeof OSDR !== 'undefined' && OSDR.systems[sel]; if (!r || !r.studies.length) return '';
  const meta = (st) => [st.organism, st.tissue, st.kind === 'Spaceflight' && st.mission ? `${st.mission}` : st.kind, st.year].filter(Boolean).map((t) => `<span class="tag sm">${esc(String(t))}</span>`).join('');
  return `<section class="card osdr" aria-label="NASA research on ${esc(SYS[sel].name)}">
    <div class="osdr-h"><div><h2>${icon('rocket')}NASA research on ${esc(SYS[sel].name.toLowerCase())}</h2>
      <p class="muted small">${r.total} studies in NASA’s Open Science Data Repository${r.humans ? `, ${r.humans} with human data` : ''}. The 3 most relevant, astronaut studies first.</p></div></div>
    <ul class="osdr-list">${r.studies.slice(0, 3).map((st) => `<li><a href="${esc(st.url)}" target="_blank" rel="noopener"><span class="osdr-id">${esc(st.id)}</span><b>${esc(st.title)}</b></a>
      <div class="osdr-meta">${meta(st)}</div>${st.about ? `<p class="muted small">${esc(st.about)}</p>` : ''}</li>`).join('')}</ul>
    <p class="muted small">Source: NASA OSDR Biological Data API · snapshot ${esc(OSDR.snapshot)} · available offline. Opening a study needs a link to Earth.</p>
  </section>`;
}

function viewPersonal() {
  const due = Engine.dueList().length;
  const body = { overview: viewStatus, today: viewRoutine, vitals: viewVitals, hazards: viewHazards, mind: Mind.view, medical: viewMedical }[ui.sub]();
  return pageHead(`${state.name ? esc(state.name.split(' ')[0]) + '’s' : 'Your'} health`, `Mission day ${state.md} · ${due ? `${due} measurement${due > 1 ? 's' : ''} due` : 'everything is logged for today'}`,
    ui.sub === 'overview' ? '' : `<button class="btn primary" data-act="checkin">${icon('plus')}Start check-in</button>`) +
    `<nav class="subnav" aria-label="Personal sections"><span class="ind" aria-hidden="true"></span>${PERSONAL.map((p) => `<button class="${ui.sub === p.v ? 'on' : ''}" data-act="sub" data-v="${p.v}" ${ui.sub === p.v ? 'aria-current="page"' : ''}>${icon(p.icon)}${p.label}</button>`).join('')}</nav>` + body;
}

function advisoryHtml(a, open, noLink) {
  return `<details class="adv ${lc(a.level)}" ${open ? 'open' : ''}>
    <summary><span class="adv-sym">${LEVELS[a.level].sym}</span>
      <span class="adv-main"><b>${esc(a.title)}</b><small>${esc(a.detail)}</small></span>
      <span class="adv-tags">${a.trend ? '<span class="tag">Trend</span>' : ''}<span class="pill ${lc(a.level)}">${a.esc.who}</span></span></summary>
    <div class="adv-body">
      <ol>${a.actions.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
      <p class="esc"><b>${a.esc.who}:</b> ${esc(a.esc.text)}</p>
      ${noLink ? '' : `<button class="btn ghost sm" data-act="detail" data-id="${a.ind}">View ${esc(IND[a.ind].short)} trend</button>`}
    </div></details>`;
}

const KEY_TILES = [['hr', 'Heart rate'], ['sys', 'Blood pressure'], ['spo2', 'Blood oxygen'], ['temp', 'Temperature'], ['sleep', 'Sleep']];

/* Local time and date for the lobby, refreshed every few seconds; it also turns the mission day at midnight. */
function clockHtml() {
  const d = new Date();
  return `<b class="num">${d.toLocaleTimeString(I18N.locale(), { hour: 'numeric', minute: '2-digit' })}</b><span>${d.toLocaleDateString(I18N.locale(), { weekday: 'long', month: 'long', day: 'numeric' })}</span>`;
}
setInterval(() => {
  if (!Auth.user() || !state) return;
  if (Engine.calendarDay()) { Engine.save(); if (!ui.modal) render(); else renderTop(); toast(`Mission day ${state.md} has started`); return; }
  const c = $('#lobby-clock'); if (c) c.innerHTML = clockHtml();
}, 10000);

/* ---------- profile photo ---------- */
/* The guest is always Bruno Llobet Chanto, so his photo follows the guest account even when the saved
   record has an older or edited name. 'none' means the person removed their photo on purpose. */
const myPhoto = () => {
  if (!state) return ''; const u = Auth.user();
  if (u && u.guest) return photoFor(u.name, state.photo === 'none' ? null : state.photo) || BRUNO_PHOTO; // the guest always shows Bruno's face
  return photoFor(state.name || (u && u.name), state.photo);
};
const knownPhoto = () => { const u = Auth.user(); return u ? knownPhotoFor(u.guest ? u.name : state.name || u.name) : ''; };
function pickPhoto() {
  let f = $('#photo-file');
  if (!f) { f = document.createElement('input'); f.type = 'file'; f.accept = 'image/*'; f.id = 'photo-file'; f.hidden = true; document.body.appendChild(f); }
  f.value = ''; f.click();
}
/* Crop to a centred square and shrink to 256 px, so the photo is small enough to sync with the crew. */
function savePhoto(file) {
  if (!file || !/^image\//.test(file.type)) { toast('Choose an image file'); return; }
  const url = URL.createObjectURL(file); const img = new Image();
  img.onload = () => {
    const s = Math.min(img.naturalWidth, img.naturalHeight); const c = document.createElement('canvas'); c.width = c.height = 256;
    c.getContext('2d').drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, 256, 256);
    URL.revokeObjectURL(url);
    state.photo = c.toDataURL('image/jpeg', 0.82); Engine.save(); Crew.refresh(true); render(); toast('Profile photo saved — your crew will see it');
  };
  img.onerror = () => { URL.revokeObjectURL(url); toast('That image could not be opened'); };
  img.src = url;
}

function greeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }

function viewStatus() {
  const score = Engine.readiness(); const adv = Insight.findings();
  const need = adv.filter((a) => a.level >= 2).length, watch = adv.filter((a) => a.level === 1).length;
  const summary = score == null ? 'Log your first check-in to see how you are doing.'
    : need ? `${need} ${need > 1 ? 'things need' : 'thing needs'} your attention today.`
    : watch ? `You’re on track, with ${watch} small ${watch > 1 ? 'things' : 'thing'} to watch.` : 'You’re on track. Nothing needs action today.';
  return overviewTop() + careCard();
}

function viewVitals() {
  return `<p class="muted pad">Tap any card for its trend, how to measure it and why it matters in space.</p>
    <div class="grid-vitals">${INDICATORS.map((ind) => {
      const st = Engine.status(ind.id);
      return `<article class="card vital ${lc(st.level)}" data-act="detail" data-id="${ind.id}" tabindex="0" role="button" aria-label="${esc(ind.name)}">
        <header><h3>${ind.short}</h3>${st.due ? '<em class="due">due</em>' : ''}</header>
        <div class="v-main"><span class="v-val">${valueText(ind, st.v)}</span>${sparkline(ind.id)}</div>
        ${rangeBar(ind, st.v)}
        <footer>${pill(st.level)}<span class="muted">${st.md ? (st.age === 0 ? 'Today' : `MD ${st.md}`) : 'Not measured'}</span>
          <button class="btn ghost sm" data-act="log" data-id="${ind.id}">Log</button></footer>
      </article>`;
    }).join('')}</div>`;
}

function viewRoutine() {
  const env = Engine.env(); const day = Engine.today(); const g = Engine.game();
  const done = TASKS.filter((t) => Engine.taskDone(t, day)).length;
  let strip = '';
  for (let d = Math.max(1, state.md - 13); d <= state.md; d++) {
    const n = TASKS.filter((t) => Engine.taskDone(t, state.days[d])).length; const f = n / TASKS.length;
    strip += `<div class="sd" title="MD ${d}: ${n} of ${TASKS.length} tasks"><span><i class="${f >= 0.85 ? 'l0' : f >= 0.5 ? 'l1' : 'l2'}" style="height:${Math.max(4, f * 100)}%"></i></span><small>${d}</small></div>`;
  }
  return `<div class="grid-routine">
    <section class="card">
      <div class="card-h"><h2>Today's routine — MD ${state.md}</h2><span class="muted">${done} of ${TASKS.length} done</span></div>
      <div class="meter big"><i style="width:${(done / TASKS.length) * 100}%"></i></div>
      <ul class="tasks">${TASKS.map((t) => {
        const ok = Engine.taskDone(t, day); const detail = typeof t.detail === 'function' ? t.detail(env) : t.detail;
        return `<li class="${ok ? 'done' : ''}"><button data-act="task" data-id="${t.id}" aria-pressed="${ok}">
          <span class="box">${ok ? icon('check') : ''}</span>
          <span class="t-main"><b>${t.label}</b><small>${detail}</small></span>
          <span class="t-side">${t.auto ? (ok ? 'Logged' : 'Log now ›') : (ok ? 'Done' : 'Mark done')}</span></button></li>`;
      }).join('')}</ul>
      <p class="muted small">Tasks with “Log now” complete themselves when you record the measurement.</p>
    </section>
    <div class="col">
      ${(() => { const ms = careMilestones(); const open = Care.open().length; const closed = Object.values(Care.all()).filter((c) => c.status === 'discharged').length;
        let full = 0; for (let d = Math.max(1, state.md - 13); d <= state.md; d++) { const dd = state.days[d]; if (dd && (dd.checkinAt || Engine.checkedIn(dd))) full++; }
        return `<section class="card rank"><h2>Your health record</h2><p class="sub">How complete it is — a complete record is what lets NovaCare catch problems early</p>
        <div class="stats"><div><b>${full}/14</b><span>check-ins</span></div><div><b>${open}</b><span>follow-ups</span></div><div><b>${closed}</b><span>discharged</span></div></div></section>
      <section class="card">
        <div class="card-h"><h2>Care milestones</h2><span class="muted">${ms.filter((b) => b.got).length} of ${ms.length}</span></div>
        <div class="badges">${ms.map((b) => `<div class="badge ${b.got ? 'got' : ''}" title="${esc(b.desc)}"><i>${b.icon}</i><b>${b.name}</b><small>${b.desc}</small></div>`).join('')}</div>
      </section>`; })()}
      <section class="card">
        <div class="card-h"><h2>Last 14 days</h2><span class="muted">routine completed</span></div>
        <div class="strip">${strip}</div>
      </section>
    </div>
  </div>`;
}

function viewHazards() {
  const env = Engine.env(); const me = Crew.members()[0]; const dose = Engine.cumulativeDose();
  const hz = HAZARDS.map((h) => {
    const st = h.tracks.map((id) => Engine.status(id)); const lv = st.filter((x) => x.level >= 0 && !x.stale).map((x) => x.level);
    const worst = lv.length ? Math.max(...lv) : -1; const flagged = st.filter((x) => x.level >= 1 && !x.stale).length;
    return { h, worst, line: worst < 0 ? 'Not measured yet' : flagged ? `${flagged} measurement${flagged > 1 ? 's' : ''} to watch` : 'Everything it tracks is in range' };
  }).sort((a, b) => b.worst - a.worst);
  return `<section class="card envcard">
      <div class="card-h"><div><h2>${env.name}</h2><p class="sub">${esc(env.gravity)} · ${env.rad} mSv a day · ${esc(env.comm)}</p></div><button class="btn ghost sm" data-act="settings">Change</button></div>
      <p class="muted small">Evacuation: ${esc(String(env.evac).replace(/\.$/, ''))} · Exercise prescription: ${env.exTarget} min a day</p>
    </section>
    <section class="card"><div class="card-h"><div><h2>The five hazards of spaceflight</h2><p class="muted small">Open one to see what NovaCare measures to catch it early, and what you can do. Most urgent first.</p></div></div>
    <div class="acc-list">${hz.map(({ h, worst, line }) => `<details class="acc ${lc(worst)}">
      <summary><span class="hz-l">${h.letter}</span><span class="acc-t"><b>${h.name}</b><small>${line}</small></span>${pill(worst)}${icon('next', 'acc-go')}</summary>
      <div class="acc-b">
        <p>${h.text}</p>
        ${h.id === 'radiation' ? `<p class="act"><b>Mission dose so far:</b> ${dose.toFixed(0)} of ${CAREER_DOSE_LIMIT} mSv (${Math.round((dose / CAREER_DOSE_LIMIT) * 100)}% of the career limit).</p>` : ''}
        <h4>What NovaCare measures</h4>${healthCharts(me, h.tracks)}
        <p class="act"><b>What you can do:</b> ${h.act}</p>
        <p class="muted small"><b>What it can cause:</b> ${h.risks}</p>
      </div></details>`).join('')}</div></section>
    <p class="muted small pad">Sources: NASA Human Research Program (five hazards, human system risks, SANS), NASA spaceflight radiation standard (600 mSv career limit), MSL-RAD and Chang'E-4 LND dose-rate measurements.</p>`;
}

/* ---------- modals ---------- */
function fieldHtml(id, draft) {
  const ind = IND[id]; const last = Engine.status(id); const v = draft[id];
  let input;
  if (ind.type === 'scale') {
    input = `<div class="scale">${ind.scale.map((o) => `<button class="${v === o.v ? 'on' : ''}" data-act="pick" data-id="${id}" data-v="${o.v}"><b>${o.v}</b>${o.label}</button>`).join('')}</div>`;
  } else {
    input = `<div class="stepper"><button data-act="step" data-id="${id}" data-d="-1" aria-label="Decrease">−</button>
      <input id="in-${id}" data-in="${id}" type="number" inputmode="decimal" step="${ind.step}" min="${ind.min}" max="${ind.max}" value="${v ?? ''}" placeholder="${last.v != null ? Engine.fmt(ind, last.v) : Engine.fmt(ind, ind.def)}" aria-label="${esc(ind.name)}">
      <span>${ind.unit}</span><button data-act="step" data-id="${id}" data-d="1" aria-label="Increase">+</button></div>`;
  }
  return `<div class="field"><label for="in-${id}">${ind.short}</label>${input}<div class="readout" id="ro-${id}">${readoutHtml(id, v)}</div></div>`;
}

function readoutHtml(id, v) {
  const ind = IND[id]; const last = Engine.status(id);
  if (ui.modal && ui.modal.type === 'quick') { // one short word next to the field
    if (v == null || !fin(v)) return last.v != null ? `<span class="muted">Last: ${ind.type === 'scale' ? esc(Engine.label(ind, last.v)) : `${Engine.fmt(ind, last.v)} ${ind.unit}`}</span>` : '';
    if (v < ind.min || v > ind.max) return '<span class="l2">Check this number</span>';
    const c = Engine.classify(ind, v); return `<span class="${lc(c.level)}">${LEVELS[c.level].sym} ${LEVELS[c.level].name}</span>`;
  }
  const lastTxt = last.v != null ? ` · last: ${Engine.fmt(ind, last.v)} ${ind.unit} on MD ${last.md}` : '';
  if (v == null || !fin(v)) return `${rangeBar(ind, null)}<p class="muted">${targetText(ind)}${lastTxt}</p>`;
  if (v < ind.min || v > ind.max) return `${rangeBar(ind, null)}<p class="l2">That number looks impossible — check the reading and the unit (${ind.unit}).</p>`;
  const c = Engine.classify(ind, v); const adv = c.level > 0 ? ind.advice[c.dir] : null;
  return `${rangeBar(ind, v)}<p><b class="${lc(c.level)}">${LEVELS[c.level].sym} ${LEVELS[c.level].name}</b>
    <span class="muted"> · ${adv && adv.title ? esc(adv.title) + ' — you will get steps after saving' : targetText(ind) + lastTxt}</span></p>`;
}

function measureHtml(m) {
  const ids = m.steps[m.i]; const ind = IND[ids[0]]; const n = m.steps.length;
  return `<div class="sheet narrow measure" role="dialog" aria-modal="true" aria-label="${esc(ASK[ids[0]] || ind.name)}">
    <header><div class="grow"><p class="kicker">${m.guided ? 'Daily check-in' : 'Log reading'}${n > 1 ? ` · ${m.i + 1} of ${n}` : ''}</p><h2>${ASK[ids[0]] || ind.name}</h2></div>
      ${helpMini()}<button class="x" data-act="close" aria-label="Close">${icon('x')}</button></header>
    ${n > 1 ? `<div class="meter"><i style="width:${((m.i + 1) / n) * 100}%"></i></div>` : ''}
    <div class="sheet-b one">
      <div class="fields">${ids.map((id) => fieldHtml(id, m.draft)).join('')}</div>
      <details class="how"><summary>${icon('file')}How to measure</summary><ol>${ind.how.map((x) => `<li>${x}</li>`).join('')}</ol><p class="muted small">${ind.why}</p></details>
      ${evidenceHtml(ids[0], true)}
    </div>
    <footer>${n > 1 ? `<button class="btn ghost lg" data-act="skip">Skip</button>` : `<button class="btn ghost lg" data-act="close">Cancel</button>`}
      <button class="btn primary lg save-big" id="save" data-act="save">${m.i < n - 1 ? 'Save and continue' : 'Save'}${icon('next')}</button></footer>
  </div>`;
}

/* ---------- daily check-in on one screen ---------- */
const MOOD_FACE = ['', '😣', '🙁', '😐', '🙂', '😄'];
const SHORT_LABEL = { Overwhelmed: 'Extreme', 'Marked change': 'Marked', 'Clear blur': 'Blurry', 'Slight blur': 'Slight' }; // fit five buttons on a phone
// read by the ship's sensors once a day, not part of each person's check-in
const SHIP_READINGS = ['rad', 'co2'];
function quickNum(id, draft) {
  const ind = IND[id]; const v = draft[id]; const last = Engine.status(id);
  return `<div class="stepper qs"><button data-act="step" data-id="${id}" data-d="-1" aria-label="Decrease ${esc(ind.short)}">−</button>
    <input id="in-${id}" data-in="${id}" type="number" inputmode="decimal" step="${ind.step}" min="${ind.min}" max="${ind.max}" value="${v ?? ''}" placeholder="—" aria-label="${esc(ind.name)}${last.v != null ? `, last ${Engine.fmt(ind, last.v)}` : ''}">
    <span>${ind.unit}</span><button data-act="step" data-id="${id}" data-d="1" aria-label="Increase ${esc(ind.short)}">+</button></div>`;
}
function quickField(id, draft) {
  const ind = IND[id]; const v = draft[id];
  if (ind.type === 'scale') {
    return `<div class="qf"><div class="qf-h"><b>${esc(ind.short)}</b><span class="qro" id="ro-${id}">${readoutHtml(id, v)}</span></div>
      <div class="scale qscale">${ind.scale.map((o) => `<button class="${v === o.v ? 'on' : ''}" data-act="pick" data-id="${id}" data-v="${o.v}" aria-pressed="${v === o.v}" aria-label="${esc(ind.short)}: ${esc(o.label)}">${id === 'mood' ? `<b>${MOOD_FACE[o.v]}</b>` : ''}${esc(SHORT_LABEL[o.label] || o.label)}</button>`).join('')}</div></div>`;
  }
  return `<div class="qf"><div class="qf-h"><b>${esc(ind.short)}</b><span class="qro" id="ro-${id}">${readoutHtml(id, v)}</span></div>${quickNum(id, draft)}</div>`;
}
function quickHtml(m) {
  const d = m.draft;
  const bp = `<div class="qf"><div class="qf-h"><b>Blood pressure</b><span class="qro" id="ro-sys">${readoutHtml('sys', d.sys)}</span><span class="qro" id="ro-dia" hidden></span></div>
    <div class="qpair"><div class="qp"><small>Top (systolic)</small>${quickNum('sys', d)}</div><i>/</i><div class="qp"><small>Bottom (diastolic)</small>${quickNum('dia', d)}</div></div></div>`;
  return `<div class="sheet narrow measure quick" role="dialog" aria-modal="true" aria-label="Daily check-in">
    <header><div class="grow"><p class="kicker">Daily check-in · MD ${state.md}</p><h2>How are you today?</h2></div>
      ${helpMini()}<button class="x" data-act="close" aria-label="Close">${icon('x')}</button></header>
    <div class="sheet-b one">
      <section class="qsec"><h3>You</h3>${QUICK_FEEL.map((id) => quickField(id, d)).join('')}
        <div class="qf"><div class="qf-h"><b>Anything bothering you?</b><span class="muted small">Optional</span></div>
          <div class="chips ask-sug">${STATUS_QS.find((q) => q.id === 'sym').opts.map(([v, l]) => `<button type="button" class="${(m.sym || []).includes(v) ? 'on' : ''}" data-act="qsym" data-v="${v}" aria-pressed="${(m.sym || []).includes(v)}">${esc(l)}</button>`).join('')}</div></div></section>
      <section class="qsec"><div class="qsec-h"><h3>Vitals</h3><button class="btn ghost sm" data-act="filllast">${icon('copy')}Same as last time</button></div>
        ${bp}${['hr', 'spo2', 'temp'].map((id) => quickField(id, d)).join('')}</section>
      ${m.more.length ? `<details class="qsec more" ${m.more.some((id) => d[id] != null) ? 'open' : ''}><summary><h3>More</h3><span class="muted small">${m.more.length} optional · ${m.more.map((id) => IND[id].short).join(', ')}</span></summary>
        ${m.more.map((id) => quickField(id, d)).join('')}</details>` : ''}
      <section class="qsec"><h3>Vitals measured by</h3>
        <div class="seg">${['self', 'device', 'exam'].map((k) => `<button class="${(m.src || 'self') === k ? 'on' : ''}" data-act="qsrc" data-v="${k}" aria-pressed="${(m.src || 'self') === k}">${READING_SRC[k].name}</button>`).join('')}</div></section>
      <p class="muted small">Fill what you have. Empty fields are skipped.</p>
    </div>
    <footer><button class="btn ghost lg" data-act="close">Later</button>
      <button class="btn primary lg save-big" id="save" data-act="save">Save check-in${icon('check')}</button></footer>
  </div>`;
}

/* The evidence behind an indicator: NASA risk and standard, plus real NASA OSDR studies. */
function evidenceHtml(id, compact) {
  const refs = EVIDENCE[id] || []; const os = typeof OSDR !== 'undefined' && OSDR.indicators ? OSDR.indicators[id] : null;
  const studies = os ? os.studies : [];
  if (compact) {
    return `<details class="evid"><summary>${icon('shield')}Backed by NASA research${os ? ` · ${os.total} OSDR studies` : ''}</summary>
      <ul>${refs.map((r) => `<li><a href="${r.url}" target="_blank" rel="noopener">${esc(r.label)}</a></li>`).join('')}
      ${studies.map((st) => `<li><a href="${st.url}" target="_blank" rel="noopener">${esc(st.id)} — ${esc(st.title)}</a> <small>${esc([st.organism, st.kind, st.year].filter(Boolean).join(' · '))}</small></li>`).join('')}</ul></details>`;
  }
  return `<section class="evid-full"><h3>${icon('shield')}Evidence</h3>
    <ul>${refs.map((r) => `<li><a href="${r.url}" target="_blank" rel="noopener">${esc(r.label)}</a></li>`).join('')}</ul>
    ${studies.length ? `<p class="muted small">${os.total} studies in NASA’s Open Science Data Repository relate to this measurement. Most relevant:</p>
    <ul>${studies.map((st) => `<li><a href="${st.url}" target="_blank" rel="noopener"><b>${esc(st.id)}</b> ${esc(st.title)}</a> <small class="muted">${esc([st.organism, st.tissue, st.kind === 'Spaceflight' && st.mission ? st.mission : st.kind, st.year].filter(Boolean).join(' · '))}</small></li>`).join('')}</ul>` : ''}
    <p class="muted small">Reference ranges are simplified general adult clinical values. Source data: NASA OSDR Biological Data API, snapshot ${esc(OSDR.snapshot)}.</p></section>`;
}

function doneHtml(m) {
  const g = Engine.game(); const score = Engine.readiness(); Care.sync();
  const fresh = Care.open().filter((c) => c.status === 'new'); const follow = Care.open().length - fresh.length; const adv = fresh; const top = fresh[0];
  return `<div class="sheet narrow" role="dialog" aria-modal="true" aria-label="Check-in complete">
    <header><div><h2>Saved</h2><p class="sub">${m.count} reading${m.count === 1 ? '' : 's'} added to your record${g.streak > 1 ? ` · check-in ${g.streak} days running` : ''}</p></div><button class="x" data-act="close" aria-label="Close">${icon('x')}</button></header>
    <div class="sheet-b one">
      <div class="done-top">${ring(score)}</div>
      ${(() => { const f = Coach.feedback(); return f ? `<p class="done-win">${icon('check')}${esc(f)}</p>` : ''; })()}
      ${top ? `<div class="done-next ${lc(top.level)}"><span class="dot"></span><div><b>${fresh.length} new recommendation${fresh.length > 1 ? 's' : ''}</b><p>Sent to your notifications (the bell). Open ${fresh.length > 1 ? 'them' : 'it'} when you are ready.</p></div></div>
        ${follow ? `<p class="muted small center">${follow} other${follow > 1 ? 's' : ''} still in follow-up</p>` : ''}`
        : '<p class="center">Everything is in range. Nice work.</p>'}
    </div>
    <footer>${top ? `<button class="btn ghost lg" data-act="close">Done</button><button class="btn primary lg" data-act="case" data-v="${esc(top.id)}">Open now</button>` : '<button class="btn primary lg save-big" data-act="close">Done</button>'}</footer>
  </div>`;
}

function detailHtml(id) {
  const ind = IND[id]; const st = Engine.status(id); const s = Engine.series(id).slice(-6).reverse();
  const adv = Engine.advisories().filter((a) => a.ind === id);
  const rb = (r, label) => `<button class="${ui.range === r ? 'on' : ''}" data-act="range" data-r="${r}">${label}</button>`;
  return `<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(ind.name)}">
    <header><div><h2>${ind.name}</h2><p class="sub">Measured every ${ind.cadence === 1 ? 'day' : ind.cadence + ' days'}${st.due ? ' · due now' : ''}</p></div>
      <button class="x" data-act="close" aria-label="Close">${icon('x')}</button></header>
    <div class="sheet-b one">
      <div class="d-top"><div class="d-val ${lc(st.level)}">${valueText(ind, st.v)}</div><div class="d-side">${pill(st.level)}<span class="muted">${targetText(ind)}</span></div>
        <button class="btn primary" data-act="log" data-id="${id}">Log reading</button></div>
      ${rangeBar(ind, st.v)}
      ${Insight.compareLine(id) ? `<p class="muted">${esc(Insight.compareLine(id))}</p>` : ''}
      <div class="seg">${rb(7, '7 days')}${rb(14, '14 days')}${rb(30, '30 days')}${rb(0, 'All')}</div>
      ${chart(ind, ui.range)}
      ${adv.map((a) => advisoryHtml(a, true, true)).join('')}
      ${evidenceHtml(id, false)}
      <div class="d-cols">
        <div><h3>How to measure</h3><ol>${ind.how.map((x) => `<li>${x}</li>`).join('')}</ol></div>
        <div><h3>Why it matters</h3><p>${ind.why}</p><h3>In space</h3><p>${ind.space}</p></div>
        <div><h3>Recent readings</h3>${s.length ? `<table>${s.map((p) => { const l = Engine.classify(ind, p.v).level; return `<tr><td>MD ${p.md}</td><td>${Engine.fmt(ind, p.v)} ${ind.unit} ${Engine.label(ind, p.v)}${Insight.srcOf(p.md, id) !== 'self' ? ` <small class="muted">· ${READING_SRC[Insight.srcOf(p.md, id)].short.toLowerCase()}</small>` : ''}</td><td class="${lc(l)}">${LEVELS[l].sym} ${LEVELS[l].name}</td></tr>`; }).join('')}</table>` : '<p class="muted">None yet.</p>'}</div>
      </div>
    </div></div>`;
}

/* Settings: what an astronaut on a mission actually needs, in the order they need it.
   Every row says its current state; nothing here can erase data without a clear warning. */
function settingsHtml() {
  const u = Auth.user(); const has = Missions.has(); const cur = Missions.current(); const env = Engine.env();
  const perm = Reminders.permission(); const notif = Reminders.on();
  const prof = Medical.mine(); const al = Medical.allergyNames(prof);
  const st = Sync.status(); const [sc, , sl, stip] = SYNC_UI[st] || SYNC_UI.local;
  const start = state.startDate ? new Date(state.startDate + 'T00:00').toLocaleDateString(I18N.locale(), { month: 'long', day: 'numeric', year: 'numeric' }) : '—';
  const row = (label, body, hint = '') => `<div class="set-row"><div class="set-l"><b>${label}</b>${hint ? `<small>${hint}</small>` : ''}</div><div class="set-v">${body}</div></div>`;
  const sec = (ic, title, body) => `<section class="set-sec"><h3>${icon(ic)}${title}</h3>${body}</section>`;
  return `<div class="sheet narrow settings" role="dialog" aria-modal="true" aria-label="Settings">
    <header><div><p class="kicker">Settings</p><h2>${esc(state.name || u.name)}</h2><p class="sub">${esc(u.role)}${has ? ` · ${esc(cur.name)} · MD ${state.md}` : ''}</p></div><button class="x" data-act="close" aria-label="Close">${icon('x')}</button></header>
    <div class="sheet-b one">
      ${sec('siren', 'Emergencies', `
        ${row('Alerts reach your crew', alertReach() === 'cloud' ? '<span class="set-ok l0"><span class="dot"></span>Yes</span>' : `<span class="set-ok l2"><span class="dot"></span>No</span>`,
          alertReach() === 'cloud' ? `Everyone on ${esc(cur.name)} gets your calls for help.` : esc(alertSentMsg('alert')))}
        ${row('Notifications', perm === 'unsupported' ? '<span class="muted small">Not available</span>' : perm === 'denied' ? '<span class="set-ok l2">Blocked in the browser</span>'
          : notif ? '<button class="btn ghost sm" data-act="remoff">Turn off</button>' : '<button class="btn primary sm" data-act="remon">Turn on</button>',
          notif ? 'On — emergencies sound and show even with NovaCare in the background.' : 'Turn on so a crewmate’s emergency reaches you with the app closed.')}
        ${row('Test the alarm', '<button class="btn ghost sm" data-act="testalarm">Play</button>', 'Check the sound and vibration of an emergency.')}
        ${row('Alert my crew if I do not answer', `<label class="switch"><input type="checkbox" id="set-auto" ${autoAlertOn() ? 'checked' : ''}><span></span></label>`, `After a critical reading NovaCare asks if you are OK, and calls your crew after ${WELFARE_SECONDS} seconds without an answer.`)}`)}
      ${sec('care', 'Your medical profile', `
        ${row('Allergies', al.length ? al.map((x) => `<span class="alg-chip">${esc(x)}</span>`).join(' ') : '<span class="set-ok l1"><span class="dot"></span>None recorded</span>', 'Your crew sees this in an emergency.')}
        ${row('Blood type · medication · conditions', `<button class="btn ${Medical.empty(prof) ? 'primary' : 'ghost'} sm" data-act="sub" data-v="medical">${Medical.empty(prof) ? 'Fill in' : 'Edit'}</button>`,
          Medical.empty(prof) ? 'Empty — one minute, and it can save your life.' : [prof.blood, prof.meds.length ? `${prof.meds.length} medication${prof.meds.length > 1 ? 's' : ''}` : '', prof.conditions.length ? `${prof.conditions.length} condition${prof.conditions.length > 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ') || 'Saved')}`)}
      ${sec('rocket', 'Mission', has ? `
        ${row('Mission name', `<input id="set-mname" class="text" type="text" maxlength="40" value="${esc(cur.name)}" aria-label="Mission name">`)}
        ${row('Code for your crew', `<button class="codechip" data-act="copycode" data-code="${esc(u.crew)}" title="Copy the code">${icon('copy')}<span>${esc(u.crew)}</span></button>`, 'Crewmates join with this code.')}
        ${row('Mission day', `<b class="num">MD ${state.md}</b> <span class="muted small">of ${missionLength()}</span>`, `Started ${start}. A new day starts at midnight.`)}
        ${row('Planned length', `<input id="set-len" class="text num sm" type="number" min="7" max="1200" value="${missionLength()}" aria-label="Planned length in days"> <span class="muted small">days</span>`)}
        ${row('Location', `<select id="set-env" class="text" aria-label="Location">${Object.entries(ENVIRONMENTS).map(([k, e]) => `<option value="${k}" ${state.env === k ? 'selected' : ''}>${esc(e.short)}</option>`).join('')}</select>`,
          `${esc(env.gravity)} · ${env.rad} mSv/day · ${esc(env.comm)}`)}
        ${row('Leave this mission', `<button class="btn ghost danger sm" data-act="leavemission" data-code="${esc(u.crew)}">Leave</button>`)}`
        : `<p class="muted small">You are not on a mission. <button class="link" data-act="missiontab" data-v="missions">Create or join one</button>.</p>`)}
      ${sec('checks', 'Check-ins', `
        ${row('“How do you feel?” every', `<select id="set-every" class="text" aria-label="How often">${STATUS_EVERY.map((h) => `<option value="${h}" ${Status.every() === h ? 'selected' : ''}>${h} hours</option>`).join('')}</select>`, 'Only after your daily check-in.')}`)}
      ${sec('cloud', 'Data & sync', `
        ${row('Sync', `<span class="set-ok ${sc}"><span class="dot"></span>${esc(sl)}</span> ${Auth.cloud() ? '<button class="btn ghost sm" data-act="syncnow">Sync now</button>' : ''}`, esc(stip))}
        ${(() => { const r = Autonomy.last(); return row('Works without Earth', `${r ? `<span class="set-ok ${r.independent ? 'l0' : 'l2'}"><span class="dot"></span>${r.passed} of ${r.total} checks passed</span> ` : ''}<button class="btn ghost sm" data-act="selftest">${r ? 'Test again' : 'Run the test'}</button>`,
          r ? Object.values(r.res).filter((x) => !x.ok).map((x) => esc(x.text)).join(' · ') || `Medical records, medication rules, protocols and analysis all run on this device${r.online ? '' : ' — tested with no link'}. The link to Earth is only used to sync and update.` : 'Checks that the medical functions work on this device alone, with no link to Earth.'); })()}
        ${row('For your flight surgeon', '<button class="btn ghost sm" data-act="report">Health report</button> <button class="btn ghost sm" data-act="export">Raw data</button>')}`)}
      ${sec('user', 'Account & display', `
        ${row('Profile photo', `<span class="avatar lg ${myPhoto() ? 'ph' : ''}" aria-hidden="true">${myPhoto() ? `<img src="${esc(myPhoto())}" alt="" data-name="${esc(u.name)}">` : esc(initials(state.name || u.name))}</span>
          <button class="btn ghost sm" data-act="photopick">${myPhoto() ? 'Change' : 'Add photo'}</button>${myPhoto() && !Auth.user().guest ? '<button class="btn quiet sm" data-act="photoremove">Remove</button>' : state.photo === 'none' && knownPhoto() ? '<button class="btn quiet sm" data-act="photorestore">Restore photo</button>' : ''}`, 'Your crew sees it on your card.')}
        ${row('Your name', `<input id="name" class="text" type="text" maxlength="40" value="${esc(state.name || '')}" placeholder="Your name" aria-label="Your name">`)}
        ${row('Role', `<span>${esc(u.role)}</span>`, 'Fixed when the account was created.')}
        ${row('Dark mode', `<label class="switch"><input type="checkbox" id="set-dark" ${document.documentElement.dataset.theme === 'dark' ? 'checked' : ''}><span></span></label>`, 'Easier on the eyes during the sleep cycle.')}
        ${row(u.guest ? 'Leave guest mode' : 'Sign out', `<button class="btn ghost sm" data-act="logout">${icon('logout')}${u.guest ? 'Exit' : 'Sign out'}</button>`)}`)}
      <details class="set-sec demo"><summary>${icon('settings')}Training & demo</summary>
        <p class="muted small">For demonstrations only. These replace the readings of the open mission.</p>
        <div class="btnrow"><button class="btn ghost sm" data-act="demo">Load 33-day demo</button><button class="btn ghost danger sm" data-act="reset">Erase readings</button></div></details>
    </div></div>`;
}

/* ---------- cloud sync indicator ---------- */
const SYNC_UI = {
  local:   ['ln', '◌', 'On this device', 'Local mode: no cloud database configured. Data stays in this browser.'],
  synced:  ['l0', '●', 'Synced', 'All data is saved in the NOVACARE database.'],
  syncing: ['l1', '⟳', 'Syncing…', 'Uploading to the NOVACARE database.'],
  pending: ['l1', '◐', 'Pending', 'Saved on this device, waiting to upload.'],
  offline: ['l1', '○', 'No signal', 'No connection. Everything is saved on this device and will upload when the link is back.'],
  relink:  ['l2', '!', 'Sign in to sync', 'You signed in without signal. Enter your password once to resume cloud sync.'],
  error:   ['l2', '!', 'Sync error', 'The database rejected the upload. Data is safe on this device; tap to retry.'],
};
const SYNC_ICON = { local: 'cloudOff', synced: 'cloud', syncing: 'refresh', pending: 'cloud', offline: 'cloudOff', relink: 'cloudOff', error: 'cloudOff' };
function syncChip() {
  // a guest is not "offline": say what it is in one word
  if (Auth.user() && Auth.user().guest) return `<button class="chip sync ln" data-act="syncinfo" title="Guest mode — your data stays on this device" aria-label="Guest mode: your data stays on this device">${icon('user')}<span>Guest</span></button>`;
  const st = Sync.status(); const [c, , label, tip] = SYNC_UI[st] || SYNC_UI.local;
  return `<button class="chip sync ${c} ${st}" data-act="syncinfo" title="${esc(tip)}" aria-label="Sync: ${esc(label)}. ${esc(tip)}">${icon(SYNC_ICON[st] || 'cloud')}<span class="hide-s">${label}</span></button>`;
}
function reauthHtml() {
  return `<div class="sheet narrow" role="dialog" aria-modal="true" aria-label="Resume sync">
    <header><div><h2>Resume sync</h2></div><button class="x" data-act="close" aria-label="Close">${icon('x')}</button></header>
    <form id="reauth-form" class="sheet-b one">
      <p class="muted">You signed in while there was no signal. The connection is back — enter your password once so your readings can upload to the NOVACARE database.</p>
      <div class="field"><label for="ra-pw">Password for ${esc(Auth.user().id)}</label><input id="ra-pw" name="password" class="text" type="password" autocomplete="current-password"></div>
      <p class="auth-err" role="alert">${esc(ui.modal.err || '')}</p>
      <button class="btn primary big" type="submit">Resume sync</button>
    </form></div>`;
}

/* ---------- sign-in gate ---------- */
const LOCKED = [
  ['Readiness score & body map', 'Your status across 7 body systems'],
  ['Guided health check-ins', '15 indicators with live feedback'],
  ['Trend guidance & escalation', 'When to tell the crew or flight surgeon'],
  ['Health reports', 'Export for your flight surgeon'],
];

function authHtml() {
  const reg = ui.auth === 'register';
  const f = (id, label, type, ic, extra = '') => `<div class="field"><label for="au-${id}" class="vh">${label}</label><div class="inp">${icon(ic)}<input id="au-${id}" name="${id}" type="${type}" aria-label="${label}" ${extra}>${type === 'password' ? `<button type="button" class="eye" data-act="pwshow" aria-label="Show password">${icon('eye')}</button>` : ''}</div></div>`;
  const shell = (inner, foot) => `<section class="auth">
    <div class="auth-photo auth-earth" aria-hidden="true"><div class="earth-ball"><canvas class="earth-spin" width="480" height="480"></canvas></div></div>
    <div class="auth-main"><div class="auth-title"><h1>${SWOOSH}NovaCare</h1><p>Health Monitoring System</p></div>
      <div class="card auth-card">${inner}</div>${foot}</div></section>`;
  const back = '<p class="auth-switch"><button type="button" class="link" data-act="authtab" data-v="login">Back to sign in</button></p>';
  if (ui.auth === 'forgot') {
    return shell(ui.resetSent
      ? `<h2 class="auth-h">Check your email</h2><p class="muted">If <b>${esc(ui.resetSent)}</b> has an account, a link to choose a new password is on its way. Open it on this device.</p>
        <p class="muted small">Nothing after a few minutes? Check spam, or ask again.</p><button type="button" class="btn ghost big" data-act="resetagain">Send again</button>`
      : `<h2 class="auth-h">Forgot your password?</h2><p class="muted small">Enter the email of your account and we’ll send you a link to choose a new one.</p>
        <form id="forgot-form" class="fields" novalidate>${f('email', 'Email', 'email', 'mail', 'autocomplete="username" maxlength="80" autocapitalize="off" spellcheck="false" placeholder="Email"')}
          <p class="auth-err" role="alert">${esc(ui.authErr)}</p><button class="btn primary big" type="submit" ${ui.busy ? 'disabled' : ''}>Send reset link</button></form>`, back);
  }
  if (ui.auth === 'newpw') {
    return shell(`<h2 class="auth-h">Choose a new password</h2>
      <form id="newpw-form" class="fields" novalidate>${f('password', 'New password', 'password', 'lock', 'autocomplete="new-password" placeholder="New password (at least 6 characters)"')}
        ${f('confirm', 'Confirm password', 'password', 'lock', 'autocomplete="new-password" placeholder="Confirm new password"')}
        <p class="auth-err" role="alert">${esc(ui.authErr)}</p><button class="btn primary big" type="submit" ${ui.busy ? 'disabled' : ''}>Save and sign in</button></form>`, back);
  }
  return `<section class="auth">
    <div class="auth-photo auth-earth" aria-hidden="true"><div class="earth-ball"><canvas class="earth-spin" width="480" height="480"></canvas></div></div>
    <div class="auth-main">
      <div class="auth-title"><h1>${SWOOSH}NovaCare</h1><p>Health Monitoring System</p></div>
      <p class="proto-note">${icon('shield')}<span>Prototype — sample data is simulated, not from a real astronaut.</span></p>
      <div class="card auth-card">
        ${reg ? '<h2 class="auth-h">Create account</h2>' : ''}
        <form id="auth-form" class="fields" novalidate>
          ${reg ? f('name', 'Full name', 'text', 'user', 'autocomplete="name" maxlength="40" placeholder="Full name"') : ''}
          ${f('email', 'Email', 'email', reg ? 'mail' : 'user', `autocomplete="username" maxlength="80" autocapitalize="off" spellcheck="false" placeholder="${reg ? 'Email' : 'User (email)'}"`)}
          ${reg ? `<div class="field"><label for="au-role" class="vh">Role</label><div class="inp">${icon('users')}<select id="au-role" name="role" aria-label="Role">${ROLES.map((r, i) => `<option ${i === 2 ? 'selected' : ''}>${r}</option>`).join('')}</select></div></div>
            <p class="hint">Pick your role carefully: it is fixed once your account is created. After signing up you create a mission or join one from the lobby.</p>` : ''}
          ${f('password', 'Password', 'password', 'lock', `autocomplete="${reg ? 'new-password' : 'current-password'}" placeholder="${reg ? 'Password (at least 6 characters)' : 'Password'}"`)}
          ${reg ? f('confirm', 'Confirm password', 'password', 'lock', 'autocomplete="new-password" placeholder="Confirm password"') : `<div class="auth-row"><label class="remember"><input type="checkbox" name="remember" checked> Keep me signed in</label><button type="button" class="link" data-act="authtab" data-v="forgot">Forgot password?</button></div>`}
          <p class="auth-err" role="alert">${esc(ui.authErr)}</p>
          <button class="btn primary big" type="submit" ${ui.busy ? 'disabled' : ''}>${reg ? 'Create account' : 'Sign In'}</button>
        </form>
        ${reg ? '' : `<div class="auth-or"><span>or</span></div>
        <button type="button" class="btn ghost big guest-btn" data-act="guest">${icon('user')}Enter as guest</button>`}
        ${connNote(reg)}
      </div>
      ${reg ? '' : '<p class="auth-switch"><button type="button" class="link" data-act="firstaid">Emergency? Instructions now, no sign-in</button></p>'}
      <p class="auth-switch">${reg ? 'Already have an account? <button type="button" class="link" data-act="authtab" data-v="login">Sign in</button>'
        : 'No account? <button type="button" class="link" data-act="authtab" data-v="register">Register</button>'}</p>
    </div></section>`;
}

function connNote(reg) {
  if (!Auth.cloud()) return `<p class="conn ln">◌ Local mode — accounts are stored on this device only. Add your database in js/config.js.</p>`;
  if (navigator.onLine === false) return reg
    ? `<p class="conn l1">○ No signal — creating an account needs a connection.</p>`
    : `<p class="conn l1">○ No signal — you can still sign in with an account that has signed in on this device before.</p>`;
  return `<p class="conn l0">● Connected to the NOVACARE database. After your first sign-in here, you can also sign in without signal.</p>`;
}

function renderAuth() {
  const top = $('#top'); document.body.classList.add('signed-out'); $('#nav').innerHTML = ''; $('#banner').innerHTML = '';
  top.innerHTML = `<div class="brand">${LOGO}<div><b>NovaCare</b></div></div><div class="top-r">${I18N.picker()}</div>`;
  $('#app').innerHTML = authHtml();
  if (!(ui.modal && ui.modal.type === 'firstaid')) ui.modal = null;
  Earth.spin($('#app')); // the planet turns behind the sign-in form
  renderModal(); renderSos(); renderTakeover();
  const first = $('#auth-form input'); if (first && !ui.modal) first.focus();
}

async function submitAuth(form) {
  const d = Object.fromEntries(new FormData(form)); d.remember = !!d.remember;
  ui.busy = true; ui.authErr = '';
  try {
    const reg = ui.auth === 'register';
    const res = await (reg ? Auth.register(d) : Auth.login(d));
    ui.busy = false;
    if (res.confirm) { // the project asks new users to confirm their email
      ui.auth = 'login'; ui.authErr = ''; renderAuth();
      const i = $('#au-email'); if (i) i.value = d.email;
      toast('Account created — confirm it from your email, then sign in'); return;
    }
    ui.view = 'lobby'; ui.sub = 'overview'; ui.sys = null; ui.crewTab = 'mates';
    Engine.load();
    if (reg) { state.name = Auth.user().name; Engine.save(); }
    render(); window.scrollTo(0, 0);
    toast(res.offline ? `Signed in without signal — data saves on this device` : reg ? `Welcome aboard, ${Auth.user().name}` : `Welcome back, ${Auth.user().name}`);
    Sync.run();
  } catch (e) {
    ui.busy = false; ui.authErr = e.message;
    const keep = Object.fromEntries(['name', 'email'].map((k) => [k, d[k] || '']));
    renderAuth();
    Object.entries(keep).forEach(([k, v]) => { const i = $('#au-' + k); if (i) i.value = v; });
    const pw = $('#au-password'); if (pw && keep.email) pw.focus();
  }
}

/* ---------- render & actions ---------- */
/* ---------- fluid rendering ----------
   A section change fades/slides in (View Transitions where supported) and counts numbers up.
   Updates inside the same section keep the scroll position and do not re-animate. */
const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const PAGE_ORDER = ['lobby', ...PERSONAL.map((p) => 'personal:' + p.v), 'crew:mates', 'crew:inventory', 'mission', 'analysis'];
const pageKey = () => ui.view + (ui.view === 'personal' ? ':' + ui.sub : ui.view === 'crew' ? ':' + (ui.crewTab || 'mates') : '');
/* Runs a page change; the new page slides in from the side it sits on in the navigation. */
function navigate(fn) {
  if (!document.startViewTransition || reduceMotion()) { fn(); return; }
  const from = pageKey(); const root = document.documentElement;
  const vt = document.startViewTransition(() => {
    fn();
    const a = PAGE_ORDER.indexOf(from), b = PAGE_ORDER.indexOf(pageKey()); const dir = b >= a ? 1 : -1;
    const side = window.innerWidth < 1024 || from.split(':')[0] === ui.view;
    root.style.setProperty('--vt-x', (side ? 22 * dir : 0) + 'px'); root.style.setProperty('--vt-y', (side ? 0 : 16 * dir) + 'px');
  });
  vt.finished.catch(() => {}); vt.ready.catch(() => {}); // an interrupted transition (resize, quick double tap) is fine
}
/* Sliding highlight behind the active tab: starts where it was and glides to the new tab. */
const indPos = {};
function slideInd(box, key) {
  const ind = box && box.querySelector('.ind'); if (!ind) return;
  const on = box.querySelector('.on');
  if (!on) { ind.style.opacity = 0; delete indPos[key]; return; }
  const to = { x: on.offsetLeft, y: on.offsetTop, w: on.offsetWidth, h: on.offsetHeight };
  const put = (p) => { ind.style.width = p.w + 'px'; ind.style.height = p.h + 'px'; ind.style.transform = `translate(${p.x}px, ${p.y}px)`; };
  const from = indPos[key]; indPos[key] = to;
  if (from && !reduceMotion() && (from.x !== to.x || from.y !== to.y)) { ind.style.transition = 'none'; put(from); void ind.offsetWidth; ind.style.transition = ''; }
  put(to);
}
function placeInds() { delete indPos.nav; delete indPos.sub; slideInd($('#nav ul'), 'nav'); slideInd($('.subnav'), 'sub'); }
window.addEventListener('resize', placeInds);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeInds);
function countUp(root) {
  if (reduceMotion()) return;
  root.querySelectorAll('[data-count]').forEach((el) => {
    const to = +el.dataset.count; if (!Number.isFinite(to) || el.dataset.count === '') return;
    const t0 = performance.now(), dur = 700;
    const step = (t) => { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    el.textContent = '0'; requestAnimationFrame(step);
  });
}
let lastPage = '';
function render() {
  if (Auth.recovering()) { ui.auth = 'newpw'; lastPage = ''; renderAuth(); return; } // opened from a password-reset email
  if (!Auth.user()) { lastPage = ''; renderAuth(); return; }
  document.body.classList.remove('signed-out');
  if (Engine.calendarDay()) Engine.save();
  Engine.today(); Crew.refresh(); Care.sync();
  if (Missions.locked() && !['lobby', 'mission'].includes(ui.view)) ui.view = 'lobby';
  // Nothing pops up by itself: pending tasks become reminders (bell + notification).
  if (!ui.remTicked) { ui.remTicked = true; Reminders.tick(true); } // silent on opening: the person decides what to do first
  renderTop(); renderNav();
  $('#banner').innerHTML = bannerHtml();
  const page = pageKey();
  const entering = page !== lastPage; lastPage = page;
  const y = window.scrollY; const app = $('#app');
  app.innerHTML = { lobby: viewLobby, personal: viewPersonal, crew: ui.crewTab === 'inventory' ? viewInventory : viewCrew, mission: missionPage, analysis: viewAnalysis }[ui.view]();
  app.classList.toggle('enter', entering);
  const subKey = ui.view; if (indPos.subFor !== subKey) { delete indPos.sub; indPos.subFor = subKey; }
  slideInd($('.subnav'), 'sub');
  if (entering) { window.scrollTo(0, 0); countUp(app); } else window.scrollTo(0, y);
  const term = $('#term-out'); if (term) term.scrollTop = term.scrollHeight; // a terminal shows its latest line
  if (ui.view === 'lobby') { Earth.paint(app); Earth.cards(); } // the Home cards together show the Earth, turning
  renderModal(); renderSos(); renderTakeover();
}
/* Inside a window the floating button steps aside, so the window carries its own small Help button. */
const helpMini = () => `<button class="help-mini" data-act="help" aria-label="Ask your crew for help">${icon('siren')}Help</button>`;
/* "Ask crew for help" is always one tap away, on every page, above any task. */
function renderSos() {
  let b = $('#sos-fab');
  if (!b) { b = document.createElement('button'); b.id = 'sos-fab'; b.dataset.act = 'help'; b.className = 'btn sos'; document.body.appendChild(b); }
  const mine = Auth.user() && Crew.active().find((a) => fromMe(a) && HELP_TYPES[a.type]);
  b.hidden = !Auth.user();
  b.innerHTML = `${icon('siren')}<span>${mine ? 'Help requested' : 'Help'}</span>`;
  b.setAttribute('aria-label', mine ? 'Help requested — open to send another request' : 'Ask your crew for help');
  b.classList.toggle('sent', !!mine);
  const nav = $('#nav'); // keep it above the bottom navigation on phones
  if (nav) document.documentElement.style.setProperty('--navh', `${getComputedStyle(nav).position === 'fixed' ? nav.offsetHeight : 0}px`);
}

function renderModal() {
  const el = $('#modal'); const m = ui.modal;
  if (!m) { el.hidden = true; el.innerHTML = ''; el.dataset.key = ''; el.classList.remove('out'); document.body.classList.remove('lock'); return; }
  el.hidden = false; document.body.classList.add('lock');
  el.innerHTML = m.type === 'quick' ? quickHtml(m) : m.type === 'measure' ? measureHtml(m) : m.type === 'done' ? doneHtml(m) : m.type === 'detail' ? detailHtml(m.id) : m.type === 'reauth' ? reauthHtml() : m.type === 'mate' ? mateHtml(m.id) : m.type === 'emergency' ? emergencyHtml(m)
    : m.type === 'reminders' ? remindersHtml() : m.type === 'help' ? helpHtml(m) : m.type === 'ask' ? askHtml(m) : m.type === 'status' ? statusHtml(m) : m.type === 'case' ? caseHtml(m) : m.type === 'welfare' ? welfareHtml(m) : m.type === 'firstaid' ? firstAidHtml(m) : m.type === 'newmission' ? missionNewHtml(m) : m.type === 'joinmission' ? missionJoinHtml(m) : m.type === 'created' ? missionCreatedHtml(m) : m.type === 'invitem' ? invItemHtml(m) : Mind.isModal(m.type) ? Mind.modal(m) : settingsHtml();
  const key = m.type + (m.step || '') + (m.i ?? '');
  el.classList.toggle('fresh', el.dataset.key !== key); el.dataset.key = key;
  tickTimer();
  if (Mind.isModal(m.type)) Mind.afterRender(m);
  if (m.type === 'reauth') { const i = $('#ra-pw'); if (i) i.focus(); }
  if (m.type === 'ask') { const c = $('#chat'); if (c) c.scrollTop = c.scrollHeight; const i = $('#ask-in'); if (i && !m.listening) i.focus(); }
  if (['newmission', 'joinmission', 'invitem'].includes(m.type) && el.classList.contains('fresh')) { const i = $('#modal input.text'); if (i) i.focus(); }
  if (m.type === 'measure') { syncSave(); const inp = $('#modal input[data-in]'); if (inp) inp.focus(); }
  if (m.type === 'quick') syncSave();
}

let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 2600);
}

function openMeasure(steps, guided) {
  if (!steps.length) { toast('Everything is already logged for today.'); return; }
  const draft = {}; const day = Engine.today();
  steps.flat().forEach((id) => { if (day.vals[id] != null) draft[id] = day.vals[id]; });
  ui.modal = { type: 'measure', steps, i: 0, draft, guided, count: 0 };
  renderModal();
}

/* Daily check-in: everything on one screen. How you feel first (taps), then the four morning vitals;
   anything else that is due waits under "More" and is optional. Empty fields are simply not saved. */
const checkinDone = (day) => !!(day && (day.checkinAt || Engine.checkedIn(day)));
const QUICK_FEEL = ['mood', 'stress', 'sleep'];
const QUICK_VITALS = ['sys', 'dia', 'hr', 'spo2', 'temp'];
function startCheckin() {
  const day = Engine.today(); const draft = {};
  const more = INDICATORS.map((i) => i.id).filter((id) => !QUICK_FEEL.includes(id) && !QUICK_VITALS.includes(id) && !SHIP_READINGS.includes(id) && !IND[id].exam && (Engine.status(id).due || day.vals[id] != null));
  [...QUICK_FEEL, ...QUICK_VITALS, ...more].forEach((id) => { if (day.vals[id] != null) draft[id] = day.vals[id]; });
  ui.modal = { type: 'quick', draft, more, count: 0 };
  renderModal();
}

const valOk = (id, v) => v != null && fin(v) && v >= IND[id].min && v <= IND[id].max;
function stepValid(m) {
  if (m.type === 'quick') { const ks = Object.keys(m.draft).filter((id) => m.draft[id] != null); return ks.length > 0 && ks.every((id) => valOk(id, m.draft[id])); }
  return m.steps[m.i].every((id) => valOk(id, m.draft[id]));
}
function saveQuick() {
  const m = ui.modal; if (!stepValid(m)) return;
  const day = Engine.today(); let n = 0;
  const saved = [];
  Object.keys(m.draft).forEach((id) => { const v = m.draft[id]; if (v == null) return; const val = +(+v).toFixed(IND[id].dec);
    // provenance: a value copied with "Same as last time" and left as it was was not measured again
    const carried = m.carried && m.carried[id] === val;
    Insight.setSrc(day, id, carried ? 'carried' : QUICK_FEEL.includes(id) ? 'self' : (m.src || 'self')); if (day.ok) delete day.ok[id];
    day.vals[id] = val; saved.push(id); n++; });
  day.checkinAt = new Date().toISOString(); delete day.skipCheckin;
  Engine.save(); Crew.refresh(true);
  const sym = (m.sym || []).filter((x) => x !== 'none');
  if (sym.length) {
    const mood = m.draft.mood; const ans = { feel: mood == null ? 3 : mood <= 2 ? 2 : 3, sym };
    const qs = Status.steps(ans); const next = qs.findIndex((q) => ans[q.id] === undefined);
    if (next >= 0 && !saved.some((id) => Engine.classify(IND[id], day.vals[id]).level >= 3)) { // a few taps for the detail (where, how bad), then the result
      Care.sync(); ui.modal = { type: 'status', i: next, ans, fromCheckin: n }; render(); return;
    }
    Status.save(ans);
  }
  Care.sync(); Reminders.tick();
  if (welfareCheck(saved, { type: 'done', count: n })) return;
  ui.modal = { type: 'done', count: n }; render();
}
/* Fill the empty vitals with the last reading, for days when nothing changed. */
function fillLast() {
  const m = ui.modal; let n = 0;
  [...QUICK_FEEL, ...QUICK_VITALS].forEach((id) => { if (m.draft[id] == null) { const st = Engine.status(id); if (st.v != null) { m.draft[id] = st.v; (m.carried = m.carried || {})[id] = st.v; n++; } } });
  renderModal(); toast(n ? `${n} filled with your last readings — change any that differ` : 'No earlier readings to copy yet');
}
function syncSave() { const b = $('#save'); if (b && ui.modal) b.disabled = !stepValid(ui.modal); }

function advanceMeasure(m) {
  if (m.i < m.steps.length - 1) { m.i++; renderModal(); return; }
  if (m.guided) { ui.modal = { type: 'done', count: m.count }; render(); }
  else { ui.modal = null; render(); if (m.count) toast(`${m.count} reading${m.count > 1 ? 's' : ''} saved`); }
}

function download(name, text, mime) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: mime })); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function tickTimer() {
  clearInterval(window.__emTimer);
  const t = $('#em-timer'); if (!t) return;
  const upd = () => { const el = $('#em-timer'); if (!el) { clearInterval(window.__emTimer); return; }
    const s = Math.max(0, Math.floor((Date.now() - new Date(el.dataset.start).getTime()) / 1000));
    el.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  upd(); window.__emTimer = setInterval(upd, 1000);
}

/* A critical reading starts "Are you OK?": silence alerts the crew. */
function welfareCheck(ids, next) {
  if (!autoAlertOn()) return false;
  const items = ids.filter((id) => IND[id] && !SHIP_READINGS.includes(id)).map((id) => ({ id, v: Engine.today().vals[id] })).filter((x) => x.v != null && Engine.classify(IND[x.id], x.v).level >= 3);
  if (!items.length) return false;
  ui.modal = { type: 'welfare', items, until: Date.now() + WELFARE_SECONDS * 1000, next }; render();
  Voice.speak(`Critical reading: ${items.map((x) => IND[x.id].short).join(' and ')}. Are you OK? Answer, or I will alert your crew in ${WELFARE_SECONDS} seconds.`);
  return true;
}
setInterval(() => {
  const m = ui.modal; if (!m || m.type !== 'welfare' || m.sent) return;
  const left = Math.ceil((m.until - Date.now()) / 1000); const el = $('#wf-left'); if (el) el.textContent = Math.max(0, left);
  if (left > 0) return;
  const me = Crew.members()[0]; const what = m.items.map((x) => `${IND[x.id].short} ${Engine.fmt(IND[x.id], x.v)} ${IND[x.id].unit}`).join(', ');
  m.sent = Crew.raise(me, 'help', `Automatic alert: critical reading (${what}) and no answer for ${WELFARE_SECONDS} s`).id;
  render(); Voice.speak('I have alerted your crew. Help is coming.'); toast(alertSentMsg('alert'));
}, 1000);
const stopSpeech = () => { try { speechSynthesis.cancel(); } catch (e) { /* no speech */ } };
/* Hands busy: the steps read aloud, from the first one not done yet. */
function speakSteps(m) {
  if (m.speaking) { m.speaking = false; stopSpeech(); renderModal(); return; }
  if (!('speechSynthesis' in window)) { toast('Reading aloud is not available in this browser'); return; }
  const e = EMG[m.em]; if (!e) return;
  const from = Math.max(0, e.steps.findIndex((s, k) => !m.done[k]));
  m.speaking = true; renderModal();
  Voice.speak(e.steps.slice(from).map((s, k) => `Step ${from + k + 1}. ${s}`).join(' '));
}

const actions = {
  qsym(d, el) {
    const m = ui.modal; let s = m.sym || [];
    s = d.v === 'none' ? (s.includes('none') ? [] : ['none']) : s.includes(d.v) ? s.filter((x) => x !== d.v) : [...s.filter((x) => x !== 'none'), d.v];
    m.sym = s; document.querySelectorAll('#modal [data-act="qsym"]').forEach((b) => { const on = s.includes(b.dataset.v); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  },
  case(d) { const id = d.v || d.id; if (!Care.get(id)) { toast('This follow-up is closed'); return; } Care.seen(id); ui.modal = { type: 'case', id }; render(); },
  casedid(d) { const c = Care.get(d.id); Care.act(d.id, 'Did the recommended steps'); Insight.decide(c.key, 'done'); ui.modal = null; render(); toast('Recorded — NovaCare will check at your next measurement'); },
  casemeasure(d) { const c = Care.get(d.id); Care.act(d.id, 'Measured again'); Care.measured(d.id); ui.modal = null; actions.log({ id: c.ind }); },
  casedischarge(d) {
    const c = Care.get(d.id); const by = Protocols.signer();
    if (!by) { // not the medical officer: the request goes to the crew, and the officer signs on their own device
      Crew.raise(Crew.members()[0], 'assist', `Discharge review: ${c.title}`.slice(0, 160)); Care.act(d.id, 'Asked the Crew Medical Officer to review the discharge');
      ui.modal = null; render(); toast('Sent — the Crew Medical Officer reviews it from your card on their device'); return;
    }
    if (!confirm(`Discharge “${c.title}”?\n\nSigned as ${by}. NovaCare opens a new case if it comes back.`)) return;
    Care.discharge(d.id, by); ui.modal = null; render(); toast('Discharged — it stays in your record and the mission log');
  },
  matedischarge(d) {
    const m = Crew.members().find((x) => x.id === d.id); const c = m && (m.care || []).find((x) => x.id === d.v); const by = Protocols.signer(); if (!c || !by) return;
    if (!confirm(`Discharge “${c.title}” for ${m.name}?\n\nSigned as ${by}. It closes on their device the next time it syncs.`)) return;
    Crew.record(m, 'care', c.id, by); renderModal(); toast(`Discharge signed for ${m.name.split(' ')[0]} — it reaches their device with the next sync`);
  },
  insdo(d) { const r = Insight.decide(d.key, d.v); render(); if (r) toast('Recorded — NovaCare will check whether it helped'); },
  insconfirm(d) { const f = Insight.findings().find((x) => x.key === 'u-' + d.id); Insight.confirm(d.id); Insight.decide('u-' + d.id, 'confirm', f); Engine.save(); Crew.refresh(true); render(); toast('Reading confirmed — it now counts'); },
  inscrew(d) {
    const f = Insight.findings().find((x) => x.key === d.key); if (!f) return;
    if (!confirm(`Tell your crew about this?\n\n“${f.title}”\n\nEveryone on your mission gets a non-urgent request to check on you.`)) return;
    Crew.raise(Crew.members()[0], 'assist', `${f.title} — ${f.detail}`.slice(0, 160)); Insight.decide(d.key, 'crew', f); render(); toast(alertSentMsg('help request'));
  },
  insask(d) { ui.modal = { type: 'ask', chat: [], speak: false }; renderModal(); askNow(d.q); },
  gofind() { ui.modal = null; ui.view = 'personal'; ui.sub = 'overview'; ui.sys = null; render(); const el = $('#findings') || $('.hero'); if (el) el.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' }); },
  qsrc(d) { ui.modal.src = d.v; document.querySelectorAll('#modal [data-act="qsrc"]').forEach((b) => { const on = b.dataset.v === d.v; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); },
  async selftest() { toast('Testing the onboard systems…'); await Autonomy.run(); if (ui.modal && ui.modal.type === 'settings') renderModal(); },
  wfok() { const m = ui.modal; stopSpeech(); if (m.sent) Crew.resolve(m.sent); ui.modal = m.next || null; render(); toast(m.sent ? 'Good — the alert to your crew was cancelled' : 'Good. Measure again to confirm the reading'); },
  wfhelp() { const m = ui.modal; stopSpeech(); const me = Crew.members()[0]; ui.modal = { type: 'emergency', step: 'pick', id: me.id, name: me.name, done: {}, fromHelp: m.sent || undefined }; renderModal(); },
  firstaid() { ui.modal = { type: 'firstaid', done: {} }; renderModal(); },
  fatype(d) { const m = ui.modal; m.em = d.v; m.done = {}; m.start = m.start || new Date().toISOString(); renderModal(); },
  fastep(d) { const m = ui.modal; m.done[d.k] = !m.done[d.k]; renderModal(); },
  faback() { const m = ui.modal; m.em = null; m.speaking = false; stopSpeech(); renderModal(); },
  emgspeak() { speakSteps(ui.modal); },
  emgself() { const me = Crew.members()[0]; ui.helpBack = null; ui.modal = { type: 'emergency', step: 'pick', id: me.id, name: me.name, done: {} }; renderModal(); },
  alladv() { ui.allAdv = !ui.allAdv; render(); },
  allfind() { ui.allFind = !ui.allFind; render(); },
  coachdone(d) { const on = Coach.markDone(d.v); render(); if (on) toast('Nice — logged for today. Small steps add up.'); },
  allverd() { ui.allVerd = !ui.allVerd; render(); },
  allpred() { ui.allPred = !ui.allPred; render(); },
  allrisk() { ui.allRisk = !ui.allRisk; render(); },
  theme() { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = t; try { localStorage.setItem('novacare.theme', t); } catch (e) { /* ignore */ } renderTop(); },
  sub(d) { if (ui.view === 'personal' && ui.sub === d.v) return; navigate(() => { ui.view = 'personal'; ui.sub = d.v; ui.modal = null; render(); }); },
  mate(d) { ui.modal = { type: 'mate', id: d.id }; renderModal(); },
  emergency(d) { const m = Crew.members().find((x) => x.id === d.id); ui.modal = { type: 'emergency', step: 'pick', id: d.id, name: m ? m.name : '', done: {} }; renderModal(); },
  emgtype(d) {
    const m = ui.modal; const mate = Crew.members().find((x) => x.id === m.id) || { id: m.id, name: m.name };
    if (m.alertId) { // switching protocol keeps the same alert
      Crew.writeAlerts(Crew.alerts().map((a) => a.id === m.alertId ? { ...a, type: d.v, pending: Crew.shared() } : a)); Sync.run();
    } else m.alertId = Crew.raise(mate, d.v, m.text || '').id;
    m.step = 'protocol'; m.em = d.v; m.done = {}; m.speaking = false; emgPersist(m);
    render(); toast(alertSentMsg('emergency'));
  },
  emgstep(d) { const m = ui.modal; m.done[d.k] = m.done[d.k] ? null : new Date().toISOString(); emgPersist(m); renderModal(); },
  emgswitch() { ui.modal.step = 'pick'; renderModal(); },
  emgresolve() { emgRecord(ui.modal); stopSpeech(); if (ui.modal.alertId) Crew.resolve(ui.modal.alertId); if (ui.modal.fromHelp) Crew.resolve(ui.modal.fromHelp); ui.modal = null; render(); toast('Emergency resolved — what was done is in the mission log'); },
  emgopen(d) {
    const a = Crew.alerts().find((x) => x.id === d.id); if (!a) return;
    // a help request opens the emergency flow for that person, with what they wrote, so the helper can describe or pick the situation
    if (HELP_TYPES[a.type]) { ui.modal = { type: 'emergency', step: 'pick', id: a.aboutId, name: a.aboutName, text: a.note || '', done: {}, fromHelp: a.id }; renderModal(); return; }
    ui.modal = emgRestore({ type: 'emergency', step: 'protocol', id: a.aboutId, name: a.aboutName, alertId: a.id, em: a.type, done: {} }); renderModal();
  },
  help() { ui.helpBack = ui.modal && ui.modal.type !== 'help' ? ui.modal : null; ui.modal = { type: 'help', urgent: true, why: [] }; renderModal(); },
  guidedone() { state.guideDone = true; Engine.save(); render(); },
  photorestore() { delete state.photo; Engine.save(); Crew.refresh(true); render(); toast('Profile photo restored'); },
  photoremove() { state.photo = 'none'; Engine.save(); Crew.refresh(true); render(); toast('Profile photo removed'); },
  logfilter(d) { ui.logFilter = d.v; ui.logMsg = ''; render(); },
  logexport() { download(`novacare-log-${Auth.user().crew || 'personal'}-MD${state.md}.txt`, MissionLog.toText(MissionLog.entries()), 'text/plain'); },
  testalarm() { announceAlerts([{ id: 'test', type: 'assist', fromName: 'Alarm test', aboutName: '', note: 'This is how a call for help sounds' }]); },
  syncnow() { Sync.run(); toast('Syncing with the NovaCare database…'); setTimeout(() => { if (ui.modal && ui.modal.type === 'settings') renderModal(); }, 2500); },
  takego(d) { ackAlert(d.id); renderTakeover(); actions.emgopen({ id: d.id }); },
  takeack(d) { ackAlert(d.id); renderTakeover(); toast('Seen — the alert stays in the red bar until it is resolved'); },
  helpurg(d) { ui.modal.urgent = d.v === '1'; renderModal(); },
  helpwhy(d) { const w = ui.modal.why; ui.modal.why = w.includes(d.v) ? w.filter((x) => x !== d.v) : [...w, d.v]; renderModal(); },
  emgdone(d, el) {
    const a = Crew.alerts().find((x) => x.id === d.id); if (!a) return;
    const own = HELP_TYPES[a.type] && fromMe(a);
    if (Auth.user().guest && !fromMe(a) && !String(a.fromId).startsWith('guest:')) { toast('Only crew members can resolve a crew member’s emergency'); return; }
    if (!own && el && el.dataset.armed !== '1') { // a second tap confirms; nothing is resolved by accident
      el.dataset.armed = '1'; const was = el.textContent; el.textContent = 'Tap again to resolve';
      setTimeout(() => { if (el.isConnected) { el.dataset.armed = ''; el.textContent = was; } }, 4000); return;
    }
    Crew.resolve(d.id); if (ui.modal && ui.modal.type === 'help') ui.modal = null; render();
    toast(own ? 'Request cancelled — your crew sees that you are OK' : 'Resolved for the whole crew');
  },
  togglesim() { state.showSim = true; Engine.save(); Crew.refresh(true); render(); },
  mreport() { download(`novacare-mission-${Auth.user().crew}-MD${state.md}.txt`, missionReport(), 'text/plain'); },
  authtab(d) { ui.auth = d.v; ui.authErr = ''; ui.resetSent = ''; renderAuth(); },
  resetagain() { ui.resetSent = ''; ui.authErr = ''; renderAuth(); },
  guest() {
    Auth.guest(); Engine.load(); setupGuest(); ui.view = 'lobby'; ui.sub = 'overview'; ui.sys = null; ui.crewTab = 'mates';
    render(); window.scrollTo(0, 0); Sync.run(); toast('Exploring as a guest — data stays on this device');
  },
  missiontab(d) { navigate(() => { ui.view = 'mission'; ui.missionTab = d.v; ui.modal = null; render(); }); },
  ask() { ui.modal = { type: 'ask', chat: [], speak: false }; renderModal(); },
  askq(d, el) { askNow((el && el.textContent.trim()) || d.q); }, // the chip as shown, in the app language
  emgq(d, el) { emgAskNow((el && el.textContent.trim()) || d.q); },
  mic(d, el) {
    if (Voice.listening()) { Voice.stop(); return; }
    const input = $('#' + d.target); if (!input) return;
    el.classList.add('on'); input.placeholder = 'Listening…';
    const ok = Voice.listen((text) => {
      input.value = text;
      if (d.target === 'help-note') return;
      if (d.target === 'ask-in') askNow(text); else if (d.target === 'emg-ask-in') emgAskNow(text); else if (d.target === 'emg-text') describeNow(text);
    }, () => { el.classList.remove('on'); });
    if (!ok) { el.classList.remove('on'); toast('Voice input is not available in this browser'); }
  },
  medkit() {
    const r = Inventory.importRows(MED_KIT.map(([name, cat, qty, unit, min]) => ({ name, cat, qty, unit, min })));
    renderModal(); toast(`${r.added} medical items added to the ship inventory${r.updated ? `, ${r.updated} updated` : ''}`);
  },
  status() { ui.modal = { type: 'status', i: 0, ans: {} }; renderModal(); },
  reminders() { ui.modal = { type: 'reminders' }; renderModal(); },
  remlog(d) { const t = TASKS.find((x) => x.id === d.v); if (!t) return; ui.modal = null; if (t.id === 'vitals' || t.id === 'mind') { startCheckin(); return; } openMeasure(CHECKIN_GROUPS.filter((g) => g.some((id) => t.ids.includes(id))), true); },
  remdone(d) { const t = TASKS.find((x) => x.id === d.v); if (!t) return; Engine.today().tasks[t.id] = true; Engine.save(); toast(`${t.label} done`); if (ui.modal) renderModal(); render(); },
  remlater(d) { Reminders.snooze(d.id, 60); toast('Reminder snoozed for an hour'); renderModal(); renderTop(); },
  async remon() { const p = await Reminders.enable(); toast(p === 'granted' ? 'Notifications on — NovaCare will remind you' : 'Notifications were not allowed'); renderModal(); },
  remoff() { Reminders.disable(); toast('Notifications off — reminders stay under the bell'); renderModal(); },
  stans(d) {
    const m = ui.modal; const q = Status.steps(m.ans)[m.i]; const opt = q.opts.find(([v]) => String(v) === d.v); if (!opt) return;
    const val = opt[0];
    if (q.type === 'one') { m.ans[q.id] = val; statusNext(); return; }
    let cur = Array.isArray(m.ans[q.id]) ? m.ans[q.id] : [];
    cur = cur.includes(val) ? cur.filter((x) => x !== val) : val === 'none' ? ['none'] : [...cur.filter((x) => x !== 'none'), val];
    m.ans[q.id] = cur; renderModal();
  },
  stnext() { statusNext(); },
  stback() { if (ui.modal.i > 0) { ui.modal.i--; renderModal(); } },
  joindir(d) {
    const m = Missions.directory().find((x) => x.code === d.code);
    try { Missions.join(d.code, m); ui.sys = null; navigate(render); toast(`You joined ${m && m.name ? m.name : 'mission ' + d.code}`); }
    catch (e) { toast(e.message); }
  },
  syncinfo() {
    if (Auth.user().guest) { toast('Guest mode: everything stays on this device. Sign in with an account to share with your crew.'); return; }
    const st = Sync.status();
    if (st === 'relink') { ui.modal = { type: 'reauth' }; renderModal(); return; }
    toast(SYNC_UI[st][3]); if (st !== 'local') Sync.run();
  },
  logout() {
    const warn = Auth.user().guest ? '\n\nGuest data stays on this device: choose “Continue as guest” again to pick up where you left off.' : Sync.pending() && Auth.cloud() ? '\n\nSome readings have not uploaded yet. They stay saved on this device and will upload the next time you sign in with signal.' : '';
    if (!confirm('Sign out of NOVACARE?' + warn)) return;
    Auth.logout(); state = null; ui.view = 'lobby'; ui.crewTab = 'mates'; ui.sub = 'overview'; ui.auth = 'login'; ui.authErr = ''; render(); toast('Signed out'); },
  mission(d) {
    if (Auth.user().crew === d.code) { actions.missiontab({ v: 'status' }); return; }
    const m = Missions.list().find((x) => x.code === d.code); if (!m) return;
    navigate(() => { Missions.activate(d.code); ui.sys = null; render(); });
    toast(`Switched to ${m.name}`);
  },
  newmission() { ui.modal = { type: 'newmission' }; renderModal(); },
  joinmission() { ui.modal = { type: 'joinmission' }; renderModal(); },
  entermission() { ui.modal = null; actions.view({ v: 'personal' }); },
  leavemission(d) {
    const m = Missions.list().find((x) => x.code === d.code); if (!m) return;
    if (!confirm(`Leave ${m.name}?\n\nYour readings for this mission are removed from this account and your crewmates stop seeing you. You can join again later with the code ${m.code}.`)) return;
    Missions.leave(d.code); ui.sys = null; ui.modal = null;
    navigate(() => { ui.view = Missions.has() ? 'lobby' : 'mission'; ui.missionTab = 'missions'; render(); });
    toast(`You left ${m.name}${Missions.has() ? ` — now on ${Missions.current().name}` : ''}`);
  },
  copycode(d) {
    const done = () => toast(`Code ${d.code} copied — share it with your crew`);
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(d.code).then(done, () => toast(`Mission code: ${d.code}`)); else toast(`Mission code: ${d.code}`);
  },
  bodystatus() { const el = $('#systems'); if (el) el.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' }); },
  pwshow(d, el) { const i = el.parentElement.querySelector('input'); const show = i.type === 'password'; i.type = show ? 'text' : 'password'; el.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); el.classList.toggle('on', show); },
  crewtab(d) { if ((ui.crewTab || 'mates') === d.v) return; navigate(() => { ui.crewTab = d.v; ui.modal = null; render(); }); },
  invadd() { ui.modal = { type: 'invitem' }; renderModal(); },
  invedit(d) { ui.modal = { type: 'invitem', id: d.id }; renderModal(); },
  invadj(d) { Inventory.adjust(d.id, +d.d); render(); },
  invdel(d) { const it = Inventory.items().find((i) => i.id === d.id); if (!it || !confirm(`Remove ${it.name} from the ship inventory?`)) return; Inventory.remove(d.id); render(); toast(`${it.name} removed`); },
  invcat(d) { ui.invCat = d.v; render(); },
  invupload() { const f = $('#inv-file'); if (f) f.click(); },
  invstarter() { const r = Inventory.starter(); render(); toast(`${r.added} starter items added — adjust them to match your ship`); },
  invexport() { download(`novacare-inventory-${Auth.user().crew}.csv`, Inventory.toCsv(), 'text/csv'); },
  view(d) {
    if (!['lobby', 'mission'].includes(d.v) && Auth.user() && Missions.locked()) { toast('Create or join a mission first'); return; }
    if (d.v === ui.view && !SUB_ALIAS[d.v]) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    navigate(() => {
      if (SUB_ALIAS[d.v]) { ui.view = 'personal'; ui.sub = SUB_ALIAS[d.v]; } else ui.view = d.v;
      ui.modal = null; render();
    });
  },
  sys(d) { ui.sys = d.id; ui.view = 'personal'; ui.sub = 'overview'; render(); },
  detail(d) { ui.modal = { type: 'detail', id: d.id }; renderModal(); },
  log(d) { openMeasure([CHECKIN_GROUPS.find((g) => g.includes(d.id))], false); },
  checkin() { startCheckin(); },
  close() {
    const el = $('#modal'); if (!ui.modal || el.classList.contains('out') || ui.modal.type === 'welfare') return; // "Are you OK?" needs an answer
    if (!reduceMotion()) { el.classList.add('out'); setTimeout(() => actions.close2(), 160); return; }
    actions.close2();
  },
  close2() { const m = ui.modal; ui.modal = m && m.type === 'help' && ui.helpBack ? ui.helpBack : null; ui.helpBack = null; $('#modal').classList.remove('out'); render(); if (m && m.type === 'measure' && m.count) toast(`${m.count} reading${m.count > 1 ? 's' : ''} saved`); },
  gostatus() { ui.modal = null; ui.view = 'personal'; ui.sub = 'overview'; ui.sys = null; render(); window.scrollTo(0, 0); },
  settings() { ui.modal = { type: 'settings' }; renderModal(); },
  range(d) { ui.range = +d.r; renderModal(); },
  nextday() { state.md++; Engine.today(); Engine.save(); render(); toast(`Mission day ${state.md} — crew data and mission status updated`); },
  env(d) { state.env = d.id; Engine.save(); render(); },
  pick(d) {
    const m = ui.modal; m.draft[d.id] = +d.v;
    document.querySelectorAll(`#modal [data-act="pick"][data-id="${d.id}"]`).forEach((b) => b.classList.toggle('on', b.dataset.v === d.v));
    $('#ro-' + d.id).innerHTML = readoutHtml(d.id, m.draft[d.id]); syncSave();
  },
  step(d) {
    const m = ui.modal; const ind = IND[d.id]; const last = Engine.status(d.id);
    const has = m.draft[d.id] != null && fin(m.draft[d.id]);
    const base = has ? m.draft[d.id] : (last.v != null ? last.v : ind.def);
    const v = +clamp(has ? base + ind.step * +d.d : base, ind.min, ind.max).toFixed(ind.dec);
    m.draft[d.id] = v; $('#in-' + d.id).value = v;
    $('#ro-' + d.id).innerHTML = readoutHtml(d.id, v); syncSave();
  },
  filllast() { fillLast(); },
  skipcheckin() { Engine.today().skipCheckin = true; Engine.save(); render(); toast('No problem — “Add info” is there whenever you want it'); },
  save() {
    const m = ui.modal; if (m && m.type === 'quick') { saveQuick(); return; }
    if (!stepValid(m)) return;
    const day = Engine.today();
    const ids = m.steps[m.i];
    ids.forEach((id) => { day.vals[id] = +(+m.draft[id]).toFixed(IND[id].dec); Insight.setSrc(day, id, IND[id].exam ? 'exam' : 'self'); if (day.ok) delete day.ok[id]; m.count++; });
    Engine.save(); Care.sync(); Reminders.tick();
    if (welfareCheck(ids, m.i >= m.steps.length - 1 && m.guided ? { type: 'done', count: m.count } : null)) return;
    advanceMeasure(m);
  },
  skip() { advanceMeasure(ui.modal); },
  task(d) {
    const t = TASKS.find((x) => x.id === d.id); const day = Engine.today();
    if (t.id === 'vitals' || t.id === 'mind') { startCheckin(); return; }
    if (t.auto) { openMeasure(CHECKIN_GROUPS.filter((g) => g.some((id) => t.ids.includes(id))), false); return; }
    day.tasks[t.id] = !day.tasks[t.id]; Engine.save(); render();
    if (day.tasks[t.id]) toast(`${t.label} done`);
  },
  report() { download(`novacare-report-MD${state.md}.txt`, Engine.report(), 'text/plain'); },
  export() { download(`novacare-data-MD${state.md}.json`, JSON.stringify(state, null, 2), 'application/json'); },
  demo() { if (confirm('Replace current data with the 33-day demo mission?')) { state = keepAccount(Engine.demo()); Engine.save(); ui.sys = null; ui.modal = null; render(); toast('Demo mission loaded'); } },
  reset() { if (confirm('Erase all your readings for this mission?\n\nThe mission, its day and your crew stay as they are. This cannot be undone.')) { const e = state.env, sd = state.startDate; state = keepAccount(Engine.fresh()); state.env = e; if (sd) state.startDate = sd; Engine.calendarDay(); Engine.save(); ui.sys = null; ui.modal = null; render(); toast('Readings erased — log a check-in when you are ready'); } },
};
Object.assign(actions, Mind.actions); // Mind: weekly check, programs, crew climate, Window to Earth

/* Status update: next question, or save and show the result. Answers to questions that no longer apply are dropped. */
function statusNext() {
  const m = ui.modal; const qs = Status.steps(m.ans);
  if (m.i < qs.length - 1) { m.i++; renderModal(); return; }
  const keep = {}; qs.forEach((q) => { if (m.ans[q.id] !== undefined) keep[q.id] = m.ans[q.id]; });
  const r = Status.save(keep); Crew.refresh(true); if (m.fromCheckin) { Care.sync(); Reminders.tick(); }
  if (!r.level) { ui.modal = null; render(); toast(`Thanks — all good. Next quick status in ${Status.every()} h`); return; }
  m.result = r; render();
}

/* The guest is Bruno, already on a preset mission with a month of readings, so everything can be
   tried at once. Set up once per device; it stays on the device and never syncs. */
const GUEST_MISSION = SHOWCASE;
const GUEST_VERSION = 3; // raise to give every guest a fresh copy of the sample data
/* Bruno's sample medical profile and exams: invented for the prototype, not real medical data.
   The penicillin allergy makes the "Can I take amoxicillin?" demo work straight away. */
const GUEST_PROFILE = { blood: 'O+', allergies: ['penicillin'], other: '', meds: ['Vitamin D 1000 IU daily'], conditions: [], notes: 'Sample profile for the prototype — not real medical data.', baseline: { hr: 57, sys: 112, dia: 72, mass: 74 } };
const GUEST_EXAMS = { 3: { ecg: 0, pexam: 0 }, 17: { urine: 0 }, 24: { ultra: 0 }, 31: { ecg: 1, pexam: 0 } };
function setupGuest() {
  const u = Auth.user(); if (!u || !u.guest) return;
  // the guest's ship carries the mission loadout (medical kit included), kept on this device only
  const stock = () => { if (typeof Inventory !== 'undefined' && !Inventory.items().length) Missions.loadInventory(true); };
  if (state.guestReady === GUEST_VERSION) { Engine.calendarDay(); stock(); return; }
  const photo = state.photo;
  state = Engine.demo(); // a month of sample readings, ending today
  state.name = u.name; state.guestReady = GUEST_VERSION; state.guideDone = false; if (photo) state.photo = photo;
  state.profile = { ...GUEST_PROFILE, updatedAt: new Date().toISOString() };
  Object.entries(GUEST_EXAMS).forEach(([d, v]) => { if (state.days[d]) Object.assign(state.days[d].vals, v); });
  state.missions = [{ code: GUEST_MISSION.code, name: GUEST_MISSION.name, role: 'member', at: new Date().toISOString() }];
  state.archive = {}; state.missionName = GUEST_MISSION.name; state.missionDays = GUEST_MISSION.days;
  const start = new Date(); start.setDate(start.getDate() - (state.md - 1)); // so today is the day after the sample month
  state.startDate = Engine.dayKey(start); Engine.calendarDay();
  Auth.updateProfile({ crew: GUEST_MISSION.code });
  Engine.today(); Engine.save(); Crew.refresh(true); stock();
}

/* Loading the demo or restarting replaces the readings, never the person's missions, profile or name. */
function keepAccount(next) {
  ['missions', 'archive', 'profile', 'autoAlert', 'decisions', 'showSim', 'missionName', 'missionDays', 'updateEvery', 'log', 'photo', 'guideDone'].forEach((k) => { if (state && state[k] !== undefined) next[k] = state[k]; });
  if (state && state.name) next.name = state.name;
  return next;
}

/* ---------- Questions and emergency help ---------- */
function askNow(q) {
  q = String(q || '').trim(); const m = ui.modal; if (!q || !m || m.type !== 'ask') return;
  const a = Assistant.answer(q); const entry = { q, a }; m.chat = [...(m.chat || []), entry].slice(-20);
  // the local model only rewords knowledge-base answers; rules-engine answers are never sent to it
  if (a.kb && LocalLLM.ready()) { a.thinking = true; LocalLLM.phrase(q, a.kb, Crew.members()[0]).then((txt) => { a.thinking = false; if (txt) a.llm = txt; if (ui.modal === m) renderModal(); }); }
  renderModal();
  if (m.speak && a.say) Voice.speak(a.say, a.lang);
}
function emgMate(m) { return Crew.members().find((x) => x.id === m.id) || { id: m.id, name: m.name || 'Crew member', latest: {}, advisories: [], systems: {}, med: null }; }
function emgAskNow(q) {
  q = String(q || '').trim(); const m = ui.modal; if (!q || !m || m.type !== 'emergency') return;
  const a = Assistant.answer(q, { person: emgMate(m), emg: m.em }); m.ask = [...(m.ask || []), { q, a }].slice(-10); renderModal();
  const box = $('.emg-ask'); if (box) box.scrollIntoView({ block: 'end' });
}
/* "Describe what is happening": recognise the situation and open its protocol straight away. */
function describeNow(text) {
  text = String(text || '').trim(); const m = ui.modal; if (!text || !m || m.type !== 'emergency') return;
  const guess = Emergency.classify(text);
  m.text = text;
  if (!guess.length) { m.noMatch = true; renderModal(); return; }
  m.others = guess.slice(1, 4); actions.emgtype({ v: guess[0] });
}

document.addEventListener('click', (ev) => {
  if (ev.target.id === 'modal') { actions.close(); return; }
  const el = ev.target.closest('[data-act]'); if (!el) return;
  if (el.dataset.act === 'invupload') { actions.invupload(); return; } // keep the user gesture for the file picker
  if (el.dataset.act === 'photopick') { pickPhoto(); return; }
  ev.preventDefault(); ev.stopPropagation();
  actions[el.dataset.act](el.dataset, el);
});
document.addEventListener('submit', (ev) => {
  if (ev.target.id === 'auth-form') { ev.preventDefault(); if (!ui.busy) submitAuth(ev.target); }
  if (ev.target.id === 'forgot-form' && !ui.busy) {
    ev.preventDefault(); const email = String(new FormData(ev.target).get('email') || '').trim();
    ui.busy = true; ui.authErr = ''; renderAuth();
    Auth.requestReset(email).then(() => { ui.resetSent = email; }).catch((e) => { ui.authErr = e.message; })
      .finally(() => { ui.busy = false; renderAuth(); const i = $('#au-email'); if (i && !ui.resetSent) i.value = email; });
  }
  if (ev.target.id === 'newpw-form' && !ui.busy) {
    ev.preventDefault(); const d = Object.fromEntries(new FormData(ev.target));
    ui.busy = true; ui.authErr = ''; renderAuth();
    Auth.setNewPassword(d.password, d.confirm).then(() => {
      ui.busy = false; ui.auth = 'login'; ui.view = 'lobby'; Engine.load(); render(); toast('Password changed — you are signed in'); Sync.run();
    }).catch((e) => { ui.busy = false; ui.authErr = e.message; renderAuth(); });
  }
  if (ev.target.id === 'mission-new-form') {
    ev.preventDefault(); const d = Object.fromEntries(new FormData(ev.target));
    if (!String(d.name || '').trim()) { ui.modal.err = 'Give the mission a name.'; ui.modal.env = d.env; renderModal(); return; }
    const code = Missions.create(d); ui.sys = null; ui.modal = { type: 'created', code }; render();
  }
  if (ev.target.id === 'mission-join-form') {
    ev.preventDefault();
    try { const r = Missions.join(new FormData(ev.target).get('code')); ui.sys = null; ui.modal = null; navigate(render); toast(r.existed ? `Switched to mission ${r.code}` : `You joined mission ${r.code}`); }
    catch (e) { ui.modal.err = e.message; renderModal(); }
  }
  if (ev.target.id === 'inv-form') {
    ev.preventDefault();
    try { const id = ui.modal.id; Inventory.save(Object.fromEntries(new FormData(ev.target)), id); ui.modal = null; render(); toast(id ? 'Item updated' : 'Item added to the ship inventory'); }
    catch (e) { ui.modal.err = e.message; renderModal(); }
  }
  if (ev.target.id === 'help-form') {
    ev.preventDefault(); const m = ui.modal; const note = [m.why.join(', '), String(new FormData(ev.target).get('note') || '').trim()].filter(Boolean).join(' — ');
    const me = Crew.members()[0]; Crew.raise(me, m.urgent ? 'help' : 'assist', note);
    ui.modal = ui.helpBack || null; ui.helpBack = null; render();
    toast(alertSentMsg('help request'));
  }
  if (ev.target.id === 'log-form') { ev.preventDefault(); logCommand(new FormData(ev.target).get('q')); return; }
  if (ev.target.id === 'ask-form') { ev.preventDefault(); askNow(new FormData(ev.target).get('q')); }
  if (ev.target.id === 'emg-ask-form') { ev.preventDefault(); emgAskNow(new FormData(ev.target).get('q')); }
  if (ev.target.id === 'emg-describe') { ev.preventDefault(); describeNow(new FormData(ev.target).get('text')); }
  if (ev.target.id === 'medical-form') {
    ev.preventDefault(); const f = new FormData(ev.target); const lines = (k) => String(f.get(k) || '').split('\n').map((x) => x.trim()).filter(Boolean);
    Medical.save({ blood: f.get('blood'), allergies: f.getAll('alg'), other: f.get('other'), meds: lines('meds'), conditions: lines('conditions'), notes: f.get('notes'),
      baseline: { hr: f.get('bl-hr'), sys: f.get('bl-sys'), dia: f.get('bl-dia'), mass: f.get('bl-mass') } });
    Crew.refresh(true); render(); toast('Medical profile saved');
  }
  if (ev.target.id === 'reauth-form') {
    ev.preventDefault();
    const pw = new FormData(ev.target).get('password');
    Auth.reconnect(pw).then(() => { ui.modal = null; renderModal(); toast('Sync resumed'); Sync.run(); })
      .catch((e) => { ui.modal.err = e.message; renderModal(); });
  }
});
document.addEventListener('keydown', (ev) => {
  if (document.body.classList.contains('alarm')) return; // a call for help must be answered with a button
  if (ev.key === 'Escape' && ui.modal) { actions.close(); return; }
  if (Auth.user() && !ui.modal && !ev.metaKey && !ev.ctrlKey && !ev.altKey && !(ev.target.matches && ev.target.matches('input, select, textarea')) && SECTIONS[+ev.key - 1]) { actions.view({ v: SECTIONS[+ev.key - 1].v }); return; }
  if (!ev.target.matches) return;
  if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('[role="button"][data-act]')) { ev.preventDefault(); ev.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  if (ev.key === 'Enter' && ev.target.matches('input[data-in]') && ui.modal) { ev.preventDefault(); actions.save(); }
});
document.addEventListener('input', (ev) => {
  const id = ev.target.dataset && ev.target.dataset.in;
  if (id && ui.modal) {
    const raw = ev.target.value; ui.modal.draft[id] = raw === '' ? null : parseFloat(raw);
    $('#ro-' + id).innerHTML = readoutHtml(id, ui.modal.draft[id]); syncSave();
  }
});
document.addEventListener('change', (ev) => {
  if (ev.target.id === 'name') { state.name = ev.target.value.trim(); Engine.save(); renderTop(); }
  if (ev.target.id === 'set-mname') { Missions.rename(ev.target.value); render(); toast('Mission renamed'); }
  if (ev.target.id === 'inv-file' && ev.target.files[0]) {
    const file = ev.target.files[0]; ev.target.value = '';
    if (file.size > 500000) { toast('That file is too large — upload a CSV list under 500 KB'); return; }
    file.text().then((t) => { const r = Inventory.importRows(Inventory.parseCsv(t)); render();
      toast(r.added + r.updated ? `${r.added} item${r.added === 1 ? '' : 's'} added, ${r.updated} updated` : 'No items found — use columns: name, category, quantity, unit, minimum, note'); });
  }
  if (ev.target.id === 'set-len') { const v = Math.round(+ev.target.value); if (v >= 7 && v <= 1200) { state.missionDays = v; Engine.save(); render(); } }
  if (ev.target.id === 'set-every') { state.updateEvery = +ev.target.value; Engine.save(); toast(`Status update every ${state.updateEvery} hours`); }
  if (ev.target.id === 'ask-speak' && ui.modal) ui.modal.speak = ev.target.checked;
  if (ev.target.id === 'photo-file' && ev.target.files[0]) savePhoto(ev.target.files[0]);
  if (ev.target.id === 'set-env') { state.env = ev.target.value; Engine.save(); render(); toast(`Location: ${ENVIRONMENTS[state.env].short}`); }
  if (ev.target.id === 'set-dark') { const t = ev.target.checked ? 'dark' : 'light'; document.documentElement.dataset.theme = t; try { localStorage.setItem('novacare.theme', t); } catch (e) { /* ignore */ } renderTop(); }
  if (ev.target.id === 'set-auto') { state.autoAlert = ev.target.checked; Engine.save(); toast(state.autoAlert ? 'On — NovaCare alerts your crew if you do not answer' : 'Off — NovaCare will not alert the crew by itself'); }
  if (ev.target.id === 'set-sim') { state.showSim = ev.target.checked; Engine.save(); Crew.refresh(true); render(); }
});

setInterval(() => { if (Auth.user()) { $('#banner').innerHTML = bannerHtml(); renderTakeover(); } }, 30000); // also clears it once the last alert is resolved

/* Where an alert can reach: the crew through the database, or only this device (guest, no mission, no database). */
function alertReach() {
  const u = Auth.user();
  if (!Auth.cloud()) return u && u.guest ? (Crew.shared() ? 'cloud' : 'guest') : 'local';
  return u.crew ? 'cloud' : 'nomission';
}
function alertSentMsg(kind) {
  const r = alertReach();
  if (r === 'guest') return `Guest mode: this ${kind} stays on this device. Sign in and join the same mission to alert your crew.`;
  if (r === 'local') return `Local mode: this ${kind} is only shown on this device.`;
  if (r === 'nomission') return `You are not on a mission, so nobody can receive this ${kind}. Join your crew’s mission first.`;
  return navigator.onLine === false ? `No signal — your ${kind} is saved and goes out as soon as the link is back` : `Sending your ${kind} to the crew…`;
}
/* ---------- a call for help takes over the screen ----------
   An active alert from a crewmate covers everything (check-in, forms, any page) until this person
   answers it. The task underneath is kept as it was, so nothing typed is lost. */
const ackKey = () => 'novacare.ack:' + (Auth.user() ? Auth.user().id : '-');
const acked = () => { try { return JSON.parse(localStorage.getItem(ackKey())) || []; } catch (e) { return []; } };
function ackAlert(id) { try { localStorage.setItem(ackKey(), JSON.stringify([...acked(), id].slice(-200))); } catch (e) { /* ignore */ } }
const fromMe = (a) => { const u = Auth.user(); return !!u && (a.fromId === u.id || (!!u.uid && a.fromId === u.uid)); };
function takeoverList() { if (!Auth.user() || !state) return []; const seen = acked(); return Crew.active().filter((a) => !fromMe(a) && !seen.includes(a.id)); }
function renderTakeover() {
  let el = $('#takeover');
  if (!el) { el = document.createElement('div'); el.id = 'takeover'; el.hidden = true; document.body.appendChild(el); }
  const list = takeoverList(); const a = list[list.length - 1];
  document.body.classList.toggle('alarm', !!a);
  if (!a) { el.hidden = true; el.innerHTML = ''; return; }
  const help = !!HELP_TYPES[a.type]; const urgent = !help || HELP_TYPES[a.type].urgent;
  const person = Crew.members().find((m) => m.id === a.aboutId || m.id === a.fromId);
  const al = person && person.med ? Medical.allergyNames(person.med) : [];
  const key = a.id; if (el.dataset.key === key && !el.hidden) { const t = $('#to-ago'); if (t) t.textContent = timeAgo(a.createdAt); return; }
  el.dataset.key = key; el.hidden = false;
  el.className = urgent ? 'urgent' : 'assist';
  el.innerHTML = `<div class="to-box" role="alertdialog" aria-modal="true" aria-labelledby="to-title" aria-describedby="to-desc">
    <span class="to-ic">${icon('siren')}</span>
    <p class="to-k">${urgent ? 'Crewmate needs help now' : 'A crewmate asks for a hand'} · <span id="to-ago">${timeAgo(a.createdAt)}</span></p>
    <h1 id="to-title">${help ? `${esc(a.fromName)} ${urgent ? 'needs help' : 'could use a hand'}` : `Emergency: ${esc(a.aboutName)}`}</h1>
    <p id="to-desc" class="to-what">${help ? esc(a.note || alertName(a.type)) : `${esc(alertName(a.type))} · raised by ${esc(a.fromName)}${a.note ? ` — “${esc(a.note)}”` : ''}`}</p>
    ${al.length ? `<p class="to-alg"><b>Allergies:</b> ${al.map((x) => `<span class="alg-chip">${esc(x)}</span>`).join(' ')}</p>` : ''}
    <div class="to-acts"><button class="btn to-go" data-act="takego" data-id="${esc(a.id)}">${icon('siren')}${help ? 'Go help' : 'Open protocol'}</button>
      <button class="btn to-seen" data-act="takeack" data-id="${esc(a.id)}">I’ve seen it</button></div>
    ${list.length > 1 ? `<p class="to-more">+${list.length - 1} more call${list.length > 2 ? 's' : ''} for help</p>` : ''}
    <p class="to-note">Any task you were doing is kept — you can go back to it after.</p>
  </div>`;
  const go = el.querySelector('.to-go'); if (go) go.focus();
}

/* An incoming emergency must be noticed: banner, sound, vibration and a notification. */
let lastAlertErr = '';
function announceAlerts(list) {
  if (!list.length) return;
  const a = list[list.length - 1];
  const text = HELP_TYPES[a.type] ? `${a.fromName} is asking for help` : `Emergency: ${a.aboutName} — ${alertName(a.type)}`;
  toast(text);
  try { if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 300]); } catch (e) { /* not supported */ }
  try {
    const C = window.AudioContext || window.webkitAudioContext; const ac = new C();
    [0, 0.35, 0.7].forEach((t) => { const o = ac.createOscillator(); const g = ac.createGain(); o.frequency.value = 880; o.connect(g); g.connect(ac.destination);
      g.gain.setValueAtTime(0.0001, ac.currentTime + t); g.gain.exponentialRampToValueAtTime(0.3, ac.currentTime + t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + t + 0.25);
      o.start(ac.currentTime + t); o.stop(ac.currentTime + t + 0.3); });
  } catch (e) { /* audio blocked until the person has tapped the page */ }
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      const opts = { body: a.note || 'Open NovaCare', tag: 'alert-' + a.id, requireInteraction: true };
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) navigator.serviceWorker.getRegistration().then((reg) => (reg ? reg.showNotification('NovaCare · ' + text, opts) : new Notification('NovaCare · ' + text, opts)));
      else new Notification('NovaCare · ' + text, opts);
    }
  } catch (e) { /* notifications not available */ }
}
Sync.onChange((st, what, extra) => {
  if (!Auth.user()) return;
  if (what === 'alerts') {
    $('#banner').innerHTML = bannerHtml(); renderNav(); lastAlertErr = ''; renderTakeover();
    announceAlerts(extra || []);
    if (!ui.modal) { Crew.refresh(true); render(); } else if (ui.modal.type === 'emergency') renderModal();
    return;
  }
  if (what === 'alertsresolved') { // someone else resolved it: every screen shows that it is over
    const a = extra[extra.length - 1]; const ids = extra.map((x) => x.id);
    toast(HELP_TYPES[a.type] ? `✓ Help request from ${a.fromName} resolved` : `✓ Emergency resolved: ${a.aboutName} — ${alertName(a.type)}`);
    const m = ui.modal;
    if (m && m.type === 'emergency' && (ids.includes(m.alertId) || ids.includes(m.fromHelp))) { ui.modal = null; }
    $('#banner').innerHTML = bannerHtml(); renderNav(); renderTakeover();
    if (!ui.modal) { Crew.refresh(true); render(); }
    return;
  }
  if (what === 'alertsent') { toast(HELP_TYPES[extra.type] ? '✓ Help request delivered to your crew' : '✓ Emergency delivered — your crew has been alerted'); $('#banner').innerHTML = bannerHtml(); return; }
  if (what === 'alerterror') {
    if (extra !== lastAlertErr) { lastAlertErr = extra; toast('Alert not delivered yet — retrying. ' + extra); }
    $('#banner').innerHTML = bannerHtml(); return;
  }
  if ((what === 'pulled' || what === 'crew') && !ui.modal) { Crew.refresh(true); render(); } else renderTop();
});
const refreshConn = () => { const c = $('.conn'); if (!Auth.user() && c) c.outerHTML = connNote(ui.auth === 'register'); };
const netChange = () => { refreshConn(); if (Auth.user()) renderTop(); };
window.addEventListener('online', netChange);
window.addEventListener('offline', netChange);

// reminders: check every minute; a tapped notification opens its reminder
setInterval(() => Reminders.tick(), 60000);
if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', (e) => { if (e.data && e.data.reminder && Auth.user()) Reminders.run(e.data.reminder); });
const remParam = new URLSearchParams(location.search).get('reminder'); if (remParam) setTimeout(() => { if (Auth.user()) Reminders.run(remParam); }, 1500);
I18N.onChange(() => { lastPage = ''; render(); }); // a new language: draw everything again (dates, menus)
LocalLLM.ping(); // is the ship terminal's local model running? (never on the public website)
if (Auth.restore()) { if (Auth.user().guest) Auth.guest(); Engine.load(); setupGuest(); } // a guest from an older version becomes Bruno too
Auth.onRecovery(() => render()); // the reset link was opened: ask for the new password
render();
if (Auth.user()) Sync.run();

// cache the app itself so it opens with no signal (needs http/https, not file://)
// when a new version of the app is published, its worker takes over and the page reloads once to show it
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  const hadWorker = !!navigator.serviceWorker.controller; let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadWorker && !reloaded && !ui.modal) { reloaded = true; location.reload(); } });
  navigator.serviceWorker.register('sw.js').then((r) => r.update()).catch(() => {});
}
