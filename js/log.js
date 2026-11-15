/* NOVACARE — mission log terminal.
   One chronological record of what happened: check-ins, quick status answers, calls for help and
   emergencies (raised and resolved), ship inventory changes and notes typed by the crew member.
   Notes are saved with the person's mission data, so they sync with everything else.
   Commands: plain text adds a note; /help, /filter <kind>, /export, /clear (clears the filter). */

const LOG_KINDS = { all: 'All', health: 'Health', alert: 'Alerts', supply: 'Inventory', note: 'Notes' };

const MissionLog = (() => {
  // the moment a mission day started, for entries that only know their day
  const dayStart = (md) => { const s = state.startDate ? new Date(state.startDate + 'T00:00') : null; if (!s) return null; s.setDate(s.getDate() + md - 1); return s.toISOString(); };
  const notes = () => (Array.isArray(state.log) ? state.log.filter((n) => n.at >= LOG_EPOCH) : []);

  function entries() {
    if (!state || !state.days) return [];
    const out = []; const me = state.name || (Auth.user() && Auth.user().name) || 'You';
    // health: daily check-ins and readings
    Object.keys(state.days).map(Number).filter((d) => d <= state.md && d > state.md - 60).forEach((d) => {
      const day = state.days[d]; const n = Object.keys(day.vals || {}).length; if (!n) return;
      const flagged = Object.entries(day.vals).filter(([id, v]) => IND[id] && Engine.classify(IND[id], v).level >= 2).map(([id]) => IND[id].short);
      out.push({ at: day.checkinAt || dayStart(d), md: d, kind: 'health', who: me,
        text: `${day.checkinAt ? 'Check-in saved' : 'Readings logged'} — ${n} reading${n > 1 ? 's' : ''}${flagged.length ? ` · out of range: ${flagged.join(', ')}` : ''}`, level: flagged.length ? 2 : 0 });
    });
    // health: quick status ("How do you feel")
    (Array.isArray(state.updates) ? state.updates : []).forEach((u) => {
      const feel = { 5: 'great', 4: 'good', 3: 'okay', 2: 'not well', 1: 'bad' }[u.answers && u.answers.feel] || '—';
      out.push({ at: u.at, md: u.md, kind: 'health', who: me, text: `Quick status: feels ${feel}${u.findings && u.findings.length ? ` · ${u.findings.join(', ')}` : ''}`, level: u.level || 0 });
    });
    // alerts: raised and resolved
    Crew.alerts().forEach((a) => {
      if (a.type === 'talk') { // a private request: only the person and the Crew Medical Officer see it
        const u = Auth.user(); if (!u || (a.fromId !== u.id && u.role !== 'Crew Medical Officer')) return;
        out.push({ at: a.createdAt, md: a.md, kind: 'health', who: a.fromName, text: `${a.fromName} asked the Crew Medical Officer for a private conversation`, level: 0 }); return;
      }
      if (isRecord(a)) { // approvals and discharges signed by the Crew Medical Officer
        const [id, src] = String(a.note || '').split('|');
        out.push({ at: a.createdAt, md: a.md, kind: 'health', who: a.fromName, text: a.type === 'care' ? `Discharge signed for ${a.aboutName}` : a.type === 'approve' ? `Protocol approved: ${id} (${Protocols.nameOf(id)}) — checked against ${src}` : `Approval withdrawn: ${id}`, level: 0 });
        return;
      }
      const what = HELP_TYPES[a.type] ? `${a.fromName} asked for help${a.note ? ` — “${a.note}”` : ''}` : `EMERGENCY for ${a.aboutName}: ${alertName(a.type)} (raised by ${a.fromName})`;
      out.push({ at: a.createdAt, md: a.md, kind: 'alert', who: a.fromName, text: what, level: 3 });
      if (a.status === 'resolved') out.push({ at: a.resolvedAt || a.createdAt, md: a.md, kind: 'alert', who: '', text: `Resolved: ${HELP_TYPES[a.type] ? `help request from ${a.fromName}` : `${alertName(a.type)} for ${a.aboutName}`}`, level: 0 });
    });
    // ship inventory: last change of each item
    if (typeof Inventory !== 'undefined') Inventory.items().forEach((i) => {
      if (!i.at) return;
      out.push({ at: i.at, md: i.md, kind: 'supply', who: i.by || '', text: `${i.name}: ${i.qty} ${i.unit}${Inventory.level(i) === 3 ? ' — OUT' : Inventory.level(i) === 1 ? ' — low' : ''}`, level: Inventory.level(i) >= 3 ? 2 : Inventory.level(i) });
    });
    // decisions taken on NovaCare's findings, and the record of each emergency
    (Array.isArray(state.decisions) ? state.decisions : []).forEach((d) => out.push({ at: d.at, md: d.md, kind: 'health', who: me, text: `Decision: ${(typeof DECISION_ACTS !== 'undefined' && DECISION_ACTS[d.act]) || d.act} — ${d.title} (rule ${d.rule})`, level: 0 }));
    (Array.isArray(state.emgLog) ? state.emgLog : []).forEach((r) => { const steps = (r.steps || []).filter((x) => typeof x === 'string'); const asked = r.asked || []; const min = Math.max(1, Math.round((new Date(r.end) - new Date(r.start)) / 60000));
      out.push({ at: r.end, md: r.md, kind: 'alert', who: r.rescuer, text: `Emergency record — ${r.name} · patient ${r.patient} · ${(r.steps || []).length} of ${r.total} steps in ${min} min${steps.length ? ` (step ${steps.join(', ')})` : ''}${asked.length ? ` · asked: ${asked.join('; ')}` : ''}`, level: 0 }); });
    // care cases: opened and discharged
    Object.values(state.cases || {}).forEach((c) => {
      out.push({ at: c.openedAt, md: c.openedMd, kind: 'health', who: me, text: `Follow-up opened: ${c.title} (rule ${c.rule})`, level: c.level });
      if (c.status === 'discharged') out.push({ at: c.dischargedAt, md: c.dischargedMd, kind: 'health', who: me, text: `Discharged: ${c.title} — ${c.by}`, level: 0 });
    });
    notes().forEach((n) => out.push({ at: n.at, md: n.md, kind: 'note', who: n.by, text: n.text, level: 0 }));
    return out.filter((e) => e.at && e.at >= LOG_EPOCH).sort((a, b) => a.at.localeCompare(b.at)).slice(-300);
  }
  function add(text) {
    text = String(text || '').trim().slice(0, 300); if (!text) return null;
    const n = { at: new Date().toISOString(), md: state.md, by: state.name || Auth.user().name, text };
    state.log = [...notes(), n].slice(-500); Engine.save(); return n;
  }
  function toText(list) {
    return list.map((e) => `[MD ${e.md ?? '?'} ${new Date(e.at).toLocaleString(I18N.locale(), { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}] ${e.kind.toUpperCase().padEnd(6)} ${e.who ? e.who + ': ' : ''}${e.text}`).join('\n');
  }
  return { entries, add, toText };
})();

function viewLog() {
  const f = LOG_KINDS[ui.logFilter] ? ui.logFilter : 'all';
  const all = MissionLog.entries(); const list = f === 'all' ? all : all.filter((e) => e.kind === f);
  const t = (iso) => new Date(iso).toLocaleTimeString(I18N.locale(), { hour: '2-digit', minute: '2-digit', hour12: false });
  const tag = { health: 'HEALTH', alert: 'ALERT', supply: 'SUPPLY', note: 'NOTE' };
  let lastMd = null;
  const lines = list.map((e) => {
    const sep = e.md !== lastMd ? `<li class="lg-day">— Mission day ${e.md ?? '?'} —</li>` : ''; lastMd = e.md;
    return `${sep}<li class="lg-${e.kind} ${lc(e.level || 0)}"><span class="lg-t">${t(e.at)}</span><span class="lg-k">${tag[e.kind]}</span><span class="lg-x">${e.who ? `<b>${esc(e.who)}</b> ` : ''}${esc(e.text)}</span></li>`;
  }).join('');
  return pageHead('Mission log', `${esc(Missions.label())} · everything that happened, in order`,
    `<button class="btn ghost" data-act="logexport">${icon('download')}Export log</button>`) + missionTabs() + `
    <section class="term" aria-label="Mission log terminal">
      <div class="term-bar"><span class="term-dots"><i></i><i></i><i></i></span><span>novacare://log/${esc(Auth.user().crew || 'personal')}</span>
        <div class="term-f">${Object.entries(LOG_KINDS).map(([k, l]) => `<button class="${f === k ? 'on' : ''}" data-act="logfilter" data-v="${k}">${l}</button>`).join('')}</div></div>
      <ol class="term-out" id="term-out">${lines || '<li class="lg-day">No entries yet. Type a note below, or do a check-in.</li>'}${ui.logMsg ? `<li class="lg-sys">${esc(ui.logMsg)}</li>` : ''}</ol>
      <form id="log-form" class="term-in"><label for="log-in">&gt;</label><input id="log-in" name="q" type="text" maxlength="300" autocomplete="off" spellcheck="false" placeholder="Type a note and press Enter — or /help"></form>
    </section>
    <p class="muted small foot-note">${icon('shield')}Notes are saved with your mission data and sync with it. Alerts and inventory changes come from the whole crew.</p>`;
}

/* a line typed into the terminal: a command, or a note */
function logCommand(raw) {
  const q = String(raw || '').trim(); if (!q) return;
  ui.logMsg = '';
  if (q[0] === '/') {
    const [cmd, arg] = q.slice(1).split(/\s+/);
    const rest = q.slice(1).split(/\s+/).slice(2).join(' ');
    if (cmd === 'help') ui.logMsg = 'Commands: /filter health|alerts|inventory|notes|all · /export · /clear · /protocols · /approve ID document · /revoke ID · anything else is saved as a note';
    else if (cmd === 'protocols') { const s = Protocols.summary(); ui.logMsg = `${s.approved} of ${s.total} protocols approved by a medical officer.${s.drafts.length ? ` Drafts: ${s.drafts.slice(0, 12).join(', ')}${s.drafts.length > 12 ? ` and ${s.drafts.length - 12} more` : ''}.` : ''}${Protocols.signer() ? ' Approve with /approve ID document.' : ' Only the Crew Medical Officer can approve.'}`; }
    else if (cmd === 'approve') { ui.logMsg = arg ? Protocols.approve(arg, rest) : 'Usage: /approve KB-MED-09 ISS Medical Checklist'; }
    else if (cmd === 'revoke') { ui.logMsg = arg ? Protocols.revoke(arg) : 'Usage: /revoke KB-MED-09'; }
    else if (cmd === 'filter') { const k = { alerts: 'alert', alert: 'alert', inventory: 'supply', supply: 'supply', notes: 'note', note: 'note', health: 'health', all: 'all' }[String(arg || '').toLowerCase()]; if (k) ui.logFilter = k; else ui.logMsg = 'Unknown filter. Try /filter alerts'; }
    else if (cmd === 'clear') ui.logFilter = 'all';
    else if (cmd === 'export') { actions.logexport(); return; }
    else ui.logMsg = `Unknown command “/${cmd}”. Type /help`;
  } else { MissionLog.add(q); }
  render();
  const i = $('#log-in'); if (i) i.focus();
}
