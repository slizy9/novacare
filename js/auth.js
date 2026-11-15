/* NOVACARE — crew accounts with an offline-first cloud database.

   How it works
   - The cloud (Supabase) is the real database: it stores every registered crew member
     and each one's mission data, so they can sign in from any device.
   - Every successful online sign-in also leaves a protected copy of the credentials on
     the device (PBKDF2-hashed password, never the password itself). With no signal,
     the crew member signs in against that copy and keeps working.
   - Readings are always saved on the device first and marked "pending". As soon as
     the link comes back they are uploaded automatically.
   - The first sign-in on a brand-new device, and creating an account, need a connection.
   - With no Supabase project configured (js/config.js), everything runs locally. */

const Auth = (() => {
  const USERS_KEY = 'novacare.accounts';   // device copy of accounts that signed in here
  const SESSION_KEY = 'novacare.session';
  const GUEST_ID = 'guest';                 // device-only account used by "Continue as guest"
  const TIMEOUT = 10000;                   // a request slower than this counts as "no signal"
  const cfg = typeof NOVACARE_CONFIG !== 'undefined' ? NOVACARE_CONFIG : {};
  const configured = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && !/YOUR-/.test(cfg.SUPABASE_URL + cfg.SUPABASE_ANON_KEY));
  let sb = null;
  try {
    if (configured && window.supabase) sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
  } catch (e) { sb = null; }
  let current = null;

  const read = (store, k, def) => { try { const r = store.getItem(k); return r ? JSON.parse(r) : def; } catch (e) { return def; } };
  const write = (store, k, v) => { try { store.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } };
  const accounts = () => read(localStorage, USERS_KEY, {});
  const norm = (e) => String(e || '').trim().toLowerCase();
  const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

  /* ---------- network helpers ---------- */
  class Offline extends Error {}
  const isNetErr = (e) => !e ? false : e instanceof Offline || e instanceof TypeError || e.name === 'AuthRetryableFetchError'
    || e.status === 0 || /fetch|network|load failed|timed? ?out/i.test(e.message || '');
  function withTimeout(p, ms = TIMEOUT) {
    return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Offline('timeout')), ms))]);
  }

  /* ---------- device credential copy ---------- */
  function salt() {
    const a = new Uint8Array(16);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a); else a.forEach((_, i) => { a[i] = Math.random() * 256; });
    return hex(a);
  }
  async function hash(pw, s) {
    if (window.crypto && crypto.subtle) {
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(s), iterations: 120000, hash: 'SHA-256' }, key, 256);
      return 'pbkdf2:' + hex(bits);
    }
    let h = 0x811c9dc5; const t = s + ':' + pw; // weak fallback where Web Crypto is missing
    for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return 'fnv:' + (h >>> 0).toString(16);
  }
  async function remember(email, password, name, uid, extra = {}) {
    const all = accounts(); const s = salt(); const old = all[email] || {};
    const crew = extra.crew !== undefined && extra.crew !== null ? normCrew(extra.crew) : (old.crew || '');
    all[email] = { ...old, name, uid: uid || old.uid || null, crew, role: extra.role || old.role || ROLES[2],
      salt: s, hash: await hash(password, s), seen: new Date().toISOString() };
    write(localStorage, USERS_KEY, all);
  }
  async function checkLocal(email, password) {
    const u = accounts()[email];
    return !!u && (await hash(password || '', u.salt)) === u.hash;
  }

  /* ---------- session ---------- */
  function startSession(email, keep, offline) {
    const u = accounts()[email];
    current = { id: email, name: u.name, uid: u.uid, crew: u.crew || '', role: u.role || ROLES[2], offline: !!offline, guest: !!u.guest };
    try { sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
    write(keep ? localStorage : sessionStorage, SESSION_KEY, { id: email });
  }
  function restore() {
    const sess = read(sessionStorage, SESSION_KEY, null) || read(localStorage, SESSION_KEY, null);
    const u = sess && accounts()[sess.id];
    current = u ? { id: sess.id, name: u.name, uid: u.uid, crew: u.crew || '', role: u.role || ROLES[2], offline: !!sb && !u.guest, guest: !!u.guest } : null;
    return current;
  }

  /* ---------- public actions ---------- */
  function validate({ email, password }) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
    if (!password) throw new Error('Enter your password.');
  }

  // Mission code; empty means "not on a mission yet" (new accounts start in the lobby).
  const normCrew = (c) => String(c || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20);

  /** Try the app without an account. Guest data stays on this device and never syncs. */
  function guest() {
    const all = accounts();
    if (!all[GUEST_ID]) { all[GUEST_ID] = { name: 'Guest', guest: true, uid: null, crew: '', role: 'Guest', seen: new Date().toISOString() }; write(localStorage, USERS_KEY, all); }
    startSession(GUEST_ID, true, false);
  }

  async function register({ name, email, password, confirm, role }) {
    email = norm(email); const crew = ''; role = ROLES.includes(role) ? role : ROLES[2];
    if (!name || name.trim().length < 2) throw new Error('Enter your full name.');
    validate({ email, password });
    if (password.length < 6) throw new Error('Password must be at least 6 characters.');
    if (password !== confirm) throw new Error('Passwords do not match.');
    name = name.trim();

    if (!sb) { // local-only mode
      if (accounts()[email]) throw new Error('That email is already registered. Sign in instead.');
      await remember(email, password, name, null, { crew, role }); startSession(email, true, false);
      return { ok: true };
    }
    let res;
    try { res = await withTimeout(sb.auth.signUp({ email, password, options: { data: { name, crew, role } } })); }
    catch (e) { if (isNetErr(e)) throw new Error('Creating an account needs a connection to the NOVACARE database. Try again when the link is back.'); throw e; }
    const { data, error } = res;
    if (error) {
      if (isNetErr(error)) throw new Error('Creating an account needs a connection to the NOVACARE database. Try again when the link is back.');
      if (/registered|exists/i.test(error.message)) throw new Error('That email is already registered. Sign in instead.');
      throw new Error(error.message);
    }
    if (data.user && Array.isArray(data.user.identities) && !data.user.identities.length) throw new Error('That email is already registered. Sign in instead.');
    if (!data.session) return { ok: false, confirm: true }; // project requires email confirmation
    await remember(email, password, name, data.user.id, { crew, role }); startSession(email, true, false);
    return { ok: true };
  }

  async function login({ email, password, remember: keep }) {
    email = norm(email); validate({ email, password });

    if (sb) {
      try {
        const { data, error } = await withTimeout(sb.auth.signInWithPassword({ email, password }));
        if (error && !isNetErr(error)) {
          if (/confirm/i.test(error.message)) throw new Error('Confirm your email first — check your inbox for the link.');
          throw new Error('Incorrect email or password.');
        }
        if (!error) {
          const meta = data.user.user_metadata || {};
          const name = meta.name || (accounts()[email] || {}).name || email.split('@')[0];
          await remember(email, password, name, data.user.id, { crew: meta.crew, role: meta.role }); startSession(email, keep, false);
          return { ok: true, offline: false };
        }
      } catch (e) { if (!isNetErr(e)) throw e; }
      // no signal: fall back to the copy kept on this device
      if (!accounts()[email]) throw new Error('No connection to the NOVACARE database. The first sign-in on a new device needs a connection; after that you can sign in without signal.');
      if (!(await checkLocal(email, password))) throw new Error('Incorrect email or password.');
      startSession(email, keep, true);
      return { ok: true, offline: true };
    }

    if (!(await checkLocal(email, password))) throw new Error('Incorrect email or password.');
    startSession(email, keep, false);
    return { ok: true, offline: false };
  }

  async function logout() {
    current = null;
    try { sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
    if (sb) { try { await sb.auth.signOut({ scope: 'local' }); } catch (e) { /* ignore */ } } // also fine for a guest
  }

  /** Throws Offline unless the database answers. */
  async function ping() {
    try {
      const r = await withTimeout(fetch(cfg.SUPABASE_URL.replace(/\/$/, '') + '/auth/v1/health', { headers: { apikey: cfg.SUPABASE_ANON_KEY }, cache: 'no-store' }), 6000);
      if (!r || r.status >= 500) throw new Offline('down');
    } catch (e) { throw new Offline('offline'); }
  }

  /** Cloud session for the signed-in crew member, or null. Throws Offline when unreachable. */
  async function cloudSession() {
    if (!sb || !current) return null;
    const { data, error } = await withTimeout(sb.auth.getSession(), 6000);
    if (error && isNetErr(error)) throw new Offline('offline');
    const s = data && data.session;
    if (!s || norm(s.user.email) !== current.id) { await ping(); return null; } // only ask to re-link when the link is really up
    if (!current.uid) { current.uid = s.user.id; const all = accounts(); if (all[current.id]) { all[current.id].uid = s.user.id; write(localStorage, USERS_KEY, all); } }
    return s;
  }

  /** Re-link a device sign-in to the cloud (used after signing in without signal). */
  async function reconnect(password) {
    if (!sb || !current) return;
    const { data, error } = await withTimeout(sb.auth.signInWithPassword({ email: current.id, password }));
    if (error) throw new Error(isNetErr(error) ? 'Still no connection — try again later.' : 'Incorrect password.');
    await remember(current.id, password, current.name, data.user.id);
    current.uid = data.user.id; current.offline = false;
  }

  /** Change mission code or name; uploaded to the database on the next sync.
      The role is chosen once at sign-up and cannot be changed afterwards. */
  function updateProfile({ crew, name }) {
    const all = accounts(); const u = all[current.id]; if (!u) return;
    if (crew !== undefined) u.crew = current.crew = normCrew(crew);
    if (name) u.name = current.name = name;
    u.profileDirty = !!sb && !u.guest; write(localStorage, USERS_KEY, all);
  }
  const account = () => (current ? accounts()[current.id] : null);
  function clearDirty() { const all = accounts(); if (all[current.id]) { delete all[current.id].profileDirty; write(localStorage, USERS_KEY, all); } }

  return {
    user: () => current, updateProfile, account, clearDirty, restore, register, login, logout, reconnect, cloudSession, isNetErr, guest,
    // cloud(): this session syncs with the database. Guests never do (their data stays on the device).
    client: () => sb, cloud: () => !!sb && !(current && current.guest), configured: () => !!sb,
    hasUsers: () => Object.keys(accounts()).some((k) => k !== GUEST_ID),
  };
})();

/* ---------- mission data sync (device first, cloud when reachable) ---------- */
const Sync = (() => {
  const TABLE = 'missions';
  let status = 'local';      // local | synced | syncing | pending | offline | relink | error
  let running = false, again = false, timer = null;
  const listeners = [];
  const metaKey = () => 'novacare.meta:' + Auth.user().id;
  const meta = () => { try { return JSON.parse(localStorage.getItem(metaKey())) || {}; } catch (e) { return {}; } };
  const setMeta = (m) => { try { localStorage.setItem(metaKey(), JSON.stringify(m)); } catch (e) { /* ignore */ } };
  const set = (s) => { if (s !== status) { status = s; listeners.forEach((f) => f(s)); } };

  /** Called after every local save: mark data as waiting for upload. */
  function touch() {
    if (!Auth.user()) return;
    setMeta({ ...meta(), dirty: true, at: new Date().toISOString() });
    if (!Auth.cloud()) return;
    if (status === 'synced') set('pending');
    clearTimeout(timer); timer = setTimeout(run, 1500);
  }

  async function run() {
    if (!Auth.user()) return;
    if (!Auth.cloud()) { set('local'); return; }
    if (running) { again = true; return; }
    running = true;
    try {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) { set('offline'); return; }
      const sess = await Auth.cloudSession();
      if (!sess) { set('relink'); return; }
      set('syncing');
      const sb = Auth.client(); const uid = sess.user.id; const m = meta();
      const pull = await sb.from(TABLE).select('data, updated_at').eq('user_id', uid).maybeSingle();
      if (pull.error) throw pull.error;
      const remote = pull.data;
      const remoteNewer = remote && (!m.at || new Date(remote.updated_at) > new Date(m.at));
      if (remoteNewer && (!m.dirty || !m.syncedAt || new Date(remote.updated_at) > new Date(m.syncedAt))) {
        // another device saved more recently: take the cloud copy
        state = remote.data; Engine.save(true);
        setMeta({ dirty: false, at: remote.updated_at, syncedAt: remote.updated_at });
        listeners.forEach((f) => f(status, 'pulled'));
      } else if (m.dirty || !remote) {
        const at = m.at || new Date().toISOString();
        const push = await sb.from(TABLE).upsert({ user_id: uid, data: state, updated_at: at });
        if (push.error) throw push.error;
        if (meta().at === m.at) setMeta({ dirty: false, at, syncedAt: at }); // untouched while uploading
      }
      await crewSync(sb, uid);
      set(meta().dirty ? 'pending' : 'synced');
    } catch (e) {
      set(Auth.isNetErr(e) ? 'offline' : 'error');
      if (!Auth.isNetErr(e)) console.warn('NOVACARE sync:', e);
    } finally {
      running = false;
      if (again) { again = false; run(); }
    }
  }

  /* crew sharing: my summary up, crewmates and emergency alerts down.
     Kept separate so a project without the crew tables still syncs mission data. */
  async function crewSync(sb, uid) {
    const u = Auth.user(); const acc = Auth.account() || {};
    // membership first (the database only accepts alerts from members), then alerts on their own,
    // so a failure in profiles, crew status or the directory can never hold an emergency back
    try { await membershipSync(sb, uid, u); } catch (e) { if (Auth.isNetErr(e)) throw e; console.warn('NOVACARE membership sync:', e.message || e); }
    await alertSync(sb, uid, u);
    try {
      if (acc.profileDirty) {
        const r = await sb.from('profiles').update({ crew_code: u.crew || null, name: u.name }).eq('id', uid);
        if (r.error) throw r.error;
        try { await sb.auth.updateUser({ data: { crew: u.crew, role: u.role, name: u.name } }); } catch (e) { /* metadata is a convenience copy */ }
        Auth.clearDirty();
      }
      if (!u.crew) { localStorage.setItem('novacare.crew:' + u.id, '[]'); return; } // not on a mission yet: nothing to share
      const me = Crew.summarize(state, { id: u.id, name: state.name || u.name, role: u.role });
      let r = await sb.from('crew_status').upsert({ user_id: uid, crew_code: u.crew, name: me.name, role: u.role, summary: me, updated_at: new Date().toISOString() }, { onConflict: 'user_id,crew_code' });
      if (r.error) throw r.error;
      r = await sb.from('crew_status').select('user_id, name, role, summary, updated_at').eq('crew_code', u.crew).neq('user_id', uid);
      if (r.error) throw r.error;
      const before = localStorage.getItem('novacare.crew:' + u.id);
      localStorage.setItem('novacare.crew:' + u.id, JSON.stringify(r.data || []));
      if (before !== localStorage.getItem('novacare.crew:' + u.id)) listeners.forEach((f) => f(status, 'crew'));
    } catch (e) {
      if (Auth.isNetErr(e)) throw e;
      console.warn('NOVACARE crew sync (run supabase/setup.sql to enable crew sharing):', e.message || e);
    }
    if (u.crew) await inventorySync(sb, u);
  }

  /* Emergency alerts and help requests: mine up, the crew's down. Errors are kept (alertError)
     so the person who raised it sees that it has not reached the crew yet. */
  let alertError = '';
  async function alertSync(sb, uid, u) {
    if (!u.crew) return;
    try {
      const pending = Crew.alerts().filter((a) => a.pending);
      for (const a of pending) {
        const mine = a.fromId === u.id || a.fromId === uid;
        const row = { status: a.status, resolved_at: a.resolvedAt };
        // a new alert is inserted; an existing one (mine or a crewmate's) only changes its status
        let r = mine ? await sb.from('alerts').insert({ id: a.id, crew_code: a.crew || u.crew, from_user: uid, from_name: a.fromName, about_id: a.aboutId, about_name: a.aboutName,
          type: a.type, note: a.note, md: a.md, status: a.status, created_at: a.createdAt, resolved_at: a.resolvedAt }) : null;
        if (!mine || (r.error && r.error.code === '23505')) r = await sb.from('alerts').update(row).eq('id', a.id); // 23505 = already uploaded
        if (r.error) throw r.error;
        Crew.writeAlerts(Crew.alerts().map((x) => x.id === a.id ? { ...x, pending: false } : x));
        if (mine && a.status === 'active') listeners.forEach((f) => f(status, 'alertsent', a));
      }
      const since = new Date(Date.now() - 7 * 864e5).toISOString();
      const r = await sb.from('alerts').select('*').eq('crew_code', u.crew).gte('created_at', since);
      if (r.error) throw r.error;
      const prev = new Set(Crew.active().map((a) => a.id));
      Crew.merge((r.data || []).map((x) => ({ id: x.id, crew: x.crew_code, fromId: x.from_user, fromName: x.from_name, aboutId: x.about_id, aboutName: x.about_name,
        type: x.type, note: x.note, md: x.md, status: x.status, createdAt: x.created_at, resolvedAt: x.resolved_at })));
      const now = Crew.active();
      const incoming = now.filter((a) => !prev.has(a.id) && a.fromId !== uid && a.fromId !== u.id);
      const nowIds = new Set(now.map((a) => a.id));
      const resolved = Crew.alerts().filter((a) => prev.has(a.id) && !nowIds.has(a.id) && a.status === 'resolved');
      alertError = '';
      if (incoming.length || now.length !== prev.size || now.some((a) => !prev.has(a.id))) listeners.forEach((f) => f(status, 'alerts', incoming));
      if (resolved.length) listeners.forEach((f) => f(status, 'alertsresolved', resolved));
    } catch (e) {
      if (Auth.isNetErr(e)) throw e;
      alertError = e.message || String(e);
      console.warn('NOVACARE alert sync:', alertError);
      listeners.forEach((f) => f(status, 'alerterror', alertError));
    }
  }
  /* Quick check for alerts only, every few seconds, between full syncs. */
  let alertBusy = false;
  async function alertsOnly() {
    if (alertBusy || running || !Auth.user() || !Auth.cloud() || !Auth.user().crew || navigator.onLine === false) return;
    alertBusy = true;
    try { const sess = await Auth.cloudSession(); if (sess) await alertSync(Auth.client(), sess.user.id, Auth.user()); } catch (e) { /* the full sync reports connection problems */ } finally { alertBusy = false; }
  }

  /* Missions this person is on: membership rows (so they only appear in those missions),
     their status removed from missions they left, and the missions they created published
     to the shared mission directory. */
  async function membershipSync(sb, uid, u) {
    if (typeof Missions === 'undefined') return;
    const mine = Missions.list();
    const codes = mine.map((m) => m.code);
    let r;
    if (codes.length) {
      r = await sb.from('mission_members').upsert(codes.map((code) => ({ code, user_id: uid })), { onConflict: 'code,user_id', ignoreDuplicates: true });
      if (r.error) throw r.error;
    }
    const list = '(' + codes.map((c) => '"' + c + '"').join(',') + ')';
    r = codes.length ? await sb.from('mission_members').delete().eq('user_id', uid).not('code', 'in', list) : await sb.from('mission_members').delete().eq('user_id', uid);
    if (r.error) throw r.error;
    r = codes.length ? await sb.from('crew_status').delete().eq('user_id', uid).not('crew_code', 'in', list) : await sb.from('crew_status').delete().eq('user_id', uid);
    if (r.error) throw r.error;
    const made = mine.filter((m) => m.role === 'creator');
    if (made.length) {
      r = await sb.from('mission_directory').upsert(made.map((m) => ({ code: m.code, name: m.name, env: m.env, mission_days: m.len, created_by: uid, creator_name: state.name || u.name })), { onConflict: 'code' });
      if (r.error) throw r.error;
    }
    Missions.refreshDirectory(true, () => listeners.forEach((f) => f(status, 'crew')));
  }

  /* ship inventory: my changes up, the crew's list down. Separate so a project without the table still syncs the rest. */
  async function inventorySync(sb, u) {
    if (typeof Inventory === 'undefined') return;
    try {
      const mine = Inventory.pending();
      if (mine.length) {
        const r = await sb.from('inventory').upsert(mine.map((i) => ({ id: i.id, crew_code: u.crew, name: i.name, category: i.cat, qty: i.qty, unit: i.unit, min_qty: i.min,
          note: i.note, updated_by: i.by, md: i.md, deleted: !!i.deleted, updated_at: i.at })));
        if (r.error) throw r.error;
        Inventory.clearPending(mine.map((i) => i.id));
      }
      const r = await sb.from('inventory').select('*').eq('crew_code', u.crew);
      if (r.error) throw r.error;
      const changed = Inventory.merge((r.data || []).map((x) => ({ id: x.id, name: x.name, cat: x.category, qty: +x.qty, unit: x.unit, min: +x.min_qty, note: x.note || '',
        by: x.updated_by, md: x.md, deleted: !!x.deleted, at: x.updated_at, pending: false })));
      if (changed) listeners.forEach((f) => f(status, 'crew'));
    } catch (e) {
      if (Auth.isNetErr(e)) throw e;
      console.warn('NOVACARE inventory sync (run supabase/setup.sql to enable the shared ship inventory):', e.message || e);
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => run());
    window.addEventListener('offline', () => { if (Auth.user() && Auth.cloud()) set('offline'); });
    setInterval(() => { if (Auth.user() && !running) run(); }, 30000);
    setInterval(alertsOnly, 8000); // emergencies and help requests arrive within ~8 s
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') alertsOnly(); });
  }

  return { touch, run, alertsNow: alertsOnly, alertError: () => alertError, status: () => status, pending: () => !!(Auth.user() && meta().dirty), onChange: (f) => listeners.push(f) };
})();
