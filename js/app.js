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
  { v: 'lobby', label: 'Lobby', icon: 'home', c: '#2f6bff', desc: 'Your status and a quick look at the mission' },
  { v: 'personal', label: 'Personal', icon: 'user', c: '#f0388a', desc: 'Your health, today\'s routine and status' },
  { v: 'crew', label: 'Crew', icon: 'users', c: '#7c5cff', desc: 'Your crew\'s status and emergency help' },
  { v: 'mission', label: 'Mission', icon: 'rocket', c: '#e8590c', desc: 'Mission progress, switch or join missions' },
  { v: 'analysis', label: 'Analysis', icon: 'bars', c: '#12a594', desc: 'Who is doing well and who needs help' },
];
const PERSONAL = [
  { v: 'overview', label: 'Overview', icon: 'pulse' },
  { v: 'today', label: 'Today', icon: 'checks' },
  { v: 'vitals', label: 'Vitals', icon: 'heart' },
  { v: 'hazards', label: 'Hazards', icon: 'hazard' },
  { v: 'medical', label: 'Medical profile', icon: 'care' },
];
const SUB_ALIAS = { status: 'overview', routine: 'today', vitals: 'vitals', hazards: 'hazards', overview: 'overview', today: 'today', medical: 'medical' };

const LOGO = '<svg class="logo" viewBox="0 0 48 40" aria-hidden="true"><ellipse class="lg-ring" cx="24" cy="21" rx="21" ry="8" transform="rotate(-22 24 21)"/><path class="lg-plus" d="M19 5h10v10h10v10H29v10H19V25H9V15h10z"/><ellipse class="lg-ring" cx="24" cy="21" rx="21" ry="8" transform="rotate(-22 24 21)" pathLength="100" stroke-dasharray="50 50"/></svg>';
const SWOOSH = '<svg class="swoosh" viewBox="0 0 220 44" aria-hidden="true"><defs><linearGradient id="swg" x1="0" x2="1"><stop offset="0" stop-color="#ff4f9a" stop-opacity="0"/><stop offset="1" stop-color="#ff4f9a"/></linearGradient></defs><path d="M4 40C50 14 120 6 196 12" fill="none" stroke="url(#swg)" stroke-width="3" stroke-linecap="round"/><path d="M206 0c1.5 7 3.5 9 10 11-6.5 2-8.5 4-10 11-1.5-7-3.5-9-10-11 6.5-2 8.5-4 10-11z" fill="#ff4f9a"/></svg>';

function renderTop() {
  const env = Engine.env(); const u = Auth.user(); const on = navigator.onLine !== false; const mission = Missions.current();
  $('#top').innerHTML = `
    <div class="brand" role="button" tabindex="0" data-act="view" data-v="lobby" title="Back to the mission lobby">${LOGO}
      <div><b>NovaCare</b><span>${esc(mission.name)}</span></div></div>
    <div class="sysline ${on ? 'on' : 'off'}" role="status"><i></i>${on ? 'System Online' : 'Offline mode'}</div>
    <div class="top-r" id="topr">
      <button class="chip hide-s" data-act="settings" title="Environment and mission settings">${icon('orbit')}${env.short}</button>
      ${syncChip()}
      <button class="chip icon-only" data-act="theme" title="Switch to ${document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'} mode" aria-label="Switch to ${document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'} mode">${icon(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon')}</button>
      ${Missions.has() ? `<div class="md" title="Mission day">MD <b class="num">${state.md}</b><button data-act="nextday" title="Advance to the next mission day (demo control)" aria-label="Advance to next mission day">${icon('next')}</button></div>` : ''}
      <div class="user-chip" title="${u.guest ? 'Guest — data stays on this device' : `Signed in as ${esc(u.id)}`}"><span class="avatar" aria-hidden="true">${esc(initials(state.name || u.name))}</span><span class="uname">${esc(state.name || u.name)}</span><button data-act="logout" title="Sign out" aria-label="Sign out">${icon('logout')}</button></div>
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
  const lead = locked ? 'Welcome aboard. Create your own mission or join one to start tracking your health with a crew.'
    : has ? `Mission day <b>${state.md}</b> of ${len} on <b>${esc(cur.name)}</b> · ${esc(ENVIRONMENTS[cur.env].short)}.`
    : 'Your personal space. Log check-ins and explore every section — join or create a mission any time from the Mission tab.';
  const cta = locked
    ? `<button class="btn primary lg" data-act="view" data-v="mission">${icon('rocket')}Choose a mission</button>`
    : `<button class="btn primary lg" data-act="checkin">${icon('plus')}${due ? `Start check-in<span class="btn-note">${due} due</span>` : 'Add info'}</button>
       <button class="btn ghost lg" data-act="ask">${icon('chat')}Questions</button>`;
  const hero = `<section class="card hero lobby-hero">
      <div class="hero-main"><p class="hero-greet">${greeting()}${first ? ', ' + esc(first) : ''}</p>
        <h1 class="hero-title">${SWOOSH}Mission lobby</h1>
        <p class="lobby-lead">${lead}</p>
        <div class="hero-cta">${cta}</div></div>
      <div class="lobby-orb" aria-hidden="true">${missionArt(cur.env)}</div>
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
  const today = `<section class="card today" aria-label="You today">
      <div class="today-score">${ring(me.readiness)}</div>
      <div class="today-main">
        <div class="today-h"><div><h2>You today</h2><p class="muted small">${v.level < 0 ? 'Log a check-in to get your readiness score.' : esc(v.reasons[0] || v.name)}</p></div>
          <button class="btn ghost sm" data-act="view" data-v="personal">My health${icon('next')}</button></div>
        <div class="tv-grid">${[['hr', 'Heart rate'], ['sys', 'Blood pressure'], ['spo2', 'Oxygen (SpO₂)'], ['temp', 'Temperature'], ['sleep', 'Sleep'], ['water', 'Hydration']].map(([id, l]) => vital(id, l)).join('')}</div>
        <div class="today-foot">
          <span class="${due ? 'l1' : 'l0'}"><span class="dot"></span>${due ? `${due} measurement${due > 1 ? 's' : ''} due today` : 'Everything logged today'}</span>
          <span class="${top ? lc(top.level) : 'l0'}"><span class="dot"></span>${top ? esc(top.title) : 'No active concerns'}</span>
          <span class="ln">${icon('zap')}${me.dose.toFixed(1)} mSv this mission</span>
        </div>
      </div></section>`;

  let mission;
  if (has) {
    const verdicts = crew.map((m) => Crew.verdict(m)); const onTrack = verdicts.filter((x) => x.level === 0).length;
    const items = Inventory.items(); const low = items.filter((i) => Inventory.level(i) > 0).length;
    const frac = clamp(state.md / len, 0, 1);
    mission = `<section class="card lobby-mission">
        <div><span class="kicker">${esc(ENVIRONMENTS[cur.env].short)}</span><h2>${esc(cur.name)}</h2></div>
        <div class="lm-prog"><div class="lm-prog-t"><span>Mission day <b class="num">${state.md}</b> of ${len}</span><span class="muted">${Math.round(frac * 100)}%</span></div>
          <div class="track" role="progressbar" aria-valuemin="1" aria-valuemax="${len}" aria-valuenow="${state.md}" aria-label="Mission progress"><i style="width:${frac * 100}%"></i></div></div>
        <ul class="lm-list">
          <li>${icon('users')}<span>Crew on track</span><b class="num">${onTrack}/${crew.length}</b></li>
          <li class="${alerts ? 'hot' : ''}">${icon('siren')}<span>Active emergencies</span><b class="num">${alerts}</b></li>
          <li class="${low ? 'warn' : ''}">${icon('box')}<span>Supplies low or out</span><b class="num">${low}</b></li>
        </ul>
        <div class="lm-acts"><button class="btn ghost sm" data-act="missiontab" data-v="missions">Switch</button><button class="btn primary sm" data-act="missiontab" data-v="status">Mission status${icon('next')}</button></div>
      </section>`;
  } else {
    mission = `<section class="card lobby-mission">
        <div><span class="kicker">Guest</span><h2>No mission yet</h2></div>
        <p class="muted small">Use every section on your own, or join a mission to share your status with a crew on this device.</p>
        <div class="lm-acts"><button class="btn primary sm" data-act="missiontab" data-v="missions">${icon('rocket')}Browse missions</button></div></section>`;
  }
  return hero + `<div class="lobby-grid">${today}${mission}</div>`;
}

/* ---------- Mission tab: "Status" and "Missions" (switch, create, join, browse) ---------- */
function missionTabs() {
  if (!Missions.has()) return '';
  const on = ui.missionTab === 'missions' ? 'missions' : 'status';
  const tabs = [['status', 'Mission status', 'bars'], ['missions', 'Missions', 'layers']];
  return `<nav class="subnav" aria-label="Mission sections"><span class="ind" aria-hidden="true"></span>${tabs.map(([v, l, ic]) => `<button class="${on === v ? 'on' : ''}" data-act="missiontab" data-v="${v}" ${on === v ? 'aria-current="page"' : ''}>${icon(ic)}${l}</button>`).join('')}</nav>`;
}
function missionPage() { return ui.missionTab === 'missions' || !Missions.has() ? viewMissions() : viewMission(); }

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
        ${m.active ? '' : `<button class="btn quiet sm" data-act="leavemission" data-code="${esc(m.code)}">Leave</button>`}</footer></article>`; }).join('');
  const adds = `<button class="mcard add" data-act="newmission"><span class="add-ic">${icon('plus')}</span><b>Create a mission</b><small>Name it, pick where it happens and get a code to share with your crew.</small></button>
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
  const sel = SYS[ui.sys] ? ui.sys : null; const sys = sel ? SYS[sel] : null;
  const item = (act, v, ic, label) => `<button class="hl" data-act="${act}" ${v ? `data-v="${v}"` : ''}>${icon(ic)}<span>${label}</span>${icon('next', 'hl-go')}</button>`;
  return `<div class="ov">
    <div class="ov-col">
      <section class="card ov-id">${crewPortrait(state.name || u.name)}
        <div><h2>${esc(state.name || u.name)}</h2><p>${icon('users')}${esc(u.role)}</p><p>${icon('rocket')}${esc(mission.name)}</p><p>${icon('clock')}Mission day ${state.md}</p></div></section>
      <section class="card ov-kv"><h2>Key Vitals</h2>
        <button class="ov-hr ${lc(hr.level)}" data-act="detail" data-id="hr" aria-label="Heart rate, open trend"><span class="ov-heart">${icon('heart')}</span>
          <span class="ov-n"><b class="num" ${hr.v == null ? '' : `data-count="${hr.v}"`}>${hr.v == null ? '—' : hr.v}</b><small>bpm</small></span>
          <svg class="ecg" viewBox="0 0 170 60" aria-hidden="true"><path d="M0 34h38l8-8 8 8h10l7-26 9 48 8-30 6 8h12l7-14 8 14h41"/></svg></button></section>
    </div>
    <section class="card ov-health"><h2>Health</h2>
      ${item('checkin', '', 'plus', 'Add info')}${item('ask', '', 'chat', 'Questions')}${item('sub', 'vitals', 'pulse', 'Vitals')}${item('sub', 'today', 'calendar', 'Routine')}${item('sub', 'hazards', 'hazard', 'Hazards')}${item('sub', 'medical', 'care', 'Medical profile')}${item('bodystatus', '', 'layers', 'Body Status')}</section>
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
      <p class="muted small">${r.total} studies in NASA’s Open Science Data Repository${r.humans ? `, ${r.humans} with human data` : ''}. Astronaut and in-vivo studies first.</p></div></div>
    <ul class="osdr-list">${r.studies.map((st) => `<li><a href="${esc(st.url)}" target="_blank" rel="noopener"><span class="osdr-id">${esc(st.id)}</span><b>${esc(st.title)}</b></a>
      <div class="osdr-meta">${meta(st)}</div>${st.about ? `<p class="muted small">${esc(st.about)}</p>` : ''}</li>`).join('')}</ul>
    <p class="muted small">Source: NASA OSDR Biological Data API · snapshot ${esc(OSDR.snapshot)} · available offline. Opening a study needs a link to Earth.</p>
  </section>`;
}

function viewPersonal() {
  const due = Engine.dueList().length;
  const body = { overview: viewStatus, today: viewRoutine, vitals: viewVitals, hazards: viewHazards, medical: viewMedical }[ui.sub]();
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

function greeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }

function viewStatus() {
  const env = Engine.env(); const score = Engine.readiness(); const due = Engine.dueList(); const adv = Engine.advisories();
  const dose = Engine.cumulativeDose();
  const need = adv.filter((a) => a.level >= 2).length, watch = adv.filter((a) => a.level === 1).length;
  const summary = score == null ? 'Log your first check-in to see how you are doing.'
    : need ? `${need} ${need > 1 ? 'things need' : 'thing needs'} your attention today.`
    : watch ? `You’re on track, with ${watch} small ${watch > 1 ? 'things' : 'thing'} to watch.` : 'You’re on track. Nothing needs action today.';
  const first = (state.name || Auth.user().name || '').split(' ')[0];
  return overviewTop() + `<section class="card hero">
      <div class="hero-main">
        <p class="hero-greet">${greeting()}${first ? ', ' + esc(first) : ''}</p>
        <h2 class="hero-title">${summary}</h2>
        <div class="hero-cta">${due.length
          ? `<button class="btn primary lg" data-act="checkin">${icon('plus')}Start check-in <span class="btn-note">${due.length} due</span></button>`
          : `<div class="alldone">${icon('check')}All measurements are up to date</div>`}</div>
        <dl class="hero-facts">
          <div><dt>Location</dt><dd>${env.short}</dd></div>
          <div><dt>Ground link</dt><dd>${env.comm.split(/[,(]/)[0]}</dd></div>
          <div><dt>Radiation</dt><dd><span class="num">${dose.toFixed(0)}</span> of ${CAREER_DOSE_LIMIT} mSv<span class="meter"><i style="width:${clamp((dose / CAREER_DOSE_LIMIT) * 100, 1, 100)}%"></i></span></dd></div>
        </dl>
      </div>
      <div class="hero-ring">${ring(score)}</div>
    </section>`;
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
          <span class="t-side">${t.auto ? (ok ? 'Logged' : 'Log now ›') : (ok ? 'Done' : 'Mark done')}<em>+15 XP</em></span></button></li>`;
      }).join('')}</ul>
      <p class="muted small">Tasks with “Log now” complete themselves when you record the measurement. A full check-in (vitals + mind) earns a 50 XP bonus and extends your streak.</p>
    </section>
    <div class="col">
      <section class="card rank">
        <h2>${g.rank.name}</h2><p class="sub">Crew rank</p>
        <div class="meter big xp"><i style="width:${g.pct * 100}%"></i></div>
        <p class="muted">${g.xp.toLocaleString()} XP${g.next ? ` · ${(g.next.xp - g.xp).toLocaleString()} to ${g.next.name}` : ' · top rank'}</p>
        <div class="stats"><div><b>${g.streak}</b><span>day streak</span></div><div><b>+${g.todayXp}</b><span>XP today</span></div><div><b>${g.badges.filter((b) => b.got).length}/${g.badges.length}</b><span>patches</span></div></div>
      </section>
      <section class="card">
        <div class="card-h"><h2>Mission patches</h2></div>
        <div class="badges">${g.badges.map((b) => `<div class="badge ${b.got ? 'got' : ''}" title="${esc(b.desc)}"><i>${b.icon}</i><b>${b.name}</b><small>${b.desc}</small></div>`).join('')}</div>
      </section>
      <section class="card">
        <div class="card-h"><h2>Last 14 days</h2><span class="muted">routine completed</span></div>
        <div class="strip">${strip}</div>
      </section>
    </div>
  </div>`;
}

function viewHazards() {
  const env = Engine.env();
  return `<section class="card envcard">
      <div class="card-h"><div><h2>${env.name}</h2><p class="sub">Your environment</p></div><button class="btn ghost" data-act="settings">Change</button></div>
      <dl class="facts wide">
        <div><dt>Gravity</dt><dd>${env.gravity}</dd></div>
        <div><dt>Typical radiation</dt><dd>${env.rad} mSv per day</dd></div>
        <div><dt>Link to ground</dt><dd>${env.comm}</dd></div>
        <div><dt>Evacuation</dt><dd>${env.evac}</dd></div>
        <div><dt>Exercise prescription</dt><dd>${env.exTarget} min per day</dd></div>
      </dl>
      <p class="muted">${env.note}</p>
    </section>
    <div class="card-h pad"><div><h2>The five hazards of human spaceflight</h2><p class="muted">NASA's Human Research Program groups the risks to your body and mind into five hazards. Every measurement in NOVACARE exists to catch one of them early.</p></div></div>
    <div class="grid-haz">${HAZARDS.map((h) => `<article class="card haz">
      <div class="haz-h"><i>${h.letter}</i><h3>${h.name}</h3></div>
      <p>${h.text}</p>
      <p><b>What you can do.</b> ${h.act}</p>
      <details class="about"><summary>What it can cause</summary><p>${h.risks}</p></details>
      <p class="hz">NOVACARE tracks: ${h.tracks.map((id) => { const st = Engine.status(id); return `<button class="tag link ${lc(st.level)}" data-act="detail" data-id="${id}">${st.level < 0 ? '○' : LEVELS[st.level].sym} ${IND[id].short}</button>`; }).join(' ')}</p>
    </article>`).join('')}</div>
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
    <header><div><p class="kicker">${m.guided ? 'Daily check-in' : 'Log reading'}${n > 1 ? ` · ${m.i + 1} of ${n}` : ''}</p><h2>${ASK[ids[0]] || ind.name}</h2></div>
      <button class="x" data-act="close" aria-label="Close">${icon('x')}</button></header>
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
  const g = Engine.game(); const adv = Engine.advisories(); const score = Engine.readiness();
  const top = adv.filter((a) => a.level >= 2).length;
  return `<div class="sheet narrow" role="dialog" aria-modal="true" aria-label="Check-in complete">
    <header><div><h2>Check-in complete</h2><p class="sub">MD ${state.md}</p></div><button class="x" data-act="close" aria-label="Close">${icon('x')}</button></header>
    <div class="sheet-b one">
      <div class="done-top">${ring(score)}</div>
      <div class="stats"><div><b>${m.count}</b><span>readings saved</span></div><div><b>+${g.todayXp}</b><span>XP today</span></div><div><b>${g.streak}</b><span>day streak</span></div></div>
      <p class="center">${adv.length ? `${adv.length} item${adv.length > 1 ? 's' : ''} to review${top ? `, ${top} to share with your crew` : ''}.` : 'Everything is in range. Nice work.'}</p>
    </div>
    <footer><button class="btn primary" data-act="gostatus">${adv.length ? 'See what to do' : 'Back to status'}</button></footer>
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
      <div class="seg">${rb(7, '7 days')}${rb(14, '14 days')}${rb(30, '30 days')}${rb(0, 'All')}</div>
      ${chart(ind, ui.range)}
      ${adv.map((a) => advisoryHtml(a, true, true)).join('')}
      ${evidenceHtml(id, false)}
      <div class="d-cols">
        <div><h3>How to measure</h3><ol>${ind.how.map((x) => `<li>${x}</li>`).join('')}</ol></div>
        <div><h3>Why it matters</h3><p>${ind.why}</p><h3>In space</h3><p>${ind.space}</p></div>
        <div><h3>Recent readings</h3>${s.length ? `<table>${s.map((p) => { const l = Engine.classify(ind, p.v).level; return `<tr><td>MD ${p.md}</td><td>${Engine.fmt(ind, p.v)} ${ind.unit} ${Engine.label(ind, p.v)}</td><td class="${lc(l)}">${LEVELS[l].sym} ${LEVELS[l].name}</td></tr>`; }).join('')}</table>` : '<p class="muted">None yet.</p>'}</div>
      </div>
    </div></div>`;
}

function settingsHtml() {
  return `<div class="sheet narrow" role="dialog" aria-modal="true" aria-label="Settings">
    <header><div><h2>Mission profile</h2></div><button class="x" data-act="close" aria-label="Close">${icon('x')}</button></header>
    <div class="sheet-b one">
      <div class="field"><label for="name">Crew member name</label><input id="name" class="text" type="text" maxlength="40" value="${esc(state.name)}" placeholder="Your name"></div>
      ${Missions.has() ? `<div class="field"><label>Mission</label>
        <div class="field-row">
          <div class="field"><label for="set-mname" class="sm">Mission name</label><input id="set-mname" class="text" type="text" maxlength="40" value="${esc(Missions.current().name)}"></div>
          <div class="field"><label class="sm">Mission code</label><button class="codechip lg" data-act="copycode" data-code="${esc(Auth.user().crew)}" title="Copy the code">${icon('copy')}<span>${esc(Auth.user().crew)}</span></button></div>
          <div class="field"><label for="set-role" class="sm">Your role</label><input id="set-role" class="text" type="text" value="${esc(Auth.user().role)}" readonly aria-readonly="true" title="Chosen when you created your account — it cannot be changed"></div>
          <div class="field"><label for="set-len" class="sm">Planned length (days)</label><input id="set-len" class="text num" type="number" min="7" max="1200" value="${missionLength()}"></div>
        </div>
        <label class="remember"><input type="checkbox" id="set-sim" ${state.showSim !== false ? 'checked' : ''}> Show the simulated demo crew (3 synthetic astronauts, labelled “Simulated”)</label>
        <p class="muted small">Crewmates who join with the same mission code share their status with each other. Create, join or switch missions from the Lobby.</p></div>` : `<div class="field"><label>Mission</label><p class="muted small">You are not on a mission yet. Create or join one from the Lobby.</p><div class="field-row"><div class="field"><label for="set-role" class="sm">Your role</label><input id="set-role" class="text" type="text" value="${esc(Auth.user().role)}" readonly aria-readonly="true" title="Chosen when you created your account — it cannot be changed"></div></div></div>`}
      <div class="field"><label>Where are you?</label>
        <div class="envs">${Object.entries(ENVIRONMENTS).map(([k, e]) => `<button class="${state.env === k ? 'on' : ''}" data-act="env" data-id="${k}"><b>${e.name}</b><small>${e.gravity} · ${e.rad} mSv/day · ${e.comm}</small></button>`).join('')}</div>
        <p class="muted small">The environment changes radiation thresholds, the exercise prescription and how NOVACARE tells you to escalate.</p></div>
      <div class="field"><label>Share with your flight surgeon</label>
        <div class="btnrow"><button class="btn ghost" data-act="report">Download health report</button><button class="btn ghost" data-act="export">Export raw data (JSON)</button></div></div>
      <div class="field"><label>Mission data</label>
        <div class="btnrow"><button class="btn ghost" data-act="demo">Load demo mission (33 days)</button><button class="btn ghost danger" data-act="reset">Start a new mission</button></div>
        <p class="muted small">Data stays on this device (browser storage). NOVACARE works fully offline — no link to Earth needed.</p></div>
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
  return `<section class="auth">
    <div class="auth-photo" aria-hidden="true"><img src="img/station.jpg" alt=""></div>
    <div class="auth-main">
      <div class="auth-title"><h1>${SWOOSH}NovaCare</h1><p>Health Monitoring System</p></div>
      <div class="card auth-card">
        <div class="auth-tabs" role="tablist" aria-label="Account">
          <button role="tab" aria-selected="${!reg}" class="${reg ? '' : 'on'}" data-act="authtab" data-v="login">Sign in</button>
          <button role="tab" aria-selected="${reg}" class="${reg ? 'on' : ''}" data-act="authtab" data-v="register">Create account</button>
        </div>
        <form id="auth-form" class="fields" novalidate>
          ${reg ? f('name', 'Full name', 'text', 'user', 'autocomplete="name" maxlength="40" placeholder="Full name"') : ''}
          ${f('email', 'Email', 'email', reg ? 'mail' : 'user', `autocomplete="username" maxlength="80" autocapitalize="off" spellcheck="false" placeholder="${reg ? 'Email' : 'User (email)'}"`)}
          ${reg ? `<div class="field"><label for="au-role" class="vh">Role</label><div class="inp">${icon('users')}<select id="au-role" name="role" aria-label="Role">${ROLES.map((r, i) => `<option ${i === 2 ? 'selected' : ''}>${r}</option>`).join('')}</select></div></div>
            <p class="hint">Pick your role carefully: it is fixed once your account is created. After signing up you create a mission or join one from the lobby.</p>` : ''}
          ${f('password', 'Password', 'password', 'lock', `autocomplete="${reg ? 'new-password' : 'current-password'}" placeholder="${reg ? 'Password (at least 6 characters)' : 'Password'}"`)}
          ${reg ? f('confirm', 'Confirm password', 'password', 'lock', 'autocomplete="new-password" placeholder="Confirm password"') : `<label class="remember"><input type="checkbox" name="remember" checked> Keep me signed in on this device</label>`}
          <p class="auth-err" role="alert">${esc(ui.authErr)}</p>
          <button class="btn primary big" type="submit" ${ui.busy ? 'disabled' : ''}>${reg ? 'Create account' : 'Sign In'}</button>
        </form>
        <div class="auth-or"><span>or</span></div>
        <button type="button" class="btn ghost big guest-btn" data-act="guest">${icon('user')}Continue as guest</button>
        <p class="muted small center">Try NovaCare without an account. Guest data stays on this device and is not shared with a crew.</p>
        ${connNote(reg)}
      </div>
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
  top.innerHTML = `<div class="brand">${LOGO}<div><b>NovaCare</b></div></div>`;
  $('#app').innerHTML = authHtml();
  ui.modal = null; renderModal();
  const first = $('#auth-form input'); if (first) first.focus();
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
  if (!Auth.user()) { lastPage = ''; renderAuth(); return; }
  document.body.classList.remove('signed-out');
  Engine.today(); Crew.refresh();
  if (Missions.locked() && !['lobby', 'mission'].includes(ui.view)) ui.view = 'lobby'; // pick a mission first (guests skip this)
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
  renderModal();
}

function renderModal() {
  const el = $('#modal'); const m = ui.modal;
  if (!m) { el.hidden = true; el.innerHTML = ''; el.dataset.key = ''; el.classList.remove('out'); document.body.classList.remove('lock'); return; }
  el.hidden = false; document.body.classList.add('lock');
  el.innerHTML = m.type === 'measure' ? measureHtml(m) : m.type === 'done' ? doneHtml(m) : m.type === 'detail' ? detailHtml(m.id) : m.type === 'reauth' ? reauthHtml() : m.type === 'mate' ? mateHtml(m.id) : m.type === 'emergency' ? emergencyHtml(m)
    : m.type === 'ask' ? askHtml(m) : m.type === 'newmission' ? missionNewHtml(m) : m.type === 'joinmission' ? missionJoinHtml(m) : m.type === 'created' ? missionCreatedHtml(m) : m.type === 'invitem' ? invItemHtml(m) : settingsHtml();
  const key = m.type + (m.step || '') + (m.i ?? '');
  el.classList.toggle('fresh', el.dataset.key !== key); el.dataset.key = key;
  tickTimer();
  if (m.type === 'reauth') { const i = $('#ra-pw'); if (i) i.focus(); }
  if (m.type === 'ask') { const c = $('#chat'); if (c) c.scrollTop = c.scrollHeight; const i = $('#ask-in'); if (i && !m.listening) i.focus(); }
  if (['newmission', 'joinmission', 'invitem'].includes(m.type) && el.classList.contains('fresh')) { const i = $('#modal input.text'); if (i) i.focus(); }
  if (m.type === 'measure') { syncSave(); const inp = $('#modal input[data-in]'); if (inp) inp.focus(); }
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

function startCheckin() {
  const day = Engine.today();
  let steps = CHECKIN_GROUPS.filter((g) => g.some((id) => Engine.status(id).due));
  if (!steps.length) steps = CHECKIN_GROUPS.filter((g) => g.some((id) => day.vals[id] == null));
  openMeasure(steps, true);
}

function stepValid(m) {
  return m.steps[m.i].every((id) => { const v = m.draft[id]; return v != null && fin(v) && v >= IND[id].min && v <= IND[id].max; });
}
function syncSave() { const b = $('#save'); if (b && ui.modal) b.disabled = !stepValid(ui.modal); }

function advanceMeasure(m) {
  if (m.i < m.steps.length - 1) { m.i++; renderModal(); return; }
  if (m.guided) { ui.modal = { type: 'done', count: m.count }; render(); }
  else { ui.modal = null; render(); if (m.count) toast(`Saved · +${m.count * 10} XP`); }
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

const actions = {
  alladv() { ui.allAdv = !ui.allAdv; render(); },
  allfind() { ui.allFind = !ui.allFind; render(); },
  theme() { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = t; try { localStorage.setItem('novacare.theme', t); } catch (e) { /* ignore */ } renderTop(); },
  sub(d) { if (ui.view === 'personal' && ui.sub === d.v) return; navigate(() => { ui.view = 'personal'; ui.sub = d.v; ui.modal = null; render(); }); },
  mate(d) { ui.modal = { type: 'mate', id: d.id }; renderModal(); },
  emergency(d) { const m = Crew.members().find((x) => x.id === d.id); ui.modal = { type: 'emergency', step: 'pick', id: d.id, name: m ? m.name : '', done: {} }; renderModal(); },
  emgtype(d) {
    const m = ui.modal; const mate = Crew.members().find((x) => x.id === m.id) || { id: m.id, name: m.name };
    if (m.alertId) { // switching protocol keeps the same alert
      Crew.writeAlerts(Crew.alerts().map((a) => a.id === m.alertId ? { ...a, type: d.v, pending: Auth.cloud() } : a)); Sync.run();
    } else m.alertId = Crew.raise(mate, d.v, m.text || '').id;
    m.step = 'protocol'; m.em = d.v; m.done = {};
    render(); toast(Auth.cloud() && Sync.status() !== 'synced' ? 'Emergency saved — crew alerted when the link is back' : 'Crew alerted');
  },
  emgstep(d) { const m = ui.modal; m.done[d.k] = !m.done[d.k]; renderModal(); },
  emgswitch() { ui.modal.step = 'pick'; renderModal(); },
  emgresolve() { if (ui.modal.alertId) Crew.resolve(ui.modal.alertId); ui.modal = null; render(); toast('Emergency marked resolved'); },
  emgopen(d) { const a = Crew.alerts().find((x) => x.id === d.id); if (!a) return; ui.modal = { type: 'emergency', step: 'protocol', id: a.aboutId, name: a.aboutName, alertId: a.id, em: a.type, done: {} }; renderModal(); },
  emgdone(d) { if (!confirm('Mark this emergency as resolved for the whole crew?')) return; Crew.resolve(d.id); render(); toast('Emergency marked resolved'); },
  togglesim() { state.showSim = true; Engine.save(); Crew.refresh(true); render(); },
  mreport() { download(`novacare-mission-${Auth.user().crew}-MD${state.md}.txt`, missionReport(), 'text/plain'); },
  authtab(d) { ui.auth = d.v; ui.authErr = ''; renderAuth(); },
  guest() {
    Auth.guest(); Engine.load(); ui.view = 'lobby'; ui.sub = 'overview'; ui.sys = null; ui.crewTab = 'mates';
    render(); window.scrollTo(0, 0); Sync.run(); toast('Exploring as a guest — data stays on this device');
  },
  missiontab(d) { navigate(() => { ui.view = 'mission'; ui.missionTab = d.v; ui.modal = null; render(); }); },
  ask() { ui.modal = { type: 'ask', chat: [], speak: false }; renderModal(); },
  askq(d) { askNow(d.q); },
  emgq(d) { emgAskNow(d.q); },
  mic(d, el) {
    if (Voice.listening()) { Voice.stop(); return; }
    const input = $('#' + d.target); if (!input) return;
    el.classList.add('on'); input.placeholder = 'Listening…';
    const ok = Voice.listen((text) => {
      input.value = text;
      if (d.target === 'ask-in') askNow(text); else if (d.target === 'emg-ask-in') emgAskNow(text); else if (d.target === 'emg-text') describeNow(text);
    }, () => { el.classList.remove('on'); });
    if (!ok) { el.classList.remove('on'); toast('Voice input is not available in this browser'); }
  },
  medkit() {
    const r = Inventory.importRows(MED_KIT.map(([name, cat, qty, unit, min]) => ({ name, cat, qty, unit, min })));
    renderModal(); toast(`${r.added} medical items added to the ship inventory${r.updated ? `, ${r.updated} updated` : ''}`);
  },
  joindir(d) {
    const m = Missions.directory().find((x) => x.code === d.code);
    try { Missions.join(d.code, m); ui.sys = null; navigate(render); toast(`You joined ${m && m.name ? m.name : 'mission ' + d.code}`); }
    catch (e) { toast(e.message); }
  },
  syncinfo() {
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
    if (!confirm(`Leave ${m.name}? Your readings for that mission are removed from this account.`)) return;
    Missions.leave(d.code); render(); toast(`You left ${m.name}`);
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
    const el = $('#modal'); if (!ui.modal || el.classList.contains('out')) return;
    if (!reduceMotion()) { el.classList.add('out'); setTimeout(() => actions.close2(), 160); return; }
    actions.close2();
  },
  close2() { const m = ui.modal; ui.modal = null; $('#modal').classList.remove('out'); render(); if (m && m.type === 'measure' && m.count) toast(`${m.count} reading${m.count > 1 ? 's' : ''} saved`); },
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
  save() {
    const m = ui.modal; if (!stepValid(m)) return;
    const day = Engine.today();
    m.steps[m.i].forEach((id) => { day.vals[id] = +(+m.draft[id]).toFixed(IND[id].dec); m.count++; });
    Engine.save(); advanceMeasure(m);
  },
  skip() { advanceMeasure(ui.modal); },
  task(d) {
    const t = TASKS.find((x) => x.id === d.id); const day = Engine.today();
    if (t.auto) { openMeasure(CHECKIN_GROUPS.filter((g) => g.some((id) => t.ids.includes(id))), false); return; }
    day.tasks[t.id] = !day.tasks[t.id]; Engine.save(); render();
    if (day.tasks[t.id]) toast(`${t.label} done · +15 XP`);
  },
  report() { download(`novacare-report-MD${state.md}.txt`, Engine.report(), 'text/plain'); },
  export() { download(`novacare-data-MD${state.md}.json`, JSON.stringify(state, null, 2), 'application/json'); },
  demo() { if (confirm('Replace current data with the 33-day demo mission?')) { state = keepAccount(Engine.demo()); Engine.save(); ui.sys = null; ui.modal = null; render(); toast('Demo mission loaded'); } },
  reset() { if (confirm('Erase all readings and start a new mission at day 1?')) { const e = state.env; state = keepAccount(Engine.fresh()); state.env = e; Engine.save(); ui.sys = null; ui.modal = null; render(); toast('New mission started — log your first check-in'); } },
};

/* Loading the demo or restarting replaces the readings, never the person's missions, profile or name. */
function keepAccount(next) {
  ['missions', 'archive', 'profile', 'showSim', 'missionName', 'missionDays'].forEach((k) => { if (state && state[k] !== undefined) next[k] = state[k]; });
  if (state && state.name) next.name = state.name;
  return next;
}

/* ---------- Questions and emergency help ---------- */
function askNow(q) {
  q = String(q || '').trim(); const m = ui.modal; if (!q || !m || m.type !== 'ask') return;
  const a = Assistant.answer(q); m.chat = [...(m.chat || []), { q, a }].slice(-20); renderModal();
  if (m.speak && a.say) Voice.speak(a.say);
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
  ev.preventDefault(); ev.stopPropagation();
  actions[el.dataset.act](el.dataset, el);
});
document.addEventListener('submit', (ev) => {
  if (ev.target.id === 'auth-form') { ev.preventDefault(); if (!ui.busy) submitAuth(ev.target); }
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
  if (ev.target.id === 'ask-form') { ev.preventDefault(); askNow(new FormData(ev.target).get('q')); }
  if (ev.target.id === 'emg-ask-form') { ev.preventDefault(); emgAskNow(new FormData(ev.target).get('q')); }
  if (ev.target.id === 'emg-describe') { ev.preventDefault(); describeNow(new FormData(ev.target).get('text')); }
  if (ev.target.id === 'medical-form') {
    ev.preventDefault(); const f = new FormData(ev.target); const lines = (k) => String(f.get(k) || '').split('\n').map((x) => x.trim()).filter(Boolean);
    Medical.save({ blood: f.get('blood'), allergies: f.getAll('alg'), other: f.get('other'), meds: lines('meds'), conditions: lines('conditions'), notes: f.get('notes') });
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
  if (ev.target.id === 'ask-speak' && ui.modal) ui.modal.speak = ev.target.checked;
  if (ev.target.id === 'set-sim') { state.showSim = ev.target.checked; Engine.save(); Crew.refresh(true); render(); }
});

setInterval(() => { if (Auth.user() && !ui.modal && Crew.active().length) $('#banner').innerHTML = bannerHtml(); }, 30000);

Sync.onChange((st, what) => {
  if (!Auth.user()) return;
  if ((what === 'pulled' || what === 'crew') && !ui.modal) { Crew.refresh(true); render(); } else renderTop();
});
const refreshConn = () => { const c = $('.conn'); if (!Auth.user() && c) c.outerHTML = connNote(ui.auth === 'register'); };
const netChange = () => { refreshConn(); if (Auth.user()) renderTop(); };
window.addEventListener('online', netChange);
window.addEventListener('offline', netChange);

if (Auth.restore()) Engine.load();
else if (!Auth.hasUsers()) ui.auth = 'register';
render();
if (Auth.user()) Sync.run();

// cache the app itself so it opens with no signal (needs http/https, not file://)
// when a new version of the app is published, its worker takes over and the page reloads once to show it
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  const hadWorker = !!navigator.serviceWorker.controller; let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadWorker && !reloaded && !ui.modal) { reloaded = true; location.reload(); } });
  navigator.serviceWorker.register('sw.js').then((r) => r.update()).catch(() => {});
}
