/* NOVACARE — languages.

   The app is written in English. Every other language is a dictionary (js/lang/*.js):
     I18N.add({ 'English text': { es: '…', pt: '…', fr: '…' } })
   Each key is the visible text of ONE text node (or a placeholder / aria-label / title), trimmed.
     {n}  any number in the text (digits are matched automatically, e.g. "Day {n} of {n}")
     {s}  any other value put into the sentence (a name, a title): "Signed in as {s}"
   The translator watches the page and swaps the English text for the chosen language as it is drawn,
   so the views keep their English source and need no change. Anything inside translate="no" is left
   alone (a person's own words, and answers already written in the language of the question).

   Protocols of the knowledge base have their own translations (KB_I18N, js/lang/kb*.js):
     KB_I18N['MED-01'] = { es: { t: title, q: 'words people use', a: text, s: [steps], e: escalate }, pt: …, fr: … } */

const LANGS = {
  en: { name: 'English', locale: 'en-US', voice: 'en-US' },
  es: { name: 'Español', locale: 'es-ES', voice: 'es-ES' },
  pt: { name: 'Português', locale: 'pt-BR', voice: 'pt-BR' },
  fr: { name: 'Français', locale: 'fr-FR', voice: 'fr-FR' },
};
const KB_I18N = {};

const I18N = (() => {
  const KEY = 'novacare.lang';
  const dict = Object.create(null); // normalized key → { es, pt, fr }
  const pats = Object.create(null); // first word → [{ rx, types, v }]
  const NUM = /\d+(?:[.,:]\d+)*/g;
  const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
  const firstWord = (s) => { const m = /^([A-Za-z][A-Za-z'’]*)/.exec(s); return m ? m[1].toLowerCase() : ''; };
  // English is the main language: the page opens in English until someone picks another one in the menu
  let lang = (() => {
    try { const s = localStorage.getItem(KEY); if (s && LANGS[s]) return s; } catch (e) { /* no storage */ }
    return 'en';
  })();

  /* Digits in a translation become {n} too when the count matches, so "Day 3 of 180" and "Day 4 of 180" share one entry. */
  function numberize(key, v) {
    const want = (key.match(/\{n\}/g) || []).length; if (!want) return v;
    const out = {};
    for (const [l, txt] of Object.entries(v)) {
      if (typeof txt !== 'string') continue;
      if (/\{n\}/.test(txt)) { out[l] = txt; continue; }
      const got = (txt.match(NUM) || []).length; out[l] = got === want ? txt.replace(NUM, '{n}') : txt;
    }
    return out;
  }
  function addPattern(key, v) {
    const types = []; const src = key.replace(/[.*+?^$()|[\]\\]/g, '\\$&')
      .replace(/\\?\{(s|n)\\?\}|\{(s|n)\}/g, (m) => { const ty = /s/.test(m) ? 's' : 'n'; types.push(ty); return ty === 's' ? '(.+?)' : '(\\d+(?:[.,:]\\d+)*)'; });
    const fw = firstWord(key); (pats[fw] = pats[fw] || []).push({ rx: new RegExp('^' + src + '$'), types, v });
  }
  /** Add translations: { 'English': { es, pt, fr } }. Later files win. */
  function add(obj) {
    for (const [k0, v] of Object.entries(obj || {})) {
      if (!v || typeof v !== 'object') continue;
      const k = norm(k0); if (!k) continue;
      if (/\{s\}/.test(k)) { addPattern(k, v); continue; }
      const key = k.replace(NUM, '{n}');
      dict[key] = Object.assign(dict[key] || {}, numberize(key, v));
    }
  }

  function look(core, L) {
    const nums = []; const k = core.replace(NUM, (x) => { nums.push(x); return '{n}'; });
    const d = dict[k];
    if (d && d[L]) { let i = 0; return d[L].replace(/\{n\}/g, () => (nums[i] !== undefined ? nums[i++] : '')); }
    const fw = firstWord(core);
    const list = (pats[fw] || []).concat(fw ? pats[''] || [] : []);
    for (const p of list) {
      const m = p.rx.exec(core); if (!m || !p.v[L]) continue;
      const caps = { n: [], s: [] };
      p.types.forEach((ty, i) => caps[ty].push(ty === 's' ? (look(m[i + 1], L) || m[i + 1]) : m[i + 1]));
      let ni = 0, si = 0;
      return p.v[L].replace(/\{(n|s)\}/g, (_, ty) => (ty === 'n' ? caps.n[ni++] : caps.s[si++]) || '');
    }
    return null;
  }
  /** Translate one piece of English text into language L (keeps its surrounding spaces). Unknown text stays as it is. */
  function t(text, L = lang) {
    if (L === 'en' || text == null) return text;
    const s = String(text); const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s); const core = norm(m[2]);
    if (!core || !/[A-Za-z]/.test(core)) return s;
    let out = look(core, L);
    if (out == null) { // "● On track", "▲ Watch", "(note)": translate what is inside the symbols
      const w = /^([^A-Za-z0-9]+)([\s\S]*?)([^A-Za-z0-9]*)$/.exec(core);
      if (w && (w[1] || w[3]) && w[2]) { const inner = look(w[2], L); if (inner != null) out = w[1] + inner + w[3]; }
    }
    return out == null ? s : m[1] + out + m[3];
  }

  /* ---------- the page ---------- */
  const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
  const SKIP = 'script,style,textarea,code,pre,noscript,[translate="no"],[contenteditable="true"]';
  const textMem = new WeakMap(); // text node → { en, out }
  const attrMem = new WeakMap(); // element → { attr: { en, out } }
  function doText(n, L) {
    const r = textMem.get(n); const en = r && n.nodeValue === r.out ? r.en : n.nodeValue;
    const out = L === 'en' ? en : t(en, L);
    if (out !== n.nodeValue) n.nodeValue = out;
    if (out !== en || r) textMem.set(n, { en, out });
  }
  function doAttrs(el, L) {
    let mem = attrMem.get(el);
    ATTRS.forEach((a) => {
      if (!el.hasAttribute(a)) return; const cur = el.getAttribute(a); const r = mem && mem[a];
      const en = r && cur === r.out ? r.en : cur; const out = L === 'en' ? en : t(en, L);
      if (out !== cur) el.setAttribute(a, out);
      if (out !== en || r) { mem = mem || {}; mem[a] = { en, out }; attrMem.set(el, mem); }
    });
  }
  const skipped = (el) => !!(el && el.closest && el.closest(SKIP));
  function apply(root, L = lang) {
    if (!root) return;
    if (root.nodeType === 3) { if (!skipped(root.parentElement)) doText(root, L); return; }
    if (root.nodeType !== 1 && root.nodeType !== 11) return;
    if (root.nodeType === 1 && skipped(root)) return;
    if (root.nodeType === 1) doAttrs(root, L);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.nodeType === 1 && n.matches(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    for (let n = w.nextNode(); n; n = w.nextNode()) { if (n.nodeType === 3) doText(n, L); else doAttrs(n, L); }
  }
  /** Translate an HTML string (used for answers written for one language). */
  function html(str, L) {
    if (!L || L === 'en' || typeof document === 'undefined') return str;
    const tpl = document.createElement('template'); tpl.innerHTML = str; apply(tpl.content, L); return tpl.innerHTML;
  }

  let mo = null; let titleEn = null;
  function watch() {
    if (mo || typeof MutationObserver === 'undefined' || !document.body) return;
    mo = new MutationObserver((recs) => {
      if (lang === 'en') return;
      recs.forEach((r) => {
        if (r.type === 'childList') r.addedNodes.forEach((n) => apply(n));
        else if (r.type === 'characterData') { if (!skipped(r.target.parentElement)) doText(r.target, lang); }
        else if (r.type === 'attributes' && !skipped(r.target)) doAttrs(r.target, lang);
      });
      mo.takeRecords(); // our own changes
    });
    mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  function setTitle() { if (titleEn == null) titleEn = document.title; document.title = t(titleEn, lang); }

  function set(L) {
    if (!LANGS[L]) return;
    lang = L; try { localStorage.setItem(KEY, L); } catch (e) { /* ignore */ }
    document.documentElement.lang = L;
    apply(document.body, L); if (mo) mo.takeRecords(); setTitle();
    listeners.forEach((f) => { try { f(L); } catch (e) { /* ignore */ } });
  }
  const listeners = [];
  const onChange = (f) => listeners.push(f);

  /** Which language a question is written in (falls back to the app language). */
  const WORDS = {
    en: 'the a an is are am i my me you have has do does can could should how what why when where with of to in on feel it this that and or not my head hurts pain take give'.split(' '),
    es: 'el la los las de del que y en un una por para con no es mi me tengo duele estoy siento puedo como cual cuál qué hay muy pero yo tomar dar dolor cabeza estomago estómago tambien también mucho muchos gases'.split(' '),
    pt: 'o os as de do da que e em um uma por para com não nao é meu minha eu tenho dói doi estou sinto posso como qual muito mas você voce dor cabeça cabeca tomar dar estômago estomago também gases'.split(' '),
    fr: 'le la les de des du que et en un une pour avec ne pas est mon ma mes je j ai suis me sens peux comment quel quelle très tres mais vous mal tête tete prendre donner estomac aussi beaucoup'.split(' '),
  };
  const SETS = Object.fromEntries(Object.entries(WORDS).map(([l, w]) => [l, new Set(w)]));
  function detect(q, fallback = lang) {
    const raw = String(q || '').toLowerCase();
    const score = { en: 0, es: 0, pt: 0, fr: 0 };
    if (/[ñ¿¡]/.test(raw)) score.es += 3;
    if (/[ãõ]|ç[ãaoõ]|\bvocê\b|\bnão\b/.test(raw)) score.pt += 3;
    if (/[èêëîôûùœ]|\bj['’]|\bqu['’]|\bl['’]|\bd['’]/.test(raw)) score.fr += 3;
    raw.replace(/[’']/g, ' ').split(/[^a-zà-ÿœç]+/).filter(Boolean).forEach((w) => { for (const l in SETS) if (SETS[l].has(w)) score[l] += 1; });
    const best = Object.entries(score).sort((a, b) => b[1] - a[1]);
    if (!best[0][1] || best[0][1] === best[1][1]) return LANGS[fallback] ? fallback : 'en';
    return best[0][0];
  }
  /** A protocol in language L: { title, q, a, steps, esc } (English when there is no translation). */
  function kb(e, L) {
    const x = L !== 'en' && KB_I18N[e.id] && KB_I18N[e.id][L];
    return x ? { title: x.t || e.title, a: x.a || e.a, steps: x.s && x.s.length ? x.s : e.steps, esc: x.e || e.esc, translated: true }
      : { title: e.title, a: e.a, steps: e.steps, esc: e.esc, translated: L === 'en' };
  }
  /** Words of every language for the search index of one protocol. */
  const kbWords = (id) => Object.values(KB_I18N[id] || {}).map((x) => `${x.t || ''} ${x.q || ''}`).join(' ');

  /** The language menu (a <select>), for the top bar and the sign-in screen. */
  const picker = (cls = '') => `<label class="lang-pick ${cls}" translate="no" title="Language"><span class="vh">Language</span><span class="lp-code" aria-hidden="true">${lang.toUpperCase()}</span><select data-lang-pick aria-label="Language">${Object.entries(LANGS).map(([k, v]) => `<option value="${k}" ${k === lang ? 'selected' : ''}>${v.name}</option>`).join('')}</select></label>`;

  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
    document.addEventListener('change', (ev) => { if (ev.target && ev.target.matches && ev.target.matches('[data-lang-pick]')) set(ev.target.value); });
    const start = () => { watch(); if (lang !== 'en') { apply(document.body); setTitle(); } };
    if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
    // native dialogs too
    ['alert', 'confirm', 'prompt'].forEach((f) => { const o = window[f]; if (o) window[f] = (m, ...r) => o.call(window, t(m), ...r); });
  }

  return { add, t, html, apply, set, onChange, detect, kb, kbWords, picker, lang: () => lang, locale: (L = lang) => LANGS[L].locale, voice: (L = lang) => LANGS[L].voice, size: () => Object.keys(dict).length };
})();

/* Texts of the language layer itself and of answers written in the language of the question. */
I18N.add({
  'Language': { es: 'Idioma', pt: 'Idioma', fr: 'Langue' },
  '· protocol text in English': { es: '· texto del protocolo en inglés', pt: '· texto do protocolo em inglês', fr: '· texte du protocole en anglais' },
  'About the symptom': { es: 'Sobre el síntoma', pt: 'Sobre o sintoma', fr: 'À propos du symptôme' },
  'Wording with the local model…': { es: 'Redactando con el modelo local…', pt: 'Redigindo com o modelo local…', fr: 'Rédaction avec le modèle local…' },
  'Worded by the local model ({s}) from the protocol above — it cannot add facts or doses.': { es: 'Redactado por el modelo local ({s}) a partir del protocolo anterior: no puede añadir datos ni dosis.', pt: 'Redigido pelo modelo local ({s}) a partir do protocolo acima — ele não pode acrescentar fatos nem doses.', fr: 'Rédigé par le modèle local ({s}) à partir du protocole ci-dessus — il ne peut ajouter ni faits ni doses.' },
  'Medical': { es: 'Médico', pt: 'Médico', fr: 'Médical' },
  'Wellbeing': { es: 'Bienestar', pt: 'Bem-estar', fr: 'Bien-être' },
  'Ship': { es: 'Nave', pt: 'Nave', fr: 'Vaisseau' },
  'Escalate': { es: 'Cuándo avisar', pt: 'Quando avisar', fr: 'Quand alerter' },
  'Escalate:': { es: 'Cuándo avisar:', pt: 'Quando avisar:', fr: 'Quand alerter :' },
  'Related:': { es: 'Relacionado:', pt: 'Relacionado:', fr: 'Voir aussi :' },
  'About the symptom:': { es: 'Sobre el síntoma:', pt: 'Sobre o sintoma:', fr: 'À propos du symptôme :' },
  'Related': { es: 'Relacionado', pt: 'Relacionado', fr: 'Voir aussi' },
  'Source: onboard protocol': { es: 'Fuente: protocolo a bordo', pt: 'Fonte: protocolo de bordo', fr: 'Source : protocole de bord' },
  'Onboard protocol': { es: 'Protocolo a bordo', pt: 'Protocolo de bordo', fr: 'Protocole de bord' },
  'knowledge base': { es: 'base de conocimiento', pt: 'base de conhecimento', fr: 'base de connaissances' },
  'Open emergency help': { es: 'Abrir ayuda de emergencia', pt: 'Abrir ajuda de emergência', fr: 'Ouvrir l’aide d’urgence' },
  'no onboard protocol': { es: 'sin protocolo a bordo', pt: 'sem protocolo de bordo', fr: 'aucun protocole de bord' },
  'approved by {s} on {s}, checked against {s}': { es: 'aprobado por {s} el {s}, verificado con {s}', pt: 'aprovado por {s} em {s}, conferido com {s}', fr: 'approuvé par {s} le {s}, vérifié avec {s}' },
  'approved by {s} on {s}': { es: 'aprobado por {s} el {s}', pt: 'aprovado por {s} em {s}', fr: 'approuvé par {s} le {s}' },
  'draft — not yet approved by a medical officer; confirm with the Crew Medical Officer': { es: 'borrador: aún sin aprobar por un médico; confírmalo con el oficial médico de la tripulación', pt: 'rascunho — ainda não aprovado por um médico; confirme com o oficial médico da tripulação', fr: 'brouillon — pas encore approuvé par un médecin ; vérifiez avec l’officier médical de l’équipage' },
  'Skip to content': { es: 'Saltar al contenido', pt: 'Pular para o conteúdo', fr: 'Aller au contenu' },
  'Concept prototype for the NASA Space Apps Challenge. Not a medical device — reference ranges are simplified.': { es: 'Prototipo conceptual para el NASA Space Apps Challenge. No es un dispositivo médico: los rangos de referencia están simplificados.', pt: 'Protótipo conceitual para o NASA Space Apps Challenge. Não é um dispositivo médico — as faixas de referência são simplificadas.', fr: 'Prototype conceptuel pour le NASA Space Apps Challenge. Ce n’est pas un dispositif médical — les plages de référence sont simplifiées.' },
  'Version {n}': { es: 'Versión {n}', pt: 'Versão {n}', fr: 'Version {n}' },
  'NovaCare — Health Monitoring System': { es: 'NovaCare — Sistema de monitoreo de salud', pt: 'NovaCare — Sistema de monitoramento de saúde', fr: 'NovaCare — Système de suivi de santé' },
  'Mind': { es: 'Mente', pt: 'Mente', fr: 'Esprit' },
  'Weekly check is due · 2 minutes': { es: 'Toca el chequeo semanal · 2 minutos', pt: 'Check-in semanal pendente · 2 minutos', fr: 'Bilan hebdomadaire à faire · 2 minutes' },
  'Programs and Window to Earth': { es: 'Programas y Ventana a la Tierra', pt: 'Programas e Janela para a Terra', fr: 'Programmes et Fenêtre sur la Terre' },
  'Open Mind support': { es: 'Abrir apoyo de Mente', pt: 'Abrir apoio da Mente', fr: 'Ouvrir le soutien Esprit' },
  'Restore photo': { es: 'Restaurar foto', pt: 'Restaurar foto', fr: 'Restaurer la photo' },
  'Profile photo restored': { es: 'Foto de perfil restaurada', pt: 'Foto de perfil restaurada', fr: 'Photo de profil restaurée' },
  'Record this symptom': { es: 'Registrar este síntoma', pt: 'Registrar este sintoma', fr: 'Enregistrer ce symptôme' },
  'No specific onboard protocol matched your question — here is the general approach.': { es: 'Ningún protocolo específico coincide con tu pregunta: este es el enfoque general.', pt: 'Nenhum protocolo específico corresponde à sua pergunta — esta é a abordagem geral.', fr: 'Aucun protocole précis ne correspond à votre question — voici la démarche générale.' },
});
