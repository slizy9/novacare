/* NOVACARE — missions (create, join by code, switch) and the shared ship inventory. */

/* ---------- missions ----------
   The active mission's data lives at the top level of `state` (env, md, days…), exactly as before.
   Other missions this person belongs to are parked in state.archive[code], so everything still
   saves and syncs as one record. The active mission code is the account's crew code. */
const Missions = (() => {
  const FIELDS = ['env', 'md', 'days', 'missionDays', 'demo', 'missionName', 'startDate', 'log', 'restarts'];
  const code = () => Auth.user().crew;
  const norm = (c) => String(c || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20);
  // start = the mission's first day (a joined mission starts when its creator created it, so the crew shares the same day)
  const blank = (env, len, name, start) => ({ env: env || 'iss', md: 1, days: { 1: { vals: {}, tasks: {} } }, missionDays: len || 180, demo: false, missionName: name || '',
    startDate: Engine.dayKey(start && !isNaN(new Date(start)) ? new Date(start) : new Date()) });

  function ensure() {
    if (!Array.isArray(state.missions)) state.missions = [];
    if (!state.archive || typeof state.archive !== 'object') state.archive = {};
    if (code() && !state.missions.some((m) => m.code === code())) state.missions.unshift({ code: code(), name: state.missionName || '', role: 'member', at: new Date().toISOString() });
  }
  /** Every mission of this person, with the facts a card needs. */
  function list() {
    ensure();
    return state.missions.map((m) => {
      const active = m.code === code(); const d = active ? state : (state.archive[m.code] || blank());
      return { ...m, active, name: m.name || `Mission ${m.code}`, env: ENVIRONMENTS[d.env] ? d.env : 'iss', md: d.md || 1, len: d.missionDays || 180 };
    });
  }
  /** The open mission, or a placeholder while the person has not created or joined one. */
  const current = () => list().find((m) => m.active) || { code: '', name: 'No mission yet', env: ENVIRONMENTS[state.env] ? state.env : 'iss', md: state.md || 1, len: state.missionDays || 180, none: true };
  const has = () => !!code();
  /** A registered account must create or join a mission first. Guests can use everything without one. */
  const locked = () => !has() && !(Auth.user() && Auth.user().guest);
  /** How a page names the open mission ("Mission NOVA-AB12", or the guest's personal space). */
  const label = () => (has() ? `Mission ${code()}` : 'Personal space · no mission');

  function activate(c, init) {
    ensure(); if (c === code()) return;
    const park = {}; FIELDS.forEach((f) => { if (state[f] !== undefined) park[f] = state[f]; });
    if (code()) state.archive[code()] = park; // with no mission open there is nothing to park
    const next = state.archive[c] || init || blank();
    FIELDS.forEach((f) => { delete state[f]; }); Object.assign(state, next); delete state.archive[c];
    Auth.updateProfile({ crew: c });
    Engine.today(); Engine.save(); Crew.refresh(true); Sync.run();
  }
  function newCode() {
    const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let c;
    do { c = 'NOVA-' + Array.from({ length: 4 }, () => abc[Math.floor(Math.random() * abc.length)]).join(''); } while (state.missions.some((m) => m.code === c));
    return c;
  }
  function create({ name, env, len }) {
    ensure();
    const c = newCode(); name = String(name || '').trim().slice(0, 40) || `Mission ${c}`;
    state.missions.push({ code: c, name, role: 'creator', at: new Date().toISOString() });
    activate(c, blank(ENVIRONMENTS[env] ? env : 'iss', clamp(Math.round(+len) || 180, 7, 1200), name));
    loadInventory(); // a new mission starts with its loadout on board
    return c;
  }
  /** Join a mission with the code a crewmate shared, or from the mission directory. Returns { code, existed }. */
  function join(raw, info) {
    ensure(); const c = norm(raw);
    if (c.length < 3) throw new Error('Enter the mission code your crewmate shared (at least 3 characters).');
    const d = info || directory().find((x) => x.code === c) || {};
    const existed = state.missions.some((m) => m.code === c);
    if (!existed) state.missions.push({ code: c, name: d.name || '', role: 'member', at: new Date().toISOString() });
    const show = c === SHOWCASE.code;
    const ep = startOf(c); // a restarted mission starts on its restart day
    activate(c, blank(show ? 'iss' : d.env, show ? SHOWCASE.days : d.mission_days, show ? SHOWCASE.name : d.name, ep ? ep + 'T12:00:00' : show ? SHOWCASE.start + 'T12:00:00' : d.created_at));
    if (show) { const m = state.missions.find((x) => x.code === c); if (m && !m.name) m.name = SHOWCASE.name; }
    return { code: c, existed };
  }

  /* ---------- mission directory: every mission people have created (shared database) ---------- */
  const DIR_KEY = 'novacare.directory';
  let dirAt = 0, dirBusy = false;
  function directory() { try { const a = JSON.parse(localStorage.getItem(DIR_KEY)); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  /** Fetch the directory (at most every 20 s unless forced). Calls onChange when the list changed. */
  async function refreshDirectory(force, onChange) {
    const sb = Auth.client(); if (!sb || dirBusy || (!force && Date.now() - dirAt < 20000)) return;
    dirBusy = true; dirAt = Date.now();
    try {
      const r = await sb.from('mission_directory').select('code, name, env, mission_days, creator_name, created_at').order('created_at', { ascending: false }).limit(200);
      if (r.error) throw r.error;
      const next = JSON.stringify(r.data || []);
      if (next !== localStorage.getItem(DIR_KEY)) { localStorage.setItem(DIR_KEY, next); if (onChange) onChange(); }
    } catch (e) { if (!Auth.isNetErr(e)) console.warn('NOVACARE mission directory (run supabase/setup.sql):', e.message || e); }
    finally { dirBusy = false; }
  }
  function rename(name) { ensure(); const m = state.missions.find((x) => x.code === code()); name = String(name || '').trim().slice(0, 40); if (m) m.name = name; state.missionName = name; Engine.save(); }
  /** Leave a mission. Leaving the open one switches to another mission, or back to no mission.
      The next sync removes the membership and the crew status, so crewmates stop seeing this person. */
  function leave(c) {
    ensure();
    const active = c === code();
    state.missions = state.missions.filter((m) => m.code !== c); delete state.archive[c];
    if (active) {
      const next = state.missions[0];
      if (next) { const data = state.archive[next.code] || blank(); FIELDS.forEach((f) => { delete state[f]; }); Object.assign(state, data); delete state.archive[next.code]; Auth.updateProfile({ crew: next.code }); }
      else { FIELDS.forEach((f) => { delete state[f]; }); Object.assign(state, blank()); Auth.updateProfile({ crew: '' }); }
      Engine.today(); Crew.refresh(true);
    }
    Engine.save(); Sync.run(); return true;
  }
  /* ---------- mission restarts ----------
     The database keeps the day each mission (re)started (table mission_epochs). When it is later than
     this person's mission start, the mission begins again on day 1: everything recorded before is
     archived in `restarts` (kept, synced and exported with the raw data), and the loadout is put on board. */
  const EPOCH_KEY = 'novacare.epochs';
  const epochs = () => { try { return JSON.parse(localStorage.getItem(EPOCH_KEY)) || {}; } catch (e) { return {}; } };
  const startOf = (c) => { const e = epochs()[c]; return e ? Engine.dayKey(new Date(e)) : null; };
  const PER_PERSON = ['updates', 'cases', 'decisions', 'emgLog', 'coach', 'emgOpen'];
  function restartData(d, key, c, extra) {
    const at = new Date().toISOString();
    d.restarts = [...(Array.isArray(d.restarts) ? d.restarts : []), { at, code: c, from: d.startDate || null, to: key, md: d.md, days: d.days, log: d.log, ...(extra || {}) }].slice(-5);
    d.md = 1; d.days = { 1: { vals: {}, tasks: {} } }; d.startDate = key; d.demo = false; delete d.log;
  }
  /** Apply restarts to the open mission and to parked ones. Returns true when something restarted. */
  function applyRestarts() {
    if (!state) return false; ensure(); let any = false;
    const later = (key, d) => key && (!d.startDate || key > d.startDate);
    const c = code(); const k = c && startOf(c);
    if (later(k, state)) {
      const extra = {}; PER_PERSON.forEach((f) => { if (state[f] !== undefined) { extra[f] = state[f]; delete state[f]; } });
      restartData(state, k, c, extra); any = true;
      if (typeof Inventory !== 'undefined') loadInventory(true);
    }
    Object.keys(state.archive || {}).forEach((ac) => { const d = state.archive[ac]; const ak = startOf(ac); if (later(ak, d)) { restartData(d, ak, ac); any = true; } });
    if (any) { Engine.today(); Engine.save(); if (typeof Crew !== 'undefined') Crew.refresh(true); }
    return any;
  }
  /** Fetch the restart days (readable by everyone, guests too), then apply them. */
  let epBusy = false;
  async function syncStarts() {
    const sb = Auth.client(); if (!sb || epBusy || !Auth.user() || navigator.onLine === false) return false;
    epBusy = true;
    try {
      const r = await sb.from('mission_epochs').select('code, started_at'); if (r.error) throw r.error;
      localStorage.setItem(EPOCH_KEY, JSON.stringify(Object.fromEntries((r.data || []).map((x) => [x.code, x.started_at]))));
    } catch (e) { if (!Auth.isNetErr(e)) console.warn('NOVACARE mission restarts (run supabase/setup.sql):', e.message || e); }
    finally { epBusy = false; }
    return applyRestarts();
  }
  /** Put the mission loadout on board once (it is skipped when the crew already has it). */
  function loadInventory(force) {
    if (typeof Inventory === 'undefined' || !code()) return null;
    if (!force && Inventory.items().some((i) => /^Mission loadout/.test(i.note || ''))) return null;
    const crew = typeof Crew !== 'undefined' ? Math.max(2, Crew.members().length) : 4;
    return Inventory.loadout(missionLoadout(crew, state.missionDays || 180), code());
  }
  return { list, current, has, locked, label, activate, create, join, rename, leave, norm, directory, refreshDirectory, syncStarts, applyRestarts, startOf, loadInventory };
})();

/* ---------- ship inventory ----------
   One list per mission code, kept on the device and (when the database is set up) shared with
   everyone on that mission. Removed items stay as tombstones so a removal reaches the crew. */
const INV_CATS = [
  { id: 'medical', name: 'Medical', icon: 'care' },
  { id: 'food', name: 'Food & water', icon: 'drop' },
  { id: 'equipment', name: 'Equipment', icon: 'settings' },
  { id: 'hygiene', name: 'Hygiene', icon: 'shield' },
  { id: 'other', name: 'Other', icon: 'box' },
];
/* What a crew takes on a mission, scaled to crew size and mission length. Prototype estimates based on
   public figures for long-duration station missions (about 1.8 kg of food per person a day, water mostly
   recycled on board, so the stored water is a contingency reserve). `min` is the level that triggers a
   low-stock warning: about two weeks of use, or the safe minimum for equipment. */
function missionLoadout(n, days) {
  const D = Math.max(7, days), up = Math.ceil, wk = up(D / 7);
  const note = (t) => `Mission loadout · ${t}`;
  return [
    // food & water
    { name: 'Meal packs', cat: 'food', qty: 3 * n * D, unit: 'packs', min: 3 * n * 14, note: note('3 per person a day (~1.8 kg)') },
    { name: 'Drinking water (contingency reserve)', cat: 'food', qty: 2 * n * Math.min(D, 30), unit: 'L', min: 2 * n * 7, note: note('daily water comes from recycling') },
    { name: 'Electrolyte drink packets', cat: 'food', qty: up(n * D / 2), unit: 'packets', min: n * 7, note: note('one every other day') },
    { name: 'Coffee and tea packets', cat: 'food', qty: 2 * n * D, unit: 'packets', min: 2 * n * 7, note: note('2 per person a day') },
    { name: 'Vitamin D 1000 IU', cat: 'medical', qty: n * D, unit: 'tablets', min: n * 14, note: note('no sunlight in the cabin') },
    // medical (the standard kit, plus monitoring and exam supplies)
    ...MED_KIT.map(([name, cat, qty, unit, min]) => ({ name, cat, qty: Math.max(qty, up(qty * n / 4)), unit, min, note: note('medical kit') })),
    { name: 'Personal dosimeter', cat: 'medical', qty: n + 2, unit: 'units', min: n, note: note('one per person, worn at all times') },
    { name: 'Thermometer', cat: 'medical', qty: 2, unit: 'units', min: 1, note: note('monitoring') },
    { name: 'Glucose meter test strips', cat: 'medical', qty: up(n * D / 3), unit: 'strips', min: n * 5, note: note('fasting glucose every 3 days') },
    { name: 'Urine test strips', cat: 'medical', qty: n * up(D / 14) * 2, unit: 'strips', min: n * 2, note: note('exam every 2 weeks') },
    { name: 'ECG electrodes', cat: 'medical', qty: n * up(D / 30) * 10 + 20, unit: 'pcs', min: 20, note: note('monthly ECG') },
    { name: 'Ultrasound gel', cat: 'medical', qty: up(D / 60) + 1, unit: 'bottles', min: 1, note: note('eye, heart and kidney scans') },
    // hygiene
    { name: 'Personal hygiene kit', cat: 'hygiene', qty: n, unit: 'kits', min: n, note: note('one per person') },
    { name: 'Toothpaste', cat: 'hygiene', qty: up(n * D / 45), unit: 'tubes', min: n, note: note('a tube lasts ~45 days') },
    { name: 'Rinseless shampoo', cat: 'hygiene', qty: up(n * D / 30), unit: 'bottles', min: n, note: note('a bottle lasts ~30 days') },
    { name: 'Wet wipes', cat: 'hygiene', qty: n * wk, unit: 'packs', min: n * 2, note: note('a pack a week each') },
    { name: 'Towels', cat: 'hygiene', qty: n * up(D / 10), unit: 'pcs', min: n * 2, note: note('a fresh towel every 10 days') },
    { name: 'Waste collection bags', cat: 'hygiene', qty: 2 * n * D, unit: 'bags', min: 2 * n * 7, note: note('toilet and trash') },
    { name: 'Disinfectant wipes', cat: 'hygiene', qty: up(n * D / 10), unit: 'packs', min: n * 2, note: note('surfaces and shared equipment') },
    // equipment and safety
    { name: 'CO₂ scrubber cartridges (contingency)', cat: 'equipment', qty: 8 + 2 * up(D / 30), unit: 'units', min: 4, note: note('backup to the CO₂ removal system') },
    { name: 'Portable fire extinguisher', cat: 'equipment', qty: 4, unit: 'units', min: 2, note: note('one per module') },
    { name: 'Portable breathing apparatus', cat: 'equipment', qty: n + 2, unit: 'units', min: n, note: note('fire and toxic-leak response') },
    { name: 'Emergency oxygen masks', cat: 'equipment', qty: 2 * n, unit: 'units', min: n, note: note('depressurisation') },
    { name: 'Ammonia respirator', cat: 'equipment', qty: n + 2, unit: 'units', min: n, note: note('cooling-loop leak') },
    { name: 'Resistance exercise bands', cat: 'equipment', qty: 2 * n, unit: 'units', min: n, note: note('exercise countermeasure') },
    { name: 'Headlamps', cat: 'equipment', qty: n + 1, unit: 'units', min: n, note: note('power loss') },
    { name: 'Batteries (AA)', cat: 'equipment', qty: 48 + 4 * wk, unit: 'units', min: 24, note: note('lights and medical devices') },
    { name: 'Tool kit', cat: 'equipment', qty: 2, unit: 'kits', min: 1, note: note('maintenance') },
    { name: 'Duct tape', cat: 'equipment', qty: 6 + up(D / 60), unit: 'rolls', min: 2, note: note('repairs') },
    // personal
    { name: 'Sleeping bag', cat: 'other', qty: n, unit: 'units', min: n, note: note('one per person') },
    { name: 'Eye masks and earplugs', cat: 'other', qty: n * 4, unit: 'sets', min: n, note: note('sleep protection') },
    { name: 'Clothing set (shirt, shorts, socks)', cat: 'other', qty: n * up(D / 4), unit: 'sets', min: n * 3, note: note('a fresh set every 4 days') },
    { name: 'Exercise clothing set', cat: 'other', qty: n * wk, unit: 'sets', min: n, note: note('a fresh set each week') },
    { name: 'Personal care package from home', cat: 'other', qty: n, unit: 'packages', min: 0, note: note('one per person') },
  ].map((r) => (r.qty <= r.min ? { ...r, min: Math.floor(r.qty / 2) } : r)); // a full load never starts as "low"
}
const INV_STARTER = [
  ['First-aid kit', 'medical', 4, 'kits', 2], ['Pain relief tablets', 'medical', 120, 'tablets', 40], ['Antibiotic course', 'medical', 6, 'courses', 3],
  ['Bandages & dressings', 'medical', 60, 'pcs', 20], ['Blood pressure cuff', 'medical', 2, 'units', 1], ['Pulse oximeter', 'medical', 3, 'units', 1],
  ['Drinking water', 'food', 480, 'L', 150], ['Meal packs', 'food', 540, 'packs', 120], ['CO₂ scrubber cartridges', 'equipment', 8, 'units', 4],
  ['Resistance exercise bands', 'equipment', 6, 'units', 2], ['Disinfectant wipes', 'hygiene', 30, 'packs', 10],
];

const Inventory = (() => {
  const key = () => 'novacare.inv:' + (Auth.user().crew || '-');
  const uid = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : 'i-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
  function all() { try { const a = JSON.parse(localStorage.getItem(key())); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function write(a) { try { localStorage.setItem(key(), JSON.stringify(a)); } catch (e) { /* storage full or unavailable */ } }
  const items = () => all().filter((i) => !i.deleted).sort((a, b) => a.name.localeCompare(b.name));
  const level = (i) => (i.qty <= 0 ? 3 : i.min > 0 && i.qty <= i.min ? 1 : 0);
  function clean(d) {
    return { name: String(d.name || '').trim().slice(0, 60), cat: INV_CATS.some((c) => c.id === d.cat) ? d.cat : 'other',
      qty: Math.max(0, Math.round((+d.qty || 0) * 100) / 100), unit: String(d.unit || '').trim().slice(0, 12) || 'units',
      min: Math.max(0, Math.round((+d.min || 0) * 100) / 100), note: String(d.note || '').trim().slice(0, 120) };
  }
  function stamp() { const u = Auth.user(); return { by: state.name || u.name, md: state.md, at: new Date().toISOString(), pending: Auth.cloud() }; }
  /** Add an item, or update it when `id` is given. */
  function save(d, id) {
    const c = clean(d); if (!c.name) throw new Error('Give the item a name.');
    const a = all(); const i = a.findIndex((x) => x.id === id);
    if (i >= 0) a[i] = { ...a[i], ...c, ...stamp(), deleted: false }; else a.push({ id: uid(), ...c, ...stamp() });
    write(a); Sync.run();
  }
  function adjust(id, delta) {
    const a = all(); const it = a.find((x) => x.id === id); if (!it) return;
    it.qty = Math.max(0, Math.round((it.qty + delta) * 100) / 100); Object.assign(it, stamp()); write(a); Sync.run();
  }
  function remove(id) { const a = all(); const it = a.find((x) => x.id === id); if (!it) return; it.deleted = true; Object.assign(it, stamp()); write(a); Sync.run(); }
  /** Add a list of rows; a row whose name already exists updates that item. Returns { added, updated }. */
  function importRows(rows) {
    const a = all(); let added = 0, updated = 0;
    rows.forEach((r) => {
      const c = clean(r); if (!c.name) return;
      const it = a.find((x) => !x.deleted && x.name.toLowerCase() === c.name.toLowerCase());
      if (it) { Object.assign(it, c, stamp()); updated++; } else { a.push({ id: uid(), ...c, ...stamp() }); added++; }
    });
    write(a); Sync.run(); return { added, updated };
  }
  /* CSV: name, category, quantity, unit, minimum, note — a header row is optional. */
  function parseCsv(text) {
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
      else if (ch === '"') q = true;
      else if (ch === ',' || ch === ';' || ch === '\t') { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); cell = ''; if (row.some((c) => c.trim())) rows.push(row); row = []; }
      else cell += ch;
    }
    row.push(cell); if (row.some((c) => c.trim())) rows.push(row);
    if (rows.length && /^(name|item|nombre)$/i.test(rows[0][0].trim())) rows.shift();
    const cat = (s) => { s = String(s || '').trim().toLowerCase(); const c = INV_CATS.find((x) => x.id === s || x.name.toLowerCase() === s || x.name.toLowerCase().startsWith(s.slice(0, 4) || '~')); return c ? c.id : 'other'; };
    return rows.map((r) => ({ name: r[0], cat: cat(r[1]), qty: parseFloat(r[2]), unit: r[3], min: parseFloat(r[4]), note: r[5] }));
  }
  function toCsv() {
    const q = (s) => (/[",\n;]/.test(String(s)) ? '"' + String(s).replace(/"/g, '""') + '"' : String(s));
    return ['name,category,quantity,unit,minimum,note'].concat(items().map((i) => [i.name, i.cat, i.qty, i.unit, i.min, i.note || ''].map(q).join(','))).join('\n');
  }
  /** Merge rows that came from the database: the most recently changed copy of each item wins. */
  function merge(remote) {
    const a = all(); let changed = false;
    remote.forEach((r) => {
      const i = a.findIndex((x) => x.id === r.id);
      if (i < 0) { a.push(r); changed = true; }
      else if (!a[i].pending && new Date(r.at) > new Date(a[i].at)) { a[i] = r; changed = true; }
    });
    if (changed) write(a); return changed;
  }
  const pending = () => all().filter((i) => i.pending);
  function clearPending(ids) { write(all().map((i) => (ids.includes(i.id) ? { ...i, pending: false } : i))); }
  /** The mission loadout: one item per row, with an id fixed by mission and name, so loading it on two
      devices at once gives the same items. Existing items with the same name are updated. */
  function loadout(rows, c) {
    const a = all(); let added = 0, updated = 0;
    rows.forEach((r) => {
      const d = clean(r); if (!d.name) return;
      const id = `load:${c}:${d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`;
      const it = a.find((x) => x.id === id) || a.find((x) => !x.deleted && x.name.toLowerCase() === d.name.toLowerCase());
      if (it) { Object.assign(it, d, stamp(), { deleted: false }); updated++; } else { a.push({ id, ...d, ...stamp() }); added++; }
    });
    write(a); Sync.run(); return { added, updated };
  }
  return { loadout, items, level, save, adjust, remove, importRows, parseCsv, toCsv, merge, pending, clearPending, starter: () => importRows(INV_STARTER.map(([name, cat, qty, unit, min]) => ({ name, cat, qty, unit, min }))) };
})();

/* ---------- views ---------- */
function crewTabs() {
  const tabs = [['mates', 'Crewmates', 'users'], ['inventory', 'Ship inventory', 'box']];
  return `<nav class="subnav" aria-label="Crew sections"><span class="ind" aria-hidden="true"></span>${tabs.map(([v, l, ic]) => `<button class="${(ui.crewTab || 'mates') === v ? 'on' : ''}" data-act="crewtab" data-v="${v}" ${(ui.crewTab || 'mates') === v ? 'aria-current="page"' : ''}>${icon(ic)}${l}</button>`).join('')}</nav>`;
}

function viewInventory() {
  const u = Auth.user(); const items = Inventory.items(); const f = ui.invCat || 'all';
  const low = items.filter((i) => Inventory.level(i) === 1).length, out = items.filter((i) => Inventory.level(i) === 3).length;
  const head = pageHead('Ship inventory', `${esc(Missions.label())} · what the crew has on board, kept up to date by everyone`,
    `<button class="btn ghost" data-act="invupload">${icon('upload')}Upload list</button><button class="btn primary" data-act="invadd">${icon('plus')}Add item</button>`) + crewTabs() +
    '<input type="file" id="inv-file" accept=".csv,.txt,text/csv,text/plain" hidden>';
  if (!items.length) {
    return head + `<section class="card empty-state">${icon('box', 'lg')}<h2>No items on board yet</h2>
      <p>Add what the ship carries — medical supplies, food and water, equipment — so the whole crew sees what is available and what is running low. You can also upload a CSV list (name, category, quantity, unit, minimum, note).</p>
      <div class="btnrow"><button class="btn primary" data-act="invadd">${icon('plus')}Add the first item</button><button class="btn ghost" data-act="invstarter">Load a starter kit</button></div></section>`;
  }
  const kpi = (label, value, sub, cls = '') => `<div class="kpi ${cls}"><span>${label}</span><b class="num" data-count="${value}">${value}</b><small>${sub}</small></div>`;
  const shown = items.filter((i) => f === 'all' || (f === 'low' ? Inventory.level(i) > 0 : i.cat === f));
  const chip = (v, l, n) => `<button class="${f === v ? 'on' : ''}" data-act="invcat" data-v="${v}" aria-pressed="${f === v}">${l}<small>${n}</small></button>`;
  return head + `<section class="kpis inv-kpis">
      ${kpi('Items on board', items.length, `${new Set(items.map((i) => i.cat)).size} categories`)}
      ${kpi('Running low', low, low ? 'at or below the minimum' : 'all above the minimum', low ? 'down' : '')}
      ${kpi('Out of stock', out, out ? 'tell the crew' : 'nothing has run out', out ? 'down' : '')}
    </section>
    <div class="chips" role="group" aria-label="Filter items">${chip('all', 'All', items.length)}${low + out ? chip('low', 'Low or out', low + out) : ''}${INV_CATS.filter((c) => items.some((i) => i.cat === c.id)).map((c) => chip(c.id, c.name, items.filter((i) => i.cat === c.id).length)).join('')}</div>
    <section class="card inv-card"><ul class="inv">${shown.map((i) => {
      const c = INV_CATS.find((x) => x.id === i.cat) || INV_CATS[4]; const l = Inventory.level(i);
      return `<li class="${lc(l)}">
        <span class="inv-ic">${icon(c.icon)}</span>
        <div class="inv-main"><b>${esc(i.name)}</b><small>${c.name}${i.note ? ' · ' + esc(i.note) : ''}</small><small class="inv-by">Updated by ${esc(i.by || 'crew')}${i.md ? ` · MD ${i.md}` : ''}</small></div>
        <span class="pill ${lc(l)}">${l === 3 ? '◆ Out of stock' : l === 1 ? '▲ Low' : '● In stock'}</span>
        <div class="inv-qty" role="group" aria-label="Quantity of ${esc(i.name)}"><button data-act="invadj" data-id="${i.id}" data-d="-1" aria-label="Use one" ${i.qty <= 0 ? 'disabled' : ''}>${icon('minus')}</button>
          <span><b class="num">${i.qty}</b><small>${esc(i.unit)}</small></span><button data-act="invadj" data-id="${i.id}" data-d="1" aria-label="Add one">${icon('plus')}</button></div>
        <div class="inv-acts"><button class="btn ghost sm" data-act="invedit" data-id="${i.id}">Update</button><button class="x sm" data-act="invdel" data-id="${i.id}" title="Remove ${esc(i.name)}" aria-label="Remove ${esc(i.name)}">${icon('x')}</button></div>
      </li>`; }).join('') || '<li class="inv-none muted">No items in this filter.</li>'}</ul></section>
    <p class="muted small foot-note">${icon('shield')}${Auth.cloud() ? 'Changes are shared with everyone on this mission code.' : 'Local mode: the list is stored on this device. Connect the database to share it with the crew.'}
      <button class="link" data-act="invexport">Download as CSV</button></p>`;
}

function invItemHtml(m) {
  const it = m.id ? Inventory.items().find((i) => i.id === m.id) : null; const v = it || { name: '', cat: 'medical', qty: 1, unit: 'units', min: 0, note: '' };
  return `<div class="sheet narrow" role="dialog" aria-modal="true" aria-label="${it ? 'Update item' : 'Add item'}">
    <header><div><h2>${it ? 'Update item' : 'Add an item'}</h2><p class="sub">${it ? 'Change what is on board. The crew sees the update.' : 'Something the ship carries that the crew may need.'}</p></div><button class="x" data-act="close" aria-label="Close">${icon('x')}</button></header>
    <form id="inv-form" class="sheet-b one" novalidate>
      <div class="field"><label for="inv-name">Item</label><input id="inv-name" name="name" class="text" type="text" maxlength="60" value="${esc(v.name)}" placeholder="e.g. Sterile gauze" required></div>
      <div class="field-row">
        <div class="field"><label for="inv-cat">Category</label><select id="inv-cat" name="cat" class="text">${INV_CATS.map((c) => `<option value="${c.id}" ${v.cat === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}</select></div>
        <div class="field"><label for="inv-unit">Unit</label><input id="inv-unit" name="unit" class="text" type="text" maxlength="12" value="${esc(v.unit)}" placeholder="units, L, packs"></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="inv-qty">Quantity on board</label><input id="inv-qty" name="qty" class="text num" type="number" min="0" step="any" value="${v.qty}"></div>
        <div class="field"><label for="inv-min">Warn when at or below</label><input id="inv-min" name="min" class="text num" type="number" min="0" step="any" value="${v.min}"></div>
      </div>
      <div class="field"><label for="inv-note">Note <span class="muted">(optional)</span></label><input id="inv-note" name="note" class="text" type="text" maxlength="120" value="${esc(v.note || '')}" placeholder="Where it is stored, expiry, who to ask"></div>
      <p class="auth-err" role="alert">${esc(m.err || '')}</p>
      <div class="btnrow end"><button class="btn ghost" type="button" data-act="close">Cancel</button><button class="btn primary" type="submit">${it ? 'Save changes' : 'Add item'}</button></div>
    </form></div>`;
}

function missionNewHtml(m) {
  return `<div class="sheet narrow" role="dialog" aria-modal="true" aria-label="Create a mission">
    <header><div><h2>Create a mission</h2><p class="sub">You get a code to share. Crewmates join with it and see each other’s status.</p></div><button class="x" data-act="close" aria-label="Close">${icon('x')}</button></header>
    <form id="mission-new-form" class="sheet-b one" novalidate>
      <div class="field"><label for="mn-name">Mission name</label><input id="mn-name" name="name" class="text" type="text" maxlength="40" placeholder="e.g. Orion-7" required></div>
      <div class="field"><label>Where does it take place?</label>
        <div class="envs">${Object.entries(ENVIRONMENTS).map(([k, e]) => `<label class="envopt"><input type="radio" name="env" value="${k}" ${k === (m.env || 'iss') ? 'checked' : ''}><span><b>${e.name}</b><small>${e.gravity} · ${e.rad} mSv/day · ${e.comm}</small></span></label>`).join('')}</div></div>
      <div class="field"><label for="mn-len">Planned length (days)</label><input id="mn-len" name="len" class="text num" type="number" min="7" max="1200" value="180"></div>
      <p class="auth-err" role="alert">${esc(m.err || '')}</p>
      <div class="btnrow end"><button class="btn ghost" type="button" data-act="close">Cancel</button><button class="btn primary" type="submit">${icon('rocket')}Create mission</button></div>
    </form></div>`;
}

function missionJoinHtml(m) {
  return `<div class="sheet narrow" role="dialog" aria-modal="true" aria-label="Join a mission">
    <header><div><h2>Join a mission</h2><p class="sub">Enter the code a crewmate shared with you.</p></div><button class="x" data-act="close" aria-label="Close">${icon('x')}</button></header>
    <form id="mission-join-form" class="sheet-b one" novalidate>
      <div class="field"><label for="mj-code">Mission code</label><input id="mj-code" name="code" class="text code-in" type="text" maxlength="20" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="NOVA-XXXX" required></div>
      <p class="hint">${Auth.cloud() ? 'You will see everyone registered on that code, and they will see your status summary.' : 'Local mode: you will see crewmates who use this code on this device. Connect the database to join crews on other devices.'}</p>
      <p class="auth-err" role="alert">${esc(m.err || '')}</p>
      <div class="btnrow end"><button class="btn ghost" type="button" data-act="close">Cancel</button><button class="btn primary" type="submit">${icon('users')}Join mission</button></div>
    </form></div>`;
}

function missionCreatedHtml(m) {
  return `<div class="sheet narrow" role="dialog" aria-modal="true" aria-label="Mission created">
    <header><div><h2>Mission created</h2><p class="sub">Share this code with your crew so they can join.</p></div><button class="x" data-act="close" aria-label="Close">${icon('x')}</button></header>
    <div class="sheet-b one created">
      <div class="bigcode" aria-label="Mission code">${esc(m.code)}</div>
      <div class="btnrow end"><button class="btn ghost" data-act="copycode" data-code="${esc(m.code)}">${icon('copy')}Copy code</button><button class="btn primary" data-act="entermission">${icon('rocket')}Enter mission</button></div>
    </div></div>`;
}
