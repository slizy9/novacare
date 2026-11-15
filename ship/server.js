#!/usr/bin/env node
/* NovaCare ship server — the crew database on the ship's own network. No internet needed.

   It speaks the small part of the Supabase API that NovaCare uses (sign-up / sign-in on
   /auth/v1, tables on /rest/v1, the showcase_crew() function), so the app's sync code works
   unchanged: set SHIP_SERVER_URL in js/config.js and the same code talks to this server
   instead of the cloud. Tables and access rules mirror supabase/setup.sql.

   Zero dependencies: Node 22+ (built-in node:sqlite). Data lives in DATA_DIR/novacare-ship.db.

     node ship/server.js            start (PORT 8787, DATA_DIR ./ship/data)
     node ship/server.js code       print the crew password-reset code
*/
'use strict';
const http = require('node:http');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

process.removeAllListeners('warning'); // node:sqlite prints an "experimental" warning on Node 22
const { DatabaseSync } = require('node:sqlite');

const PORT = +process.env.PORT || 8787;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const TOKEN_TTL = 3600;          // access token lifetime (s); the app refreshes it on its own
const CLOCK_LEEWAY = 300;        // tolerate devices whose clocks drift a little (s)
const MAX_BODY = 25 * 1024 * 1024;

fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(path.join(DATA_DIR, 'novacare-ship.db'));
db.exec(`
  PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;
  create table if not exists settings (key text primary key, value text);
  create table if not exists users (id text primary key, email text unique not null, pw text not null,
    meta text not null default '{}', created_at text not null, updated_at text not null, last_sign_in_at text);
  create table if not exists refresh_tokens (token text primary key, user_id text not null, session_id text not null,
    created_at text not null, revoked_at text);
  create table if not exists profiles (id text primary key, name text, email text, crew_code text, role text, created_at text not null);
  create table if not exists missions (user_id text primary key, data text not null, updated_at text not null);
  create table if not exists mission_directory (code text primary key, name text not null, env text not null default 'iss',
    mission_days integer not null default 180, created_by text not null, creator_name text, created_at text not null);
  create table if not exists mission_members (code text not null, user_id text not null, joined_at text not null, primary key (code, user_id));
  create index if not exists mission_members_user_idx on mission_members (user_id);
  create table if not exists crew_status (user_id text not null, crew_code text not null, name text, role text,
    summary text not null, updated_at text not null, primary key (user_id, crew_code));
  create table if not exists alerts (id text primary key, crew_code text not null, from_user text, from_name text, about_id text,
    about_name text, type text not null, note text, md integer, status text not null default 'active', created_at text not null, resolved_at text);
  create index if not exists alerts_crew_idx on alerts (crew_code, created_at);
  create table if not exists inventory (id text primary key, crew_code text not null, name text not null, category text not null default 'other',
    qty real not null default 0, unit text, min_qty real not null default 0, note text, updated_by text, md integer,
    deleted integer not null default 0, updated_at text not null);
  create index if not exists inventory_crew_idx on inventory (crew_code);
`);

const nowIso = () => new Date().toISOString();
const setting = (k) => { const r = db.prepare('select value from settings where key = ?').get(k); return r ? r.value : null; };
function ensureSetting(k, make) {
  let v = setting(k);
  if (!v) { v = make(); db.prepare('insert into settings (key, value) values (?, ?)').run(k, v); }
  return v;
}
const JWT_SECRET = process.env.SHIP_JWT_SECRET || ensureSetting('jwt_secret', () => crypto.randomBytes(32).toString('hex'));
const RESET_CODE = (process.env.SHIP_RESET_CODE || ensureSetting('reset_code', () => {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const b = crypto.randomBytes(8);
  return [...b].map((x) => abc[x % abc.length]).join('').replace(/^(.{4})/, '$1-');
})).trim().toUpperCase();

if (process.argv[2] === 'code') { console.log(RESET_CODE); process.exit(0); }

/* ---------- tables: column types, defaults and access rules (mirrors supabase/setup.sql) ---------- */
const isMember = (code, uid) => !!uid && !!db.prepare('select 1 from mission_members where code = ? and user_id = ?').get(code, uid);
const sharesMission = (other, uid) => !!uid && !!db.prepare(
  'select 1 from mission_members a join mission_members b on a.code = b.code where a.user_id = ? and b.user_id = ?').get(uid, other);
const own = (col) => (r, uid) => !!uid && r[col] === uid;
const member = (r, uid) => isMember(r.crew_code, uid);

const TABLES = {
  profiles: {
    pk: ['id'],
    cols: { id: 'text', name: 'text', email: 'text', crew_code: 'text', role: 'text', created_at: 'ts' },
    defaults: { created_at: nowIso },
    select: (r, uid) => own('id')(r, uid) || sharesMission(r.id, uid),
    insert: own('id'), update: { using: own('id'), check: own('id') },
    before: (n, o) => { if (o && o.role != null) n.role = o.role; }, // the role chosen at sign-up never changes
  },
  missions: {
    pk: ['user_id'],
    cols: { user_id: 'text', data: 'json', updated_at: 'ts' },
    defaults: { updated_at: nowIso },
    select: own('user_id'), insert: own('user_id'), update: { using: own('user_id'), check: own('user_id') },
  },
  mission_directory: {
    pk: ['code'],
    cols: { code: 'text', name: 'text', env: 'text', mission_days: 'int', created_by: 'text', creator_name: 'text', created_at: 'ts' },
    defaults: { env: () => 'iss', mission_days: () => 180, created_by: (uid) => uid, created_at: nowIso },
    select: () => true, // anyone, guests too, can find a mission and join it
    insert: own('created_by'), update: { using: own('created_by'), check: own('created_by') }, delete: own('created_by'),
  },
  mission_members: {
    pk: ['code', 'user_id'],
    cols: { code: 'text', user_id: 'text', joined_at: 'ts' },
    defaults: { joined_at: nowIso },
    select: own('user_id'), insert: own('user_id'), delete: own('user_id'),
  },
  crew_status: {
    pk: ['user_id', 'crew_code'],
    cols: { user_id: 'text', crew_code: 'text', name: 'text', role: 'text', summary: 'json', updated_at: 'ts' },
    defaults: { updated_at: nowIso },
    select: member,
    insert: (r, uid) => own('user_id')(r, uid) && member(r, uid),
    update: { using: own('user_id'), check: (r, uid) => own('user_id')(r, uid) && member(r, uid) },
    delete: own('user_id'),
    before: (n) => { const p = db.prepare('select role from profiles where id = ?').get(n.user_id); if (p && p.role) n.role = p.role; },
  },
  alerts: {
    pk: ['id'],
    cols: { id: 'text', crew_code: 'text', from_user: 'text', from_name: 'text', about_id: 'text', about_name: 'text', type: 'text',
      note: 'text', md: 'int', status: 'text', created_at: 'ts', resolved_at: 'ts' },
    defaults: { status: () => 'active', created_at: nowIso },
    select: member,
    insert: (r, uid) => member(r, uid) && r.from_user === uid,
    update: { using: member, check: member },
    valid: (r) => ['active', 'resolved'].includes(r.status) || 'alerts.status must be active or resolved',
  },
  inventory: {
    pk: ['id'],
    cols: { id: 'text', crew_code: 'text', name: 'text', category: 'text', qty: 'num', unit: 'text', min_qty: 'num', note: 'text',
      updated_by: 'text', md: 'int', deleted: 'bool', updated_at: 'ts' },
    defaults: { category: () => 'other', qty: () => 0, min_qty: () => 0, deleted: () => false, updated_at: nowIso },
    select: member, insert: member, update: { using: member, check: member },
  },
};
const NOT_NULL = {
  profiles: ['id', 'created_at'], missions: ['user_id', 'data', 'updated_at'],
  mission_directory: ['code', 'name', 'env', 'mission_days', 'created_by', 'created_at'], mission_members: ['code', 'user_id', 'joined_at'],
  crew_status: ['user_id', 'crew_code', 'summary', 'updated_at'], alerts: ['id', 'crew_code', 'type', 'status', 'created_at'],
  inventory: ['id', 'crew_code', 'name', 'category', 'qty', 'min_qty', 'deleted', 'updated_at'],
};

/* values: JSON in → stored in SQLite → JSON out */
class ApiError extends Error {
  constructor(status, code, message, extra) { super(message); this.status = status; this.code = code; this.extra = extra || {}; }
}
function toDb(type, v) {
  if (v === undefined || v === null) return null;
  switch (type) {
    case 'json': return JSON.stringify(v);
    case 'bool': return v === true || v === 'true' || v === 1 || v === '1' ? 1 : 0;
    case 'int': { const n = Number(v); if (!Number.isFinite(n)) throw new ApiError(400, '22P02', `invalid input syntax for type integer: "${v}"`); return Math.round(n); }
    case 'num': { const n = Number(v); if (!Number.isFinite(n)) throw new ApiError(400, '22P02', `invalid input syntax for type numeric: "${v}"`); return n; }
    case 'ts': { const d = new Date(v); if (isNaN(d)) throw new ApiError(400, '22007', `invalid input syntax for type timestamp: "${v}"`); return d.toISOString(); }
    default: return typeof v === 'object' ? JSON.stringify(v) : String(v);
  }
}
function fromDb(type, v) {
  if (v === null || v === undefined) return null;
  if (type === 'json') { try { return JSON.parse(v); } catch (e) { return null; } }
  if (type === 'bool') return !!v;
  if (type === 'int' || type === 'num') return Number(v);
  return v;
}
const decodeRow = (t, row) => { const o = {}; for (const [c, ty] of Object.entries(TABLES[t].cols)) o[c] = fromDb(ty, row[c]); return o; };

/* ---------- PostgREST-style query parsing ---------- */
const RESERVED = new Set(['select', 'order', 'limit', 'offset', 'on_conflict', 'columns']);
function splitList(s) { // ("a","b c",d) → ['a','b c','d']
  const inner = s.replace(/^\(/, '').replace(/\)$/, ''); const out = []; let cur = '', q = false;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch === '"') { q = !q; continue; }
    if (ch === '\\' && q && i + 1 < inner.length) { cur += inner[++i]; continue; }
    if (ch === ',' && !q) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  if (cur !== '' || inner.endsWith(',')) out.push(cur);
  return out.map((x) => x.trim());
}
function where(t, params) {
  const cols = TABLES[t].cols; const sql = []; const args = [];
  for (const [col, raw] of params) {
    if (RESERVED.has(col)) continue;
    if (!cols[col]) throw new ApiError(400, '42703', `column ${t}.${col} does not exist`);
    let s = raw, neg = false;
    if (s.startsWith('not.')) { neg = true; s = s.slice(4); }
    const dot = s.indexOf('.'); if (dot < 0) throw new ApiError(400, 'PGRST100', `"failed to parse filter (${raw})"`);
    const op = s.slice(0, dot), val = s.slice(dot + 1); const ty = cols[col];
    let clause;
    const ops = { eq: '=', neq: '<>', gt: '>', gte: '>=', lt: '<', lte: '<=' };
    if (ops[op]) { clause = `"${col}" ${ops[op]} ?`; args.push(toDb(ty, val)); }
    else if (op === 'in') { const list = splitList(val); clause = list.length ? `"${col}" in (${list.map(() => '?').join(',')})` : '0'; list.forEach((v) => args.push(toDb(ty, v))); }
    else if (op === 'is') {
      const v = val.toLowerCase();
      clause = v === 'null' ? `"${col}" is null` : v === 'true' ? `"${col}" = 1` : v === 'false' ? `"${col}" = 0` : null;
      if (!clause) throw new ApiError(400, 'PGRST100', `"failed to parse filter (${raw})"`);
    } else if (op === 'like' || op === 'ilike') { clause = `"${col}" like ?`; args.push(val.replace(/\*/g, '%')); }
    else throw new ApiError(400, 'PGRST100', `"failed to parse filter (${raw})" (unsupported operator ${op})`);
    sql.push(neg ? `not (${clause})` : clause);
  }
  return { sql: sql.length ? ' where ' + sql.join(' and ') : '', args };
}
function orderBy(t, s) {
  if (!s) return '';
  return ' order by ' + s.split(',').map((part) => {
    const [col, ...mods] = part.trim().split('.');
    if (!TABLES[t].cols[col]) throw new ApiError(400, '42703', `column ${t}.${col} does not exist`);
    const dir = mods.includes('desc') ? 'desc' : 'asc';
    const nulls = mods.includes('nullsfirst') ? ' nulls first' : mods.includes('nullslast') ? ' nulls last' : '';
    return `"${col}" ${dir}${nulls}`;
  }).join(', ');
}
function columnsOf(t, s) {
  const all = Object.keys(TABLES[t].cols);
  if (!s || s.trim() === '*') return all;
  return s.split(',').map((c) => c.trim()).filter(Boolean).map((c) => {
    if (c === '*') return all;
    if (!TABLES[t].cols[c]) throw new ApiError(400, '42703', `column ${t}.${c} does not exist`);
    return c;
  }).flat();
}
const pick = (row, cols) => Object.fromEntries(cols.map((c) => [c, row[c]]));
const rlsError = (t) => new ApiError(403, '42501', `new row violates row-level security policy for table "${t}"`);

/* ---------- REST handlers ---------- */
function readRows(t, params, uid, rule) {
  const w = where(t, params);
  const rows = db.prepare(`select * from "${t}"${w.sql}${orderBy(t, params.get('order'))}`).all(...w.args).map((r) => decodeRow(t, r));
  return rows.filter((r) => rule && rule(r, uid));
}
function writeRow(t, row, existing) {
  const def = TABLES[t]; const cols = Object.keys(def.cols);
  for (const c of NOT_NULL[t]) if (row[c] === null || row[c] === undefined) throw new ApiError(400, '23502', `null value in column "${c}" of relation "${t}" violates not-null constraint`);
  if (def.valid) { const v = def.valid(row); if (v !== true) throw new ApiError(400, '23514', v); }
  const vals = cols.map((c) => toDb(def.cols[c], row[c]));
  if (existing) {
    db.prepare(`update "${t}" set ${cols.map((c) => `"${c}" = ?`).join(', ')} where ${def.pk.map((k) => `"${k}" = ?`).join(' and ')}`)
      .run(...vals, ...def.pk.map((k) => toDb(def.cols[k], existing[k])));
  } else {
    db.prepare(`insert into "${t}" (${cols.map((c) => `"${c}"`).join(', ')}) values (${cols.map(() => '?').join(', ')})`).run(...vals);
  }
}
function findBy(t, keys, row) {
  const def = TABLES[t];
  const r = db.prepare(`select * from "${t}" where ${keys.map((k) => `"${k}" = ?`).join(' and ')}`).get(...keys.map((k) => toDb(def.cols[k], row[k])));
  return r ? decodeRow(t, r) : null;
}
function cleanInput(t, obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new ApiError(400, 'PGRST102', 'Each row must be a JSON object');
  const cols = TABLES[t].cols; const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!cols[k]) throw new ApiError(400, 'PGRST204', `Could not find the '${k}' column of '${t}' in the schema cache`);
    out[k] = fromDb(cols[k], toDb(cols[k], v)); // normalise (timestamps, numbers, booleans)
  }
  return out;
}
function tx(fn) {
  db.exec('begin immediate');
  try { const r = fn(); db.exec('commit'); return r; } catch (e) { try { db.exec('rollback'); } catch (_) { /* ignore */ } throw e; }
}

function restInsert(t, body, params, prefer, uid) {
  const def = TABLES[t];
  const rows = (Array.isArray(body) ? body : [body]).map((r) => cleanInput(t, r));
  const resolution = (prefer.match(/resolution=(merge|ignore)-duplicates/) || [])[1];
  const conflictCols = params.get('on_conflict') ? params.get('on_conflict').split(',').map((s) => s.trim()) : def.pk;
  for (const c of conflictCols) if (!def.cols[c]) throw new ApiError(400, '42703', `column ${t}.${c} does not exist`);
  return tx(() => {
    const out = [];
    for (const input of rows) {
      const fresh = { ...input };
      for (const [c, f] of Object.entries(def.defaults || {})) if (fresh[c] === undefined) fresh[c] = f(uid);
      for (const c of Object.keys(def.cols)) if (fresh[c] === undefined) fresh[c] = null;
      if (!def.insert || !def.insert(fresh, uid)) throw rlsError(t);
      const existing = findBy(t, conflictCols, fresh);
      const pkClash = !existing && findBy(t, def.pk, fresh); // on_conflict names other columns, but the key is taken
      if (existing || pkClash) {
        const cur = existing || pkClash;
        if (!resolution || pkClash) throw new ApiError(409, '23505', `duplicate key value violates unique constraint "${t}_pkey"`,
          { details: `Key (${def.pk.join(', ')}) already exists.` });
        if (resolution === 'ignore') continue;
        if (!def.update || !def.update.using(cur, uid)) throw rlsError(t);
        const merged = { ...cur, ...input };
        if (def.before) def.before(merged, cur);
        if (!def.update.check(merged, uid)) throw rlsError(t);
        writeRow(t, merged, cur); out.push(merged);
      } else {
        if (def.before) def.before(fresh, null);
        writeRow(t, fresh, null); out.push(fresh);
      }
    }
    return out;
  });
}
function restUpdate(t, body, params, uid) {
  const def = TABLES[t]; const patch = cleanInput(t, body);
  if (!def.update) return [];
  return tx(() => readRows(t, params, uid, def.update.using).map((cur) => {
    const next = { ...cur, ...patch };
    if (def.before) def.before(next, cur);
    if (!def.update.check(next, uid)) throw rlsError(t);
    writeRow(t, next, cur); return next;
  }));
}
function restDelete(t, params, uid) {
  const def = TABLES[t]; if (!def.delete) return [];
  return tx(() => readRows(t, params, uid, def.delete).map((r) => {
    db.prepare(`delete from "${t}" where ${def.pk.map((k) => `"${k}" = ?`).join(' and ')}`).run(...def.pk.map((k) => toDb(def.cols[k], r[k])));
    return r;
  }));
}
const GUEST_ALERT_TYPES = ['help', 'assist', 'unresponsive', 'breathing', 'chest', 'bleeding', 'head', 'allergy', 'toxic', 'burn', 'fracture', 'psych'];
const RPC = {
  // Showcase mission NOVA-1: guests see its real crew, without medical history.
  showcase_crew: () => db.prepare(`select user_id, name, role, summary, updated_at from crew_status where crew_code = 'NOVA-1'
      order by updated_at desc limit 30`).all().map((r) => {
    const s = fromDb('json', r.summary) || {}; delete s.med;
    return { user_id: r.user_id, name: r.name, role: r.role, summary: s, updated_at: r.updated_at };
  }),
  // Guests on NOVA-1 see its calls for help, and their own reach its crew (same rules as supabase/setup.sql):
  // only help and emergency types, guests change guest alerts only, at most 10 guest alerts in 10 minutes.
  showcase_alerts: () => db.prepare(`select id, from_user, from_name, about_id, about_name, type, note, md, status, created_at, resolved_at from alerts
      where crew_code = 'NOVA-1' and created_at > ? and type in (${GUEST_ALERT_TYPES.map(() => '?').join(', ')}) order by created_at desc limit 50`)
    .all(new Date(Date.now() - 2 * 864e5).toISOString(), ...GUEST_ALERT_TYPES),
  showcase_raise: (uid, b) => {
    b = b || {};
    if (!GUEST_ALERT_TYPES.includes(b.p_type)) throw new ApiError(400, 'P0001', 'Unknown alert type');
    if (!['active', 'resolved'].includes(b.p_status)) throw new ApiError(400, 'P0001', 'Unknown status');
    const now = nowIso(); const resolvedAt = b.p_status === 'resolved' ? now : null;
    if (db.prepare('select 1 from alerts where id = ?').get(String(b.p_id))) {
      db.prepare(`update alerts set status = ?, resolved_at = ? where id = ? and crew_code = 'NOVA-1' and from_user is null`).run(b.p_status, resolvedAt, String(b.p_id));
      return null;
    }
    const recent = db.prepare(`select count(*) n from alerts where crew_code = 'NOVA-1' and from_user is null and created_at > ?`).get(new Date(Date.now() - 6e5).toISOString()).n;
    if (recent >= 10) throw new ApiError(429, 'P0001', 'Too many guest alerts — try again in a few minutes');
    db.prepare(`insert into alerts (id, crew_code, from_user, from_name, about_id, about_name, type, note, md, status, created_at, resolved_at)
      values (?, 'NOVA-1', null, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(String(b.p_id), `${String(b.p_from_name || 'Guest').slice(0, 40)} (guest)`, String(b.p_about_id || '').slice(0, 80),
      String(b.p_about_name || '').slice(0, 60), b.p_type, String(b.p_note || '').slice(0, 160), Number.isFinite(+b.p_md) ? +b.p_md : null, b.p_status, now, resolvedAt);
    return null;
  },
};

/* ---------- auth (GoTrue-compatible subset) ---------- */
const b64u = (b) => Buffer.from(b).toString('base64url');
function signJwt(payload) {
  const head = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' })); const body = b64u(JSON.stringify(payload));
  return `${head}.${body}.${crypto.createHmac('sha256', JWT_SECRET).update(`${head}.${body}`).digest('base64url')}`;
}
function verifyJwt(tok) {
  const parts = String(tok || '').split('.'); if (parts.length !== 3) return null;
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${parts[0]}.${parts[1]}`).digest();
  const got = Buffer.from(parts[2], 'base64url');
  if (got.length !== sig.length || !crypto.timingSafeEqual(got, sig)) return null;
  try { const p = JSON.parse(Buffer.from(parts[1], 'base64url').toString()); return p.exp && p.exp + CLOCK_LEEWAY < Date.now() / 1000 ? 'expired' : p; } catch (e) { return null; }
}
const scrypt = (pw, salt) => new Promise((res, rej) => crypto.scrypt(String(pw), salt, 64, { N: 16384, r: 8, p: 1 }, (e, k) => (e ? rej(e) : res(k))));
async function hashPw(pw) { const salt = crypto.randomBytes(16); return `scrypt$${salt.toString('hex')}$${(await scrypt(pw, salt)).toString('hex')}`; }
async function checkPw(pw, stored) {
  const [kind, salt, hex] = String(stored).split('$'); if (kind !== 'scrypt') return false;
  const want = Buffer.from(hex, 'hex'); const got = await scrypt(pw, Buffer.from(salt, 'hex'));
  return want.length === got.length && crypto.timingSafeEqual(want, got);
}
const normEmail = (e) => String(e || '').trim().toLowerCase();
const authErr = (status, code, msg) => new ApiError(status, code, msg, { auth: true });

function userJson(u) {
  const meta = fromDb('json', u.meta) || {};
  return {
    id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email, email_confirmed_at: u.created_at, phone: '',
    confirmed_at: u.created_at, last_sign_in_at: u.last_sign_in_at, app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: meta,
    identities: [{ identity_id: u.id, id: u.id, user_id: u.id, identity_data: { email: u.email, email_verified: true, sub: u.id },
      provider: 'email', last_sign_in_at: u.last_sign_in_at, created_at: u.created_at, updated_at: u.updated_at, email: u.email }],
    created_at: u.created_at, updated_at: u.updated_at, is_anonymous: false,
  };
}
function issueSession(u, sessionId) {
  const sid = sessionId || crypto.randomUUID(); const now = Math.floor(Date.now() / 1000);
  const refresh = crypto.randomBytes(24).toString('base64url');
  db.prepare('insert into refresh_tokens (token, user_id, session_id, created_at) values (?, ?, ?, ?)').run(refresh, u.id, sid, nowIso());
  const user = userJson(u);
  const access = signJwt({ aud: 'authenticated', iss: 'novacare-ship', sub: u.id, email: u.email, role: 'authenticated', session_id: sid,
    iat: now, exp: now + TOKEN_TTL, user_metadata: user.user_metadata, app_metadata: user.app_metadata, is_anonymous: false });
  // no expires_at on purpose: the device computes it from its own clock, so clock drift between devices does not matter
  return { access_token: access, token_type: 'bearer', expires_in: TOKEN_TTL, refresh_token: refresh, user };
}
const userById = (id) => db.prepare('select * from users where id = ?').get(id);
// Rotated refresh tokens keep their time (reusable for 10 s); sign-out and password resets end them for good.
const ENDED = '1970-01-01T00:00:00.000Z';

async function authRoute(req, url, body, ctx) {
  const p = url.pathname.replace(/^\/auth\/v1/, '');
  if (p === '/health') return { name: 'GoTrue', version: 'novacare-ship', description: 'NovaCare ship server' };
  if (p === '/settings') return { external: { email: true }, disable_signup: false, mailer_autoconfirm: true, phone_autoconfirm: false };
  if (p === '/signup' && req.method === 'POST') {
    const email = normEmail(body.email); const pw = String(body.password || '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw authErr(400, 'validation_failed', 'Unable to validate email address: invalid format');
    if (pw.length < 6) throw authErr(422, 'weak_password', 'Password should be at least 6 characters.');
    if (db.prepare('select 1 from users where email = ?').get(email)) throw authErr(422, 'user_already_exists', 'User already registered');
    const id = crypto.randomUUID(); const t = nowIso(); const meta = body.data && typeof body.data === 'object' ? body.data : {};
    const pwHash = await hashPw(pw);
    tx(() => {
      db.prepare('insert into users (id, email, pw, meta, created_at, updated_at, last_sign_in_at) values (?, ?, ?, ?, ?, ?, ?)')
        .run(id, email, pwHash, JSON.stringify(meta), t, t, t);
      // same as handle_new_user() in supabase/setup.sql
      db.prepare('insert or ignore into profiles (id, name, email, crew_code, role, created_at) values (?, ?, ?, ?, ?, ?)')
        .run(id, meta.name || null, email, meta.crew || null, meta.role || 'Flight Engineer', t);
    });
    log(`new crew account ${email}`);
    return issueSession(userById(id));
  }
  if (p === '/token' && req.method === 'POST') {
    const grant = url.searchParams.get('grant_type');
    if (grant === 'password') {
      const u = db.prepare('select * from users where email = ?').get(normEmail(body.email));
      if (!u || !(await checkPw(body.password || '', u.pw))) throw authErr(400, 'invalid_credentials', 'Invalid login credentials');
      db.prepare('update users set last_sign_in_at = ? where id = ?').run(nowIso(), u.id);
      return issueSession(userById(u.id));
    }
    if (grant === 'refresh_token') {
      const r = db.prepare('select * from refresh_tokens where token = ?').get(String(body.refresh_token || ''));
      // a token used in the last 10 s may be used again (two tabs refreshing at the same moment)
      if (!r || (r.revoked_at && Date.now() - Date.parse(r.revoked_at) > 10000)) throw authErr(400, 'refresh_token_not_found', 'Invalid Refresh Token: Refresh Token Not Found');
      const u = userById(r.user_id); if (!u) throw authErr(400, 'user_not_found', 'User not found');
      if (!r.revoked_at) db.prepare('update refresh_tokens set revoked_at = ? where token = ?').run(nowIso(), r.token);
      return issueSession(u, r.session_id);
    }
    throw authErr(400, 'unsupported_grant_type', 'Unsupported grant type');
  }
  if (p === '/user') {
    if (!ctx.uid) throw authErr(401, 'no_authorization', 'This endpoint requires a valid Bearer token');
    const u = userById(ctx.uid); if (!u) throw authErr(403, 'user_not_found', 'User from sub claim in JWT does not exist');
    if (req.method === 'GET') return userJson(u);
    if (req.method === 'PUT') {
      if (body.data && typeof body.data === 'object') {
        const meta = { ...(fromDb('json', u.meta) || {}), ...body.data };
        db.prepare('update users set meta = ?, updated_at = ? where id = ?').run(JSON.stringify(meta), nowIso(), u.id);
      }
      if (body.password !== undefined) {
        if (String(body.password).length < 6) throw authErr(422, 'weak_password', 'Password should be at least 6 characters.');
        db.prepare('update users set pw = ?, updated_at = ? where id = ?').run(await hashPw(body.password), nowIso(), u.id);
      }
      return userJson(userById(u.id));
    }
  }
  if (p === '/logout' && req.method === 'POST') {
    if (ctx.claims) {
      const scope = url.searchParams.get('scope') || 'global';
      if (scope === 'global') db.prepare('update refresh_tokens set revoked_at = ? where user_id = ?').run(ENDED, ctx.uid);
      else db.prepare('update refresh_tokens set revoked_at = ? where session_id = ?').run(ENDED, ctx.claims.session_id || '');
    }
    return null;
  }
  if (p === '/recover') throw authErr(400, 'ship_reset', 'The ship server does not send email. Use the crew reset code on the ship reset page.');
  throw authErr(404, 'not_found', 'Not found');
}

/* ---------- crew password reset with the ship's reset code (no email on the ship) ---------- */
const resetTries = new Map(); // ip → [timestamps of failed attempts]
async function shipReset(body, ip) {
  const recent = (resetTries.get(ip) || []).filter((t) => Date.now() - t < 10 * 60e3);
  if (recent.length >= 8) throw new ApiError(429, 'too_many', 'Too many wrong attempts. Wait 10 minutes and try again.');
  const email = normEmail(body.email); const code = String(body.code || '').trim().toUpperCase().replace(/\s+/g, '');
  const pw = String(body.password || '');
  const want = Buffer.from(RESET_CODE.replace(/\s+/g, '')); const got = Buffer.from(code);
  const u = db.prepare('select * from users where email = ?').get(email);
  if (want.length !== got.length || !crypto.timingSafeEqual(want, got) || !u) {
    recent.push(Date.now()); resetTries.set(ip, recent);
    throw new ApiError(400, 'bad_code', 'That email and reset code do not match.');
  }
  if (pw.length < 6) throw new ApiError(400, 'weak_password', 'Password must be at least 6 characters.');
  db.prepare('update users set pw = ?, updated_at = ? where id = ?').run(await hashPw(pw), nowIso(), u.id);
  db.prepare('update refresh_tokens set revoked_at = ? where user_id = ?').run(ENDED, u.id);
  log(`password reset for ${email}`);
  return { ok: true };
}

/* ---------- HTTP ---------- */
const log = (...a) => console.log(new Date().toISOString().slice(0, 19).replace('T', ' '), ...a);
function send(res, status, data, headers = {}) {
  const body = data === null || data === undefined ? '' : typeof data === 'string' ? data : JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': typeof data === 'string' ? 'text/html; charset=utf-8' : 'application/json; charset=utf-8', ...headers });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []; let n = 0;
    req.on('data', (c) => { n += c.length; if (n > MAX_BODY) { reject(new ApiError(413, 'PGRST413', 'Payload too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => {
      const s = Buffer.concat(chunks).toString('utf8'); if (!s) return resolve({});
      try { resolve(JSON.parse(s)); } catch (e) { reject(new ApiError(400, 'PGRST102', 'Empty or invalid json')); }
    });
    req.on('error', reject);
  });
}
function cors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'authorization, apikey, content-type, prefer, accept');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, X-Supabase-Api-Version');
  res.setHeader('Access-Control-Max-Age', '600');
  res.setHeader('Cache-Control', 'no-store');
}
const RESET_PAGE = fs.readFileSync(path.join(__dirname, 'reset.html'), 'utf8');

const server = http.createServer(async (req, res) => {
  cors(req, res);
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const url = new URL(req.url, 'http://ship');
  const ip = req.headers['x-forwarded-for'] ? String(req.headers['x-forwarded-for']).split(',')[0].trim() : req.socket.remoteAddress;
  try {
    // who is calling: a valid access token, or anonymous (the app's API key on its own)
    const ctx = { uid: null, claims: null };
    const bearer = (String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i) || [])[1];
    if (bearer && bearer !== req.headers.apikey && bearer.split('.').length === 3) {
      const c = verifyJwt(bearer);
      if (c === 'expired') throw new ApiError(401, 'PGRST303', 'JWT expired', { auth: url.pathname.startsWith('/auth/') });
      if (!c) throw new ApiError(401, 'PGRST301', 'JWT could not be decoded', { auth: url.pathname.startsWith('/auth/') });
      ctx.uid = c.sub; ctx.claims = c;
    }
    const body = ['POST', 'PUT', 'PATCH'].includes(req.method) ? await readBody(req) : {};

    if (url.pathname === '/' || url.pathname === '/health') return send(res, 200, { ok: true, service: 'novacare-ship', time: nowIso() });
    if (url.pathname === '/reset' && req.method === 'GET') return send(res, 200, RESET_PAGE);
    if (url.pathname === '/ship/v1/reset' && req.method === 'POST') return send(res, 200, await shipReset(body, ip));
    if (url.pathname.startsWith('/auth/v1/')) {
      const out = await authRoute(req, url, body, ctx);
      return out === null ? (res.writeHead(204), res.end()) : send(res, 200, out);
    }
    const m = url.pathname.match(/^\/rest\/v1\/(rpc\/)?([a-z_]+)$/);
    if (m) {
      if (m[1]) {
        if (!RPC[m[2]]) throw new ApiError(404, 'PGRST202', `Could not find the function public.${m[2]} without parameters in the schema cache`);
        return send(res, 200, RPC[m[2]](ctx.uid, body));
      }
      const t = m[2]; if (!TABLES[t]) throw new ApiError(404, 'PGRST205', `Could not find the table 'public.${t}' in the schema cache`);
      const params = url.searchParams; const prefer = String(req.headers.prefer || '');
      const wantRows = /return=representation/.test(prefer); const cols = columnsOf(t, params.get('select'));
      const shape = (rows) => rows.map((r) => pick(r, cols));
      if (req.method === 'GET' || req.method === 'HEAD') {
        let rows = readRows(t, params, ctx.uid, TABLES[t].select);
        const off = +params.get('offset') || 0; const lim = params.get('limit') !== null ? +params.get('limit') : Infinity;
        rows = rows.slice(off, off + lim);
        const range = `${rows.length ? off : '*'}${rows.length ? '-' + (off + rows.length - 1) : ''}/*`;
        if (/application\/vnd\.pgrst\.object\+json/.test(String(req.headers.accept || ''))) {
          if (rows.length !== 1) throw new ApiError(406, 'PGRST116', 'JSON object requested, multiple (or no) rows returned', { details: `The result contains ${rows.length} rows` });
          return send(res, 200, shape(rows)[0], { 'Content-Range': range });
        }
        return send(res, 200, req.method === 'HEAD' ? null : shape(rows), { 'Content-Range': range });
      }
      let rows;
      if (req.method === 'POST') rows = restInsert(t, body, params, prefer, ctx.uid);
      else if (req.method === 'PATCH') rows = restUpdate(t, body, params, ctx.uid);
      else if (req.method === 'DELETE') rows = restDelete(t, params, ctx.uid);
      else throw new ApiError(405, 'PGRST117', 'Unsupported HTTP method');
      if (t === 'alerts' && req.method !== 'DELETE') rows.forEach((a) => log(`alert ${a.status} ${a.type} on ${a.crew_code} from ${a.from_name || '?'}`));
      return wantRows ? send(res, req.method === 'POST' ? 201 : 200, shape(rows)) : (res.writeHead(req.method === 'POST' ? 201 : 204), res.end());
    }
    throw new ApiError(404, 'not_found', 'Not found');
  } catch (e) {
    if (!(e instanceof ApiError)) { console.error(e); e = new ApiError(500, 'XX000', 'Ship server error: ' + (e.message || e)); }
    if (e.extra.auth) return send(res, e.status, { code: e.status, error_code: e.code, msg: e.message });
    return send(res, e.status, { code: e.code, message: e.message, details: e.extra.details || null, hint: null });
  }
});

server.listen(PORT, () => {
  log(`NovaCare ship server on port ${PORT} · data in ${DATA_DIR}`);
  log(`Crew password-reset code: ${RESET_CODE}${process.env.SHIP_RESET_CODE ? '' : '  (set SHIP_RESET_CODE to choose your own)'}`);
});
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { server.close(); try { db.close(); } catch (e) { /* ignore */ } process.exit(0); });
