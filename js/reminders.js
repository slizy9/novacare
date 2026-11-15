/* NOVACARE — reminders. Nothing pops up and blocks the screen: each pending task gets a gentle
   reminder at its time of day (a notification when allowed, and the bell in the header), once per
   mission day. One tap does it, marks it done or snoozes it for an hour. */

/* When each routine item becomes worth a reminder (local hour). */
const REMIND_AT = { vitals: 7, mind: 7, envr: 9, vitd: 9, ex: 15, h2o: 16, social: 18, wind: 21 };

const Reminders = (() => {
  const key = () => 'novacare.remind:' + (Auth.user() ? Auth.user().id : '-');
  const read = () => { try { return JSON.parse(localStorage.getItem(key())) || {}; } catch (e) { return {}; } };
  const write = (o) => { try { localStorage.setItem(key(), JSON.stringify(o)); } catch (e) { /* ignore */ } };
  const hour = () => new Date().getHours();

  /** Everything pending right now, most important first. */
  function list() {
    if (!Auth.user() || !state) return [];
    const day = Engine.today(); const env = Engine.env(); const out = []; const snooze = read().snooze || {};
    if (Status.due()) out.push({ id: 'status', icon: 'checks', title: 'How do you feel?', detail: 'One tap', act: 'status', go: 'Answer', p: 1 });
    // vitals + mind are one quick check-in; it is a choice, so "Not today" removes it
    if (!day.checkinAt && !Engine.checkedIn(day) && !day.skipCheckin) out.push({ id: 'checkin', icon: 'plus', title: 'Daily check-in', detail: 'About a minute, all on one screen', act: 'checkin', go: 'Start', p: 2 });
    // only what matters now; the rest of the daily routine lives in My health → Today, not in the bell.
    // Exercise is the one routine item worth a nudge late in the day, because missing it costs bone and muscle.
    const ex = TASKS.find((t) => t.id === 'ex');
    if (ex && !Engine.taskDone(ex, day) && hour() >= 17) out.push({ id: 'task:ex', icon: 'pulse', title: ex.label, detail: typeof ex.detail === 'function' ? ex.detail(env) : ex.detail, act: 'remlog', v: 'ex', go: 'Log', p: 3 });
    const prof = Medical.mine();
    if (Medical.empty(prof)) out.push({ id: 'profile', icon: 'care', title: 'Add your allergies', detail: 'One minute — makes medicine checks and emergencies safe', act: 'sub', v: 'medical', go: 'Open', p: 5 });
    return out.filter((r) => !(snooze[r.id] && Date.now() < snooze[r.id])).sort((a, b) => a.p - b.p);
  }
  function snooze(id, minutes = 60) { const o = read(); o.snooze = { ...(o.snooze || {}), [id]: Date.now() + minutes * 60000 }; write(o); }

  /* ---------- notifications (only reminders: tap opens the app, nothing is done for you) ---------- */
  const can = () => 'Notification' in window;
  const on = () => can() && Notification.permission === 'granted' && read().off !== true;
  async function enable() {
    if (!can()) return 'unsupported';
    const p = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
    const o = read(); o.off = p !== 'granted'; write(o); return p;
  }
  function disable() { const o = read(); o.off = true; write(o); }
  async function show(r) {
    const title = `NovaCare · ${r.title}`; const body = r.detail;
    try {
      const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
      if (reg) { await reg.showNotification(title, { body, tag: r.id, data: { id: r.id }, renotify: false }); return; }
    } catch (e) { /* fall back to a page notification */ }
    try { const n = new Notification(title, { body, tag: r.id }); n.onclick = () => { window.focus(); n.close(); run(r.id); }; } catch (e) { /* not supported here */ }
  }
  /** Check every minute: remind once per item per mission day. */
  function tick(silent) {
    if (!Auth.user() || !state) return;
    const o = read(); o.sent = o.sent || {}; const fresh = [];
    list().forEach((r) => { const k = `${r.id}@${state.md}`; if (!o.sent[k]) { o.sent[k] = Date.now(); fresh.push(r); } });
    if (!fresh.length) return;
    if (silent) { write(o); return; } // on opening the app nothing pops up: pending items wait under the bell
    // keep the record small
    const ks = Object.keys(o.sent); if (ks.length > 300) ks.slice(0, ks.length - 300).forEach((k) => delete o.sent[k]);
    write(o);
    if (on()) fresh.slice(0, 3).forEach(show);
    else if (typeof toast === 'function') toast(`Reminder: ${fresh[0].title}${fresh.length > 1 ? ` (+${fresh.length - 1} more)` : ''} — tap the bell`);
    if (typeof renderTop === 'function' && !ui.modal) renderTop();
  }
  /** Open a reminder's action (from the bell or a notification tap). */
  function run(id) { const r = list().find((x) => x.id === id); if (r && typeof actions !== 'undefined' && actions[r.act]) actions[r.act]({ v: r.v, id: r.id }); }
  return { list, snooze, enable, disable, on, can, tick, run, permission: () => (can() ? Notification.permission : 'unsupported') };
})();

/* ---------- views ---------- */
function remindersHtml() {
  const items = Reminders.list(); const perm = Reminders.permission();
  const note = perm === 'unsupported' ? 'This browser cannot show notifications — reminders appear here and under the bell.'
    : perm === 'denied' ? 'Notifications are blocked in the browser settings for this site. Reminders still appear here.'
    : Reminders.on() ? 'Notifications are on: you get a gentle reminder at the right time of day.' : 'Turn on notifications to be reminded even when NovaCare is in the background.';
  return `<div class="sheet narrow rem" role="dialog" aria-modal="true" aria-label="Reminders">
    <header><div><p class="kicker">Reminders</p><h2>${items.length ? `${items.length} thing${items.length > 1 ? 's' : ''} to do` : 'You are all set'}</h2></div><button class="x" data-act="close" aria-label="Close">${icon('x')}</button></header>
    <div class="sheet-b one">
      ${items.length ? `<ul class="rem-list">${items.map((r) => `<li>
          <span class="rem-ic">${icon(r.icon)}</span><div class="grow"><b>${esc(r.title)}</b><small>${esc(r.detail)}</small></div>
          <button class="btn ghost sm" data-act="remlater" data-id="${r.id}" title="Remind me in an hour">Later</button>
          <button class="btn primary sm" data-act="${r.act}" data-v="${r.v || ''}" data-id="${r.id}">${esc(r.go)}</button></li>`).join('')}</ul>`
        : '<p class="muted">Nothing pending right now. NovaCare will remind you when something is due.</p>'}
      <div class="rem-note">${icon('bell')}<p>${note}</p>
        ${perm !== 'unsupported' && perm !== 'denied' ? (Reminders.on() ? '<button class="btn ghost sm" data-act="remoff">Turn off</button>' : '<button class="btn primary sm" data-act="remon">Turn on</button>') : ''}</div>
    </div></div>`;
}
