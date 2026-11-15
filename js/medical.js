/* NOVACARE — medical profile, inventory-aware emergency help and the "Questions" assistant.

   Everything here runs on the device with no link to Earth: answers come from the person's
   own readings, their medical profile (allergies, medication, conditions) and the ship
   inventory. It supports, and never replaces, the mission's medical checklists and the
   Crew Medical Officer. */

const fold = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/* ---------- medical profile ---------- */
const BLOOD_TYPES = ['', 'O+', 'O−', 'A+', 'A−', 'B+', 'B−', 'AB+', 'AB−'];
// Allergy groups a crew member can tick. `drugs` = the supply classes it rules out.
const ALLERGENS = [
  { id: 'penicillin', name: 'Penicillin / amoxicillin', drugs: ['antibioticPen'], rx: /penicil|amoxic|ampicil|augmentin/ },
  { id: 'sulfa', name: 'Sulfa drugs', drugs: ['sulfa'], rx: /sulfa|bactrim|trimethoprim/ },
  { id: 'nsaid', name: 'NSAIDs (aspirin, ibuprofen)', drugs: ['aspirin', 'nsaid'], rx: /nsaid|aine|aspirin|ibuprofen|naproxen|diclofenac/ },
  { id: 'paracetamol', name: 'Paracetamol (acetaminophen)', drugs: ['paracetamol'], rx: /paracetamol|acetaminophen|tylenol/ },
  { id: 'opioid', name: 'Opioids (codeine, morphine)', drugs: ['opioid'], rx: /opioid|opiac|codein|morphin|morfin|tramadol|oxycodon|fentanyl/ },
  { id: 'lidocaine', name: 'Local anaesthetics (lidocaine)', drugs: ['lidocaine'], rx: /lidocain|anesthe|anaesthe/ },
  { id: 'latex', name: 'Latex', drugs: ['latex'], rx: /latex/ },
  { id: 'adhesive', name: 'Adhesive tape / plasters', drugs: ['adhesive'], rx: /adhesive|tape|plaster|esparadrapo/ },
  { id: 'iodine', name: 'Iodine (povidone)', drugs: ['iodine'], rx: /iodine|yodo|povidon|betadine/ },
  { id: 'peanut', name: 'Peanuts', food: true, rx: /peanut|mani|cacahuate/ },
  { id: 'treenut', name: 'Tree nuts', food: true, rx: /tree nut|almond|walnut|cashew|nuez|almendra/ },
  { id: 'shellfish', name: 'Shellfish', food: true, rx: /shellfish|shrimp|prawn|crab|marisco|camaron/ },
  { id: 'egg', name: 'Eggs', food: true, rx: /\begg|huevo/ },
  { id: 'milk', name: 'Milk', food: true, rx: /milk|dairy|lactose|leche|lacteo/ },
];
const ALG = Object.fromEntries(ALLERGENS.map((a) => [a.id, a]));
const ANTICOAG = /warfarin|apixaban|rivaroxaban|dabigatran|heparin|enoxaparin|clopidogrel|anticoag/;

/* Ready-made profiles: the simulated crew and the demo astronaut come with theirs. */
const PRESET_PROFILES = {
  'sim:tanaka': { blood: 'A+', allergies: ['penicillin'], other: '', meds: [], conditions: [], notes: 'Wears contact lenses.', baseline: { hr: 54, sys: 112, dia: 70, mass: 61 } },
  'sim:okafor': { blood: 'O+', allergies: ['nsaid'], other: '', meds: ['Lisinopril 10 mg daily (blood pressure)'], conditions: ['Mild hypertension, controlled'], notes: 'Crew Medical Officer — carries the medical checklist.', baseline: { hr: 60, sys: 118, dia: 76, mass: 82 } },
  'sim:fischer': { blood: 'B−', allergies: ['latex', 'peanut'], other: '', meds: [], conditions: ['Childhood asthma, no attacks in 10 years'], notes: 'Use nitrile gloves.', baseline: { hr: 58, sys: 108, dia: 68, mass: 66 } },
  demo: { blood: 'O−', allergies: ['sulfa'], other: 'Bee stings', meds: ['Vitamin D 1000 IU daily'], conditions: [], notes: '', baseline: { hr: 57, sys: 112, dia: 72, mass: 74 } },
};

const Medical = (() => {
  const clean = (p) => ({
    blood: BLOOD_TYPES.includes(p && p.blood) ? p.blood : '',
    allergies: Array.isArray(p && p.allergies) ? p.allergies.filter((a) => ALG[a]) : [],
    other: String((p && p.other) || '').slice(0, 200),
    meds: Array.isArray(p && p.meds) ? p.meds.map((x) => String(x).trim()).filter(Boolean).slice(0, 20) : [],
    conditions: Array.isArray(p && p.conditions) ? p.conditions.map((x) => String(x).trim()).filter(Boolean).slice(0, 20) : [],
    notes: String((p && p.notes) || '').slice(0, 300),
    baseline: ['hr', 'sys', 'dia', 'mass'].reduce((o, k) => { const v = p && p.baseline ? parseFloat(p.baseline[k]) : NaN; if (Number.isFinite(v) && v > 0) o[k] = v; return o; }, {}),
    updatedAt: (p && p.updatedAt) || null,
  });
  /** The profile stored with a person's mission data (or a preset for simulated crew). */
  function of(s, id) {
    if (id && PRESET_PROFILES[id]) return clean(PRESET_PROFILES[id]);
    if (s && s.profile) return clean(s.profile);
    if (s && s.demo && !s.sim) return clean(PRESET_PROFILES.demo);
    return null;
  }
  const mine = () => of(state, null) || clean({});
  function save(p) { state.profile = { ...clean(p), updatedAt: new Date().toISOString() }; Engine.save(); }
  const empty = (p) => !p || (!p.blood && !p.allergies.length && !p.other && !p.meds.length && !p.conditions.length && !p.notes);
  /** Every allergy as words, including the free-text ones. */
  const allergyNames = (p) => (p ? [...p.allergies.map((a) => ALG[a].name), ...p.other.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean)] : []);
  /** Supply classes this person must not receive, with the allergy that rules each out. */
  function blocked(p) {
    const out = {}; if (!p) return out;
    p.allergies.forEach((a) => (ALG[a].drugs || []).forEach((d) => { out[d] = ALG[a].name; }));
    const other = fold(p.other);
    ALLERGENS.forEach((a) => { if (a.rx.test(other)) (a.drugs || []).forEach((d) => { out[d] = out[d] || a.name; }); });
    if (p.meds.some((m) => ANTICOAG.test(fold(m)))) { out.aspirin = out.aspirin || 'takes a blood thinner'; out.nsaid = out.nsaid || 'takes a blood thinner'; }
    return out;
  }
  return { of, mine, save, empty, allergyNames, blocked, clean };
})();

/* ---------- what the ship carries: inventory items recognised by name ---------- */
const SUPPLY = {
  epinephrine: { rx: /epinephrin|adrenalin|epipen|auto-?injector/, name: 'Epinephrine auto-injector', drug: true, alt: 'There is no substitute. Give oxygen, keep them flat (or upright if breathing is hard) and get the Crew Medical Officer.' },
  antihistamine: { rx: /antihistamin|cetirizin|loratadin|diphenhydramin|chlorphenamin|fexofenadin/, name: 'Antihistamine tablets', drug: true },
  aspirin: { rx: /aspirin|acetylsalicyl/, name: 'Aspirin', drug: true },
  nsaid: { rx: /ibuprofen|naproxen|diclofenac/, name: 'Ibuprofen', drug: true },
  paracetamol: { rx: /paracetamol|acetaminophen/, name: 'Paracetamol', drug: true },
  analgesic: { rx: /pain relief|painkiller|analgesic/, name: 'Pain relief tablets', drug: true, unknown: true },
  opioid: { rx: /morphin|codein|tramadol|oxycodon|fentanyl/, name: 'Opioid pain relief', drug: true },
  antibioticPen: { rx: /amoxicil|penicil|ampicil|augmentin/, name: 'Amoxicillin', drug: true },
  antibiotic: { rx: /antibiotic|azithromycin|doxycyclin|ciprofloxacin|cephalexin/, name: 'Antibiotic course', drug: true, unknown: true },
  nitro: { rx: /nitroglycerin|glyceryl trinitrate|\bgtn\b/, name: 'Nitroglycerin spray', drug: true },
  inhaler: { rx: /salbutamol|albuterol|inhaler|bronchodilat/, name: 'Salbutamol inhaler', drug: true },
  antiemetic: { rx: /ondansetron|promethazin|metoclopramid|anti-?nausea|antiemetic/, name: 'Anti-nausea medication', drug: true },
  glucose: { rx: /glucose (gel|tab)|dextrose/, name: 'Glucose gel', drug: true },
  lidocaine: { rx: /lidocain/, name: 'Lidocaine', drug: true },
  oxygen: { rx: /oxygen|\bo2\b/, name: 'Oxygen and mask' },
  aed: { rx: /\baed\b|defibrillat/, name: 'Defibrillator (AED)', alt: 'Keep doing CPR without stopping and swap compressors every 2 minutes.' },
  dressings: { rx: /bandage|dressing|gauze|compress/, name: 'Bandages & dressings', alt: 'Press with the cleanest cloth you have.' },
  tourniquet: { rx: /tourniquet|torniquete/, name: 'Tourniquet', alt: 'Improvise with a wide strap or cloth band and a rod to twist it tight. Note the time.' },
  splint: { rx: /splint|ferula/, name: 'Splint', alt: 'Improvise with something rigid (a clipboard, rolled panel) and pad it with cloth.' },
  coldpack: { rx: /cold pack|ice pack|cold compress/, name: 'Cold packs', alt: 'Use a sealed bag of cold water from the galley, wrapped in cloth.' },
  burn: { rx: /burn|hydrogel|cling film/, name: 'Burn dressing', alt: 'Cool with water for 20 minutes, then cover loosely with clean cling film or a non-stick dressing.' },
  gloves: { rx: /glove/, name: 'Nitrile gloves', alt: 'Use any clean barrier and wash hands afterwards.' },
  masks: { rx: /mask|breathing apparatus|respirator|\bpbe\b/, name: 'Masks / breathing apparatus' },
  eyewash: { rx: /eye ?wash|saline/, name: 'Saline eyewash', alt: 'Flush with plenty of clean drinking water.' },
  emesis: { rx: /emesis|vomit|sick bag/, name: 'Emesis bags', alt: 'Use a sealable bag — vomit floats in microgravity.' },
  bpcuff: { rx: /blood pressure cuff|sphygmo/, name: 'Blood pressure cuff' },
  pulseox: { rx: /pulse ?ox|oximeter/, name: 'Pulse oximeter' },
  thermometer: { rx: /thermometer/, name: 'Thermometer' },
};
// What the standard kit should hold (used by "add the medical kit to the inventory").
const MED_KIT = [
  ['Epinephrine auto-injector', 'medical', 4, 'units', 2], ['Antihistamine tablets (cetirizine 10 mg)', 'medical', 40, 'tablets', 10],
  ['Aspirin 300 mg', 'medical', 30, 'tablets', 10], ['Ibuprofen 400 mg', 'medical', 60, 'tablets', 20], ['Paracetamol 500 mg', 'medical', 80, 'tablets', 20],
  ['Amoxicillin course', 'medical', 4, 'courses', 2], ['Azithromycin course', 'medical', 3, 'courses', 1], ['Nitroglycerin spray', 'medical', 2, 'units', 1],
  ['Salbutamol inhaler', 'medical', 3, 'units', 1], ['Ondansetron 4 mg (anti-nausea)', 'medical', 30, 'tablets', 10], ['Glucose gel', 'medical', 10, 'tubes', 3],
  ['Oxygen cylinder and mask', 'medical', 2, 'units', 1], ['Defibrillator (AED)', 'medical', 1, 'units', 1], ['Tourniquet', 'medical', 3, 'units', 2],
  ['Splint', 'medical', 4, 'units', 2], ['Cold packs', 'medical', 12, 'packs', 4], ['Burn gel dressing', 'medical', 10, 'pcs', 4],
  ['Nitrile gloves', 'medical', 200, 'pairs', 50], ['Saline eyewash', 'medical', 6, 'bottles', 2], ['Emesis bags', 'hygiene', 40, 'bags', 10],
  ['Bandages & dressings', 'medical', 60, 'pcs', 20], ['Blood pressure cuff', 'medical', 2, 'units', 1], ['Pulse oximeter', 'medical', 3, 'units', 1],
];

/* What each emergency calls for, in order of priority. `when` explains when to use it. */
const EMG_NEEDS = {
  unresponsive: [['aed', 'Attach it as soon as it arrives and follow its voice prompts.', true], ['oxygen', 'Once they breathe again, or during CPR if trained.'], ['pulseox', 'Check SpO₂ and pulse once breathing returns.'], ['gloves', 'Protect yourself.']],
  breathing: [['oxygen', 'Give by mask now.', true], ['pulseox', 'Measure SpO₂ every 5 minutes.', true], ['inhaler', 'If they wheeze or have asthma: 2–4 puffs, repeat as the checklist says.'], ['epinephrine', 'Only if there are signs of a severe allergic reaction (swelling, hives).'], ['masks', 'If the cabin air may be the cause.']],
  chest: [['aspirin', 'One 300 mg tablet, chewed — only if the checklist or flight surgeon agrees.'], ['nitro', 'Only if systolic pressure is 90 or more, and only as the checklist directs.'], ['oxygen', 'If SpO₂ is under 94%.'], ['aed', 'Keep it beside them.'], ['bpcuff', 'Measure every 5 minutes.', true], ['pulseox', 'Measure every 5 minutes.']],
  bleeding: [['gloves', 'Put them on first.', true], ['dressings', 'Press hard on the wound for at least 10 minutes.', true], ['tourniquet', 'For a limb wound that pressure does not stop. Write down the time.'], ['bpcuff', 'Watch for shock.'], ['pain', 'For pain once bleeding is controlled.', false, ['paracetamol', 'analgesic']]],
  head: [['emesis', 'Keep one ready and turn their head to the side if they vomit.', true], ['pulseox', 'Check SpO₂ and pulse every 15 minutes.'], ['antiemetic', 'For nausea, only as the checklist directs.'], ['pain', 'For headache. Avoid aspirin and ibuprofen after a head injury (bleeding risk).', false, ['paracetamol']]],
  allergy: [['epinephrine', 'Inject into the outer thigh now. A second dose may be needed after 5–15 minutes.', true], ['oxygen', 'Give by mask.'], ['antihistamine', 'After epinephrine, for itching and hives — it does not replace epinephrine.'], ['inhaler', 'If they are wheezing.'], ['bpcuff', 'Measure every 5 minutes.'], ['pulseox', 'Measure every 5 minutes.']],
  toxic: [['masks', 'Put yours on before helping.', true], ['oxygen', 'Give once they are in clean air.', true], ['eyewash', 'Flush eyes or skin for 15 minutes.'], ['pulseox', 'Watch SpO₂ over the next hours.']],
  burn: [['coldpack', 'Cool the burn for 20 minutes (wrapped, never directly on skin).', true], ['burn', 'Cover loosely after cooling.'], ['gloves', 'Keep the burn clean.'], ['pain', 'For pain.', false, ['paracetamol', 'nsaid', 'analgesic']]],
  fracture: [['splint', 'Immobilise the joints above and below.', true], ['coldpack', 'Up to 20 minutes, wrapped in cloth.'], ['pain', 'For pain.', false, ['paracetamol', 'nsaid', 'analgesic']]],
  psych: [],
};

const Emergency = (() => {
  // Words (English and Spanish, accents removed) that point to each protocol.
  const CUES = {
    unresponsive: /unconscious|unresponsive|not breathing|no pulse|collaps|passed out|faint|cpr|cardiac arrest|no respira|inconscien|no responde|desmay|paro|sin pulso/,
    breathing: /breath|wheez|asthma|chok|suffocat|short of air|oxygen|respir|ahog|asma|falta de aire|oxigeno|silb/,
    chest: /chest|heart attack|angina|pecho|infarto|corazon|opresion/,
    bleeding: /bleed|blood|cut|wound|lacerat|stab|sangr|herida|cortad|corte/,
    head: /head|concuss|seizure|convuls|confus|dizzy|stroke|cabeza|golpe|mare|desorient|ataque/,
    allergy: /allerg|hives|swell|anaphyla|rash|itch|peanut|sting|alerg|ronch|hinch|picaz|sarpullido|mani/,
    toxic: /smoke|fume|gas|toxic|ammonia|fire|co2|carbon|chemical|humo|fuego|incendio|quimic|amoniaco|intoxic/,
    burn: /burn|scald|quemad|quema/,
    fracture: /fractur|broke|broken|sprain|dislocat|twist|bone|ankle|wrist|roto|rota|esguince|hueso|tobillo|munec|luxac/,
    psych: /panic|anxiety|crying|hysteri|suicid|psych|breakdown|panico|ansiedad|llora|crisis|nervios/,
  };
  /** Best-matching protocols for a free-text description, most likely first. */
  function classify(text) {
    const t = fold(text);
    return Object.entries(CUES).map(([id, rx]) => ({ id, n: (t.match(new RegExp(rx.source, 'g')) || []).length }))
      .filter((x) => x.n > 0).sort((a, b) => b.n - a.n).map((x) => x.id);
  }

  const onBoard = () => (typeof Inventory !== 'undefined' && Auth.user() ? Inventory.items() : []);
  function find(cls, items) {
    const rx = SUPPLY[cls].rx;
    const hits = items.filter((i) => rx.test(fold(i.name)) || rx.test(fold(i.note)));
    return hits.sort((a, b) => b.qty - a.qty)[0] || null;
  }
  /** The plan for one emergency and one person: what to use from the inventory, what is missing, what must not be given. */
  function plan(emgId, person) {
    const items = onBoard(); const prof = person ? person.med : null; const no = Medical.blocked(prof);
    const use = [], missing = [], avoid = [];
    (EMG_NEEDS[emgId] || []).forEach(([cls, when, essential, options]) => {
      const choices = options || [cls];
      let done = false, ruledOut = false;
      for (const c of choices) {
        const it = find(c, items); const s = SUPPLY[c];
        if (no[c]) { ruledOut = true; if (it && !avoid.some((x) => x.item.id === it.id)) avoid.push({ cls: c, item: it, why: no[c] }); continue; }
        if (!it) continue;
        if (it.qty <= 0) { missing.push({ cls: c, name: it.name, why: 'Out of stock', alt: s.alt, essential }); done = true; break; }
        // a generic box ("pain relief tablets", "antibiotic course") may contain what they are allergic to
        const warn = s.unknown && Object.keys(no).length && person ? `Check the label: ${person.name.split(' ')[0]} is allergic to ${Object.values(no).join(', ')}.` : '';
        use.push({ cls: c, item: it, when, essential, warn }); done = true; break;
      }
      if (!done) missing.push({ cls: choices[0], name: SUPPLY[choices[0]].name, essential,
        why: ruledOut ? 'Nothing safe on board for this person' : 'Not in the ship inventory',
        alt: SUPPLY[choices[0]].alt || (ruledOut ? 'Ask the Crew Medical Officer for an alternative.' : '') });
    });
    // anything on board that this person must not get, even if the protocol did not call for it
    items.forEach((it) => Object.keys(no).forEach((c) => { if (SUPPLY[c] && SUPPLY[c].rx.test(fold(it.name)) && !avoid.some((a) => a.item.id === it.id)) avoid.push({ cls: c, item: it, why: no[c] }); }));
    return { use, missing, avoid, inventoryEmpty: !items.length };
  }
  return { classify, plan, find, onBoard };
})();

/* ---------- voice: dictation in, spoken answers out (both built into the browser, offline where supported) ---------- */
const Voice = (() => {
  const R = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null;
  function listen(onText, onEnd) {
    if (!R) return false;
    try { if (rec) rec.abort(); } catch (e) { /* ignore */ }
    rec = new R(); rec.lang = navigator.language || 'en-US'; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onresult = (e) => onText(e.results[0][0].transcript);
    rec.onerror = () => onEnd && onEnd(); rec.onend = () => { rec = null; if (onEnd) onEnd(); };
    rec.start(); return true;
  }
  function stop() { try { if (rec) rec.stop(); } catch (e) { /* ignore */ } }
  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = 1.02; speechSynthesis.speak(u);
  }
  return { ok: !!R, listen, stop, speak, listening: () => !!rec };
})();

/* ---------- Questions: answers from your data, the medical profile and the inventory ---------- */
const Assistant = (() => {
  const IND_WORDS = [
    [['sys', 'dia'], /blood pressure|\bbp\b|presion|tension arterial/],
    [['hr'], /heart rate|pulse|pulso|frecuencia cardiaca|ritmo cardiaco|heartbeat|latidos/],
    [['spo2'], /oxygen|spo2|saturation|saturacion|oxigeno/],
    [['temp'], /temperature|fever|temperatura|fiebre/],
    [['glu'], /glucose|blood sugar|glucosa|azucar/],
    [['sleep'], /sleep|slept|dormi|sueno|dormir|insomni/],
    [['mood'], /\bmood\b|animo|sad\b|triste|depress/],
    [['stress'], /stress|estres|anxious|ansios/],
    [['water'], /water|hydrat|drink|agua|hidrat|liquid/],
    [['exercise'], /exercise|workout|training|ejercicio|entren/],
    [['mass'], /weight|body mass|\bpeso\b|masa corporal/],
    [['vision'], /vision|eyes?\b|eyesight|blurr|ojos?\b|vista|borros/],
    [['rad'], /radiation|dose|dosis|radiacion|msv/],
    [['co2'], /co2|carbon dioxide|cabin air|aire de la cabina|dioxido/],
  ];
  const SYS_WORDS = [['musculo', /bone|muscle|hueso|muscul/], ['heart', /\bheart\b|cardio|corazon|circulat/], ['brain', /brain|mental|mind|cerebro|mente/],
    ['lungs', /lung|pulmon|breath|respir/], ['metabolic', /metabol|nutrition|kidney|food|nutric|rinon|comida/], ['immune', /immun|inmun|infection|infecc/]];
  const SYMPTOMS = [
    [/headache|head hurts|dolor de cabeza|me duele la cabeza|migra/, 'Headache', ['co2', 'sys', 'sleep', 'water', 'vision'], 'In space, headaches are often caused by high cabin CO₂, the fluid shift toward the head, short sleep or dehydration. Drink water, check cabin CO₂ and rest.', 'A sudden severe headache, or one with vision change, confusion or vomiting, is urgent — tell the Crew Medical Officer now.'],
    [/nause|vomit|sick to my stomach|nausea|vomit|marea|mareo/, 'Nausea or dizziness', ['sys', 'water', 'glu'], 'Space motion sickness is common in the first days. Keep your head still, look at a fixed point, sip fluids and eat small amounts.', 'Vomiting that does not stop, or dizziness with chest pain or fainting, needs the Crew Medical Officer.'],
    [/tired|fatigue|exhaust|cansad|agotad|fatiga|sin energia/, 'Tiredness', ['sleep', 'mood', 'stress', 'hr'], 'Fatigue usually follows short sleep, stress or a heavy schedule. Protect a full sleep window tonight and pair up on safety-critical tasks.', 'Tiredness with fever or shortness of breath can be an infection — log your temperature and SpO₂.'],
    [/cough|tos\b|sore throat|garganta|cold\b|resfri|gripe|flu\b/, 'Cough or cold', ['temp', 'spo2', 'hr'], 'Germs spread fast in a closed cabin. Log your temperature and SpO₂, wash hands often and avoid sharing food.', 'Fever with low SpO₂ or trouble breathing needs the Crew Medical Officer today.'],
    [/back pain|backache|dolor de espalda|espalda/, 'Back pain', ['exercise'], 'Your spine lengthens in microgravity and back pain is very common early on. Gentle stretching and the fetal position help.', 'Pain with numbness, weakness or trouble controlling bladder or bowel is urgent.'],
    [/pain|hurt|ache|dolor|duele/, 'Pain', ['hr', 'sys'], 'Rest the area and note where it hurts and how bad it is (0–10).', 'Severe or worsening pain, chest pain or pain after an injury needs the Crew Medical Officer.'],
  ];
  const RED_FLAG = /can'?t breathe|cannot breathe|not breathing|chest pain|unconscious|seizure|severe bleeding|bleeding a lot|anaphyla|no puedo respirar|no respira|dolor (de|en el) pecho|inconscien|convuls|sangra mucho|desmay/;
  const lvlWord = (l) => (l < 0 ? 'no data' : LEVELS[l].name.toLowerCase());

  function indicatorAnswer(ids, person) {
    const parts = []; const say = [];
    ids.forEach((id) => {
      const ind = IND[id];
      let st;
      if (person.me) st = Engine.status(id);
      else { const l = person.latest[id] || {}; st = { v: l.v, level: l.level, md: l.md }; }
      if (st.v == null) { parts.push(`<p><b>${ind.short}:</b> nothing logged yet.</p>`); say.push(`${ind.short}: nothing logged yet.`); return; }
      const val = ind.type === 'scale' ? Engine.label(ind, st.v) : `${Engine.fmt(ind, st.v)} ${ind.unit}`;
      parts.push(`<p><b>${ind.short}:</b> ${esc(val)} on MD ${st.md} — <span class="${lc(st.level)}">${lvlWord(st.level)}</span>.</p>`);
      say.push(`${ind.short} is ${val}, ${lvlWord(st.level)}.`);
      if (st.level >= 1 && ind.advice[st.dir || 'high']) {
        const adv = ind.advice[st.dir || 'high'];
        parts.push(`<ul>${adv.actions.slice(0, 3).map((a) => `<li>${esc(a)}</li>`).join('')}</ul>`); say.push(adv.actions[0]);
      }
    });
    const bl = person.med && person.med.baseline ? person.med.baseline : {};
    ids.forEach((id) => { const st = person.me ? Engine.status(id) : person.latest[id] || {}; if (bl[id] && st.v != null) { const d = +(st.v - bl[id]).toFixed(1); parts.push(`<p class="muted small">Pre-flight baseline ${IND[id].short}: ${bl[id]} ${IND[id].unit} (${d >= 0 ? '+' : ''}${d} now).</p>`); } });
    if (person.me && ids.includes('rad')) { const d = Engine.cumulativeDose(); parts.push(`<p>Mission dose so far: <b>${d.toFixed(1)} mSv</b> — ${Math.round((d / CAREER_DOSE_LIMIT) * 100)}% of the ${CAREER_DOSE_LIMIT} mSv career limit.</p>`); }
    if (person.me && ids.length === 1) parts.push(`<p class="muted small">${esc(IND[ids[0]].why)}</p>`);
    const ev = (EVIDENCE[ids[0]] || [])[0]; const os = typeof OSDR !== 'undefined' && OSDR.indicators && OSDR.indicators[ids[0]];
    if (ev) parts.push(`<p class="src">${icon('shield')}<span>Source: <a href="${ev.url}" target="_blank" rel="noopener">${esc(ev.label)}</a>${os && os.studies[0] ? ` · <a href="${os.studies[0].url}" target="_blank" rel="noopener">${esc(os.studies[0].id)}</a> and ${os.total - 1} more NASA OSDR studies` : ''}</span></p>`);
    return { html: parts.join(''), say: say.join(' '), act: person.me ? { label: `Open ${IND[ids[0]].short} trend`, act: 'detail', id: ids[0] } : null };
  }

  /** "Can I take / give X?" — decided by the rules engine (js/rules.js) BEFORE any language model.
      Every line names its rule and its source. */
  function drugAnswer(t, person) {
    const named = Object.entries(SUPPLY).filter(([, s]) => s.drug && s.rx.test(t)).map(([c]) => c);
    if (!named.length) return null;
    const who = person.me ? tr('you', 'ti') : person.name.split(' ')[0];
    const head = { block: (n) => tr(`⛔ Do not ${person.me ? 'take' : 'give'} ${n}`, `⛔ No ${person.me ? 'tomes' : 'des'} ${n}`), caution: (n) => tr(`⚠ ${n}: possible, with caution`, `⚠ ${n}: posible, con precaución`), ok: (n) => tr(`✓ ${n}: no contraindication found`, `✓ ${n}: sin contraindicaciones encontradas`) };
    const blocks = named.map((c) => {
      const r = Rules.check(c, person); const n = SUPPLY[c].name.toLowerCase();
      const srcs = [...new Map(r.rules.flatMap((x) => x.src).map((x) => [x.id, x])).values()];
      return `<div class="rule ${r.status}"><p class="rule-h">${head[r.status](n)}</p>
        <ul>${r.rules.map((x) => `<li class="${x.level}"><code>${x.id}</code> ${esc(x.text)}</li>`).join('')}</ul>
        ${r.status !== 'block' && r.dose ? `<p class="rule-dose"><b>${tr('Reference dose', 'Dosis de referencia')}:</b> ${esc(r.dose)}. ${tr('Confirm with the mission medical checklist and tell the Crew Medical Officer.', 'Confírmala con la lista médica de la misión y avisa al oficial médico.')}</p>` : ''}
        ${srcs.length ? `<p class="src">${icon('shield')}<span>${tr('Sources', 'Fuentes')}: ${srcs.map((x) => (x.url ? `<a href="${x.url}" target="_blank" rel="noopener">${esc(x.label)}</a>` : esc(x.label))).join(' · ')}</span></p>` : ''}</div>`;
    });
    const say = named.map((c) => { const r = Rules.check(c, person); return r.status === 'block' ? `Do not ${person.me ? 'take' : 'give'} ${SUPPLY[c].name}. ${r.rules.find((x) => x.level === 'block').text}.` : `${SUPPLY[c].name}: ${r.status === 'ok' ? 'no contraindication found' : 'possible with caution'}.`; }).join(' ');
    return { html: blocks.join('') + `<p class="engine">${icon('check')}${tr(`Decided by the rules engine v${RULES_VERSION} for ${esc(who)} — no language model involved. Rules ${esc(Protocols.text('RULES'))}.`, `Decidido por el motor de reglas v${RULES_VERSION} para ${esc(who)}, sin modelo de lenguaje. Reglas: ${Protocols.approved('RULES') ? 'aprobadas' : 'borrador, sin aprobar por un médico; confírmalo con el oficial médico'}.`)}</p>`, say, ruled: true };
  }

  /** Answer from the onboard knowledge base: the best protocol, its steps, when to escalate, and its sources. */
  function kbAnswer(hits, person) {
    const e = hits[0].e; const also = hits.slice(1).filter((h) => h.s > hits[0].s * 0.6).map((h) => h.e);
    const srcs = e.src.map((k) => SRC[k]).filter(Boolean);
    const html = `${e.fallback ? `<p class="muted small">${tr('No specific onboard protocol matched your question — here is the general approach.', 'Ningún protocolo específico coincide con tu pregunta: este es el enfoque general.')}</p>` : ''}<p class="kb-h"><span class="kb-cat ${e.cat}">${{ medical: 'Medical', wellbeing: 'Wellbeing', ship: 'Ship' }[e.cat]}</span><b>${esc(e.title)}</b></p>
      <p>${esc(e.a)}</p><ol>${e.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
      <p class="l2"><b>${tr('Escalate', 'Escalar')}:</b> ${esc(e.esc)}</p>
      ${also.length ? `<p class="muted small">${tr('Related', 'Relacionado')}: ${also.map((x) => esc(x.title)).join(' · ')}</p>` : ''}
      <p class="src">${icon('shield')}<span>${tr('Source: onboard protocol', 'Fuente: protocolo a bordo')} <code>KB-${e.id}</code> (${tr('knowledge base', 'base de conocimiento')} v${KB_VERSION}), ${esc(Protocols.text('KB-' + e.id))}${ANSWER_LANG === 'es' ? ' · texto del protocolo en inglés' : ''}${srcs.length ? ' · ' + srcs.map((x) => `<a href="${x.url}" target="_blank" rel="noopener">${esc(x.label)}</a>`).join(' · ') : ''}</span></p>`;
    return { html, say: `${e.title}. ${e.a} ${e.steps[0]} ${e.esc}`, act: e.emg ? { label: 'Open emergency help', act: 'emergency', id: person.id } : e.id === 'GEN-01' && person.me ? { label: tr('Record this symptom', 'Registrar este síntoma'), act: 'status' } : null, kb: hits.map((h) => h.e) };
  }

  function predictAnswer(person) {
    const list = person.me ? Predict.all() : (person.predict || []);
    const risky = list.filter((p) => p.level > 0);
    if (!risky.length) return { html: `<p>No risks ahead at the current trends${person.me ? '' : ' for ' + esc(person.name.split(' ')[0])}. Keep logging so the predictions stay accurate.</p>`, say: 'No risks ahead at the current trends.' };
    return { html: `<p><b>If nothing changes:</b></p><ul class="ans-list">${risky.map((p) => `<li class="${lc(p.level)}"><b>${esc(p.title)}</b> — ${esc(p.text)}${p.act ? ` <em>${esc(p.act[0])}</em>` : ''}</li>`).join('')}</ul>
      <p class="src">${icon('shield')}<span>Source: NovaCare prediction engine (trend projection, dose rate, bone-loss model) on ${person.me ? 'your' : 'their'} logged readings.</span></p>`,
      say: `${risky.length} risks ahead. ${risky[0].title}. ${risky[0].text}` };
  }

  /** Nothing on board covers it: say so and escalate — never improvise. */
  function noProtocol() {
    const env = Engine.env();
    return { html: tr(`<p class="l2"><b>No onboard protocol for this question.</b> NovaCare only answers from its knowledge base (v${KB_VERSION}) and the rules engine, so it will not guess.</p>
      <p>Escalate: ask the Crew Medical Officer, or send the question to ground — ${esc(env.commNote)}</p>`, `<p class="l2"><b>No hay un protocolo a bordo para esta pregunta.</b> NovaCare solo responde con su base de conocimiento (v${KB_VERSION}) y el motor de reglas, así que no va a adivinar.</p>
      <p>Escala: pregunta al oficial médico de la tripulación o envía la pregunta a tierra.</p>`), say: 'No onboard protocol for this question. Escalate to the Crew Medical Officer or ground.', none: true };
  }

  function profileAnswer(person) {
    const p = person.med; const who = person.me ? 'Your' : `${person.name.split(' ')[0]}’s`;
    if (!p || Medical.empty(p)) return { html: `<p>${who} medical profile is empty.${person.me ? ' Add allergies, medication and conditions in Personal → Medical profile.' : ''}</p>`, say: `${who} medical profile is empty.`, act: person.me ? { label: 'Open medical profile', act: 'sub', v: 'medical' } : null };
    const al = Medical.allergyNames(p);
    return { html: `<ul class="ans-list"><li><b>Allergies:</b> ${al.length ? esc(al.join(', ')) : 'none recorded'}</li><li><b>Medication:</b> ${p.meds.length ? esc(p.meds.join('; ')) : 'none'}</li><li><b>Conditions:</b> ${p.conditions.length ? esc(p.conditions.join('; ')) : 'none'}</li><li><b>Blood type:</b> ${esc(p.blood || 'unknown')}</li>${p.notes ? `<li><b>Notes:</b> ${esc(p.notes)}</li>` : ''}</ul>`,
      say: `Allergies: ${al.length ? al.join(', ') : 'none recorded'}.` };
  }

  function inventoryAnswer(t) {
    const items = Emergency.onBoard();
    const cls = Object.entries(SUPPLY).filter(([, s]) => s.rx.test(t)).map(([c]) => c);
    let hits = cls.map((c) => Emergency.find(c, items)).filter(Boolean);
    if (!hits.length) { const words = t.split(/\W+/).filter((w) => w.length > 3 && !/have|there|tenemos|board|inventory|inventario|stock|supply|supplies|hay/.test(w)); hits = items.filter((i) => words.some((w) => fold(i.name).includes(w))); }
    if (!items.length) return { html: '<p>The ship inventory is empty for this mission. Add items in Crew → Ship inventory.</p>', say: 'The ship inventory is empty.' };
    if (!hits.length) { const low = items.filter((i) => Inventory.level(i) > 0); return { html: `<p>I could not find that in the ship inventory (${items.length} items).${low.length ? ` Running low: ${esc(low.map((i) => i.name).join(', '))}.` : ''}</p>`, say: 'I could not find that in the ship inventory.' }; }
    return { html: `<ul class="ans-list">${hits.map((i) => `<li class="${lc(Inventory.level(i))}"><b>${esc(i.name)}</b>: ${i.qty} ${esc(i.unit)}${i.note ? ` · ${esc(i.note)}` : ''}${Inventory.level(i) === 3 ? ' — out of stock' : Inventory.level(i) === 1 ? ' — running low' : ''}</li>`).join('')}</ul>`,
      say: hits.map((i) => `${i.name}: ${i.qty} ${i.unit}.`).join(' ') };
  }

  function statusAnswer(person) {
    const v = Crew.verdict(person); const top = person.advisories.slice(0, 3);
    const who = person.me ? 'Your' : `${person.name.split(' ')[0]}’s`;
    if (person.readiness == null) return { html: `<p>${person.me ? 'You have' : 'There are'} no readings yet. A check-in takes about two minutes.</p>`, say: 'No readings yet.', act: person.me ? { label: 'Start check-in', act: 'checkin' } : null };
    return { html: `<p>${who} readiness is <b>${person.readiness}</b> — <span class="${lc(v.level)}">${esc(v.name)}</span>.</p>${top.length ? `<ul class="ans-list">${top.map((a) => `<li class="${lc(a.level)}"><b>${esc(a.title)}</b> · ${esc(a.who)}</li>`).join('')}</ul>` : '<p>No active advisories. Keep up the routine.</p>'}`,
      say: `${who} readiness is ${person.readiness}, ${v.name}. ${top.length ? 'Main concern: ' + top[0].title : 'No active advisories.'}` };
  }

  function todayAnswer() {
    const due = Engine.dueList(); const day = Engine.today(); const open = TASKS.filter((x) => !x.auto && !day.tasks[x.id]);
    return { html: `${due.length ? `<p><b>${due.length} measurement${due.length > 1 ? 's' : ''} due:</b> ${esc(due.map((id) => IND[id].short).join(', '))}.</p>` : '<p>All measurements are logged for today.</p>'}${open.length ? `<p><b>Routine still open:</b> ${esc(open.map((x) => x.label).join(', '))}.</p>` : ''}`,
      say: due.length ? `${due.length} measurements due today.` : 'Everything is logged for today.', act: due.length ? { label: 'Start check-in', act: 'checkin' } : null };
  }

  function emergencyAdvice(emgId, person) {
    const pl = Emergency.plan(emgId, person); const e = EMG[emgId];
    const html = `<p>For <b>${esc(e.name.toLowerCase())}</b>, from what is on board:</p>
      ${pl.use.length ? `<ul class="ans-list">${pl.use.map((u) => `<li class="l0"><b>${esc(u.item.name)}</b> (${u.item.qty} ${esc(u.item.unit)}${u.item.note ? ', ' + esc(u.item.note) : ''}) — ${esc(u.when)}${u.warn ? ` <em>${esc(u.warn)}</em>` : ''}</li>`).join('')}</ul>` : '<p>Nothing on board matches this protocol.</p>'}
      ${pl.avoid.length ? `<ul class="ans-list">${pl.avoid.map((a) => `<li class="l3"><b>Do not give ${esc(a.item.name)}</b> — ${esc(a.why)}.</li>`).join('')}</ul>` : ''}
      ${pl.missing.filter((m) => m.essential).map((m) => `<p class="l2"><b>${esc(m.name)}: ${esc(m.why.toLowerCase())}.</b> ${esc(m.alt || '')}</p>`).join('')}`;
    const say = [pl.use[0] ? `Use ${pl.use[0].item.name}. ${pl.use[0].when}` : '', pl.avoid[0] ? `Do not give ${pl.avoid[0].item.name}, ${pl.avoid[0].why}.` : ''].join(' ');
    return { html, say };
  }

  /** Answer a question. ctx.person = whose health it is about (default: you); ctx.emg = open emergency protocol. */
  /** Spanish if the question reads as Spanish (accents, ¿ or common words); English otherwise. */
  const isEs = (q) => /[¿¡ñ]|[áéíóú]/i.test(q) || /\b(puedo|tengo|tomar|dolor|duele|cabeza|estoy|como|cual|tenemos|hay|siento|mareo|fiebre|para|pastilla)\b/.test(fold(q));
  function answer(q, ctx = {}) {
    ANSWER_LANG = isEs(q) ? 'es' : 'en';
    const t = fold(q).trim();
    // a question can be about a crewmate by name ("Can I give Mei amoxicillin?")
    const named = !ctx.person && Crew.members().slice(1).find((m) => new RegExp('\\b' + fold(m.name.split(' ')[0]) + '\\b').test(t));
    const person = ctx.person || named || Crew.members()[0];
    if (!t) return { html: '<p>Type or say a question.</p>', say: '' };
    if (!ctx.emg && RED_FLAG.test(t)) {
      const guess = Emergency.classify(t)[0];
      return { html: `<p class="l3">${tr('<b>This sounds like an emergency.</b> Call the crew now and open the emergency protocol — NovaCare will check the ship inventory and allergies for you.', '<b>Esto parece una emergencia.</b> Llama a la tripulación ahora y abre el protocolo de emergencia: NovaCare revisará el inventario y las alergias por ti.')}</p>`, say: 'This sounds like an emergency. Call the crew and open the emergency protocol.', act: { label: 'Open emergency help', act: 'emergency', id: person.id, guess } };
    }
    // 1) rules engine: medication questions are decided here, before anything else
    const drug = drugAnswer(t, person);
    if (drug) { // the medicine is decided by the rules; a symptom in the same question gets its protocol too
      const sym = KBSearch.search(t, 3).map((h) => h.e).find((e) => e.cat === 'medical' && e.id !== 'MED-18');
      if (sym) {
        drug.html += `<div class="rule ok"><p class="rule-h">${icon('care')}${tr(`About the ${esc(sym.title.toLowerCase())}`, `Sobre el síntoma: ${esc(sym.title.toLowerCase())}`)}</p>
          <ol>${sym.steps.slice(0, 3).map((x) => `<li>${esc(x)}</li>`).join('')}</ol><p class="l2"><b>${tr('Escalate', 'Escalar')}:</b> ${esc(sym.esc)}</p>
          <p class="src">${icon('shield')}<span>${tr('Onboard protocol', 'Protocolo a bordo')} <code>KB-${sym.id}</code>, ${esc(Protocols.text('KB-' + sym.id))}${ANSWER_LANG === 'es' ? ' · texto del protocolo en inglés' : ''}</span></p></div>`;
        drug.act = { label: tr('Record this symptom', 'Registrar este síntoma'), act: 'status' };
      }
      return drug;
    }
    if (/allerg|alerg|blood type|tipo de sangre|grupo sangu|medical profile|perfil medico|my conditions|mis condiciones|what medication do|que medicamentos tom/.test(t)) return profileAnswer(person);
    if (ctx.emg && /what (do|should)|que (hago|hacer|le doy|doy)|medic|medicine|give|dar|pill|pastill|treat|tratar|help|ayud/.test(t)) return emergencyAdvice(ctx.emg, person);
    if (/do we have|is there any|are there any|have we got|\btenemos\b|nos queda|\bhay (algun|alguna|mas|suficiente|epinefrina|oxigeno)|inventory|inventario|on board|a bordo|in stock|supplies|suministro/.test(t)) return inventoryAnswer(t);
    // 2) your own data: readings and status
    const aboutMine = /\bmy\b|\bmi\b|\bmis\b|is (his|her|their)|how is|how are|como esta|como estan|what is my|cual es mi|level|nivel/.test(t);
    const ind = IND_WORDS.find(([, rx]) => rx.test(t));
    if (ind && aboutMine) return indicatorAnswer(ind[0], person);
    if (/risk|riesgo|predict|predic|forecast|future|futuro|going to happen|va a pasar|ahead/.test(t)) return predictAnswer(person);
    if (/how am i|como estoy|my status|mi estado|readiness|summary|resumen|how is my health|como esta mi salud/.test(t)) return statusAnswer(person);
    if (/\btoday\b|\bhoy\b|routine|rutina|\bdue\b|pending|pendiente|check.?in|what should i do today|que debo hacer hoy|que tengo que hacer/.test(t)) return person.me ? todayAnswer() : statusAnswer(person);
    // 3) onboard knowledge base: medical, wellbeing and ship protocols, searched on the device
    const hits = KBSearch.search(t);
    if (hits.length) return kbAnswer(hits, person);
    if (ind) return indicatorAnswer(ind[0], person);
    for (const [id, rx] of SYS_WORDS) if (rx.test(t)) {
      const s = SYS[id]; const lv = person.me ? Engine.systemLevel(id) : person.systems[id];
      return { html: `<p><b>${esc(s.name)}:</b> <span class="${lc(lv)}">${lvlWord(lv)}</span>.</p><p>${esc(s.space)}</p>${indicatorAnswer(s.indicators, person).html}`, say: `${s.name}: ${lvlWord(lv)}.` };
    }
    if (ctx.emg) return emergencyAdvice(ctx.emg, person);
    // 4) nothing specific: a symptom or a feeling still gets the general approach; anything else escalates
    const general = generalFallback(t);
    if (general) return kbAnswer([{ e: general, s: 0 }], person);
    return noProtocol();
  }
  /* Body, pain or illness words → the general symptom approach (GEN-01); feelings → GEN-02. */
  const BODY_RX = /pain|hurt|ache|sore|swell|symptom|sick|\bill\b|disease|illness|itch|bleed|injur|lump|rash|fever|infect|cough|numb|\bweak|medical|health|body|head|\beyes?\b|\bears?\b|nose|mouth|throat|neck|shoulder|\barm|elbow|hand|finger|chest|back|stomach|belly|\bhip|\bleg|knee|\bfoot|feet|\btoe|skin|dolor|duel|molest|sintom|enferm|hinch|picaz|pica\b|sangr|herid|lesion|infecc|grano|bulto|fiebre|\btos\b|salud|cuerpo|malestar|cabeza|\bojos?\b|oido|oreja|nariz|boca|garganta|cuello|hombro|brazo|codo|\bmanos?\b|dedo|pecho|espalda|estomago|panza|barriga|cadera|pierna|rodilla|\bpies?\b|\bpiel\b|lengua|labio|muela|diente|una\b.*(rara|extrana)/;
  const MIND_RX = /feel|felt|emotion|mood|\bmind|mental|psych|worr|scared|afraid|upset|\bcry|lonely|stress|nervous|sad|angry|happy|siento|sentir|senti|emocion|animo|\bmente|psicolog|preocup|miedo|asust|llor|angust|estres|nervios|triste|enojad|feliz|me pasa/;
  function generalFallback(t) {
    if (BODY_RX.test(t)) return KBI['GEN-01'];
    if (MIND_RX.test(t)) return KBI['GEN-02'];
    return null;
  }
  const SUGGEST = ['What risks do I have ahead?', 'How am I doing?', 'Is my blood pressure OK?', 'I have a headache', 'I have a migraine', 'I feel anxious', 'I can\'t sleep', 'Cabin CO₂ is high', 'Can I take ibuprofen?', 'Can I give Mei amoxicillin?'];
  const SUGGEST_EMG = ['What medicine can I give?', 'Can I give amoxicillin?', 'Is it safe to give aspirin?', 'What are their allergies?', 'Do we have oxygen?'];
  return { answer, SUGGEST, SUGGEST_EMG, drugAnswer };
})();

/* ---------- views ---------- */
function micBtn(target) {
  if (!Voice.ok) return '';
  return `<button type="button" class="mic" data-act="mic" data-target="${target}" title="Speak instead of typing" aria-label="Speak instead of typing">${icon('mic')}</button>`;
}

function viewMedical() {
  const p = Medical.mine();
  const chk = (a) => `<label class="algo ${a.food ? 'food' : ''}"><input type="checkbox" name="alg" value="${a.id}" ${p.allergies.includes(a.id) ? 'checked' : ''}><span>${esc(a.name)}</span></label>`;
  return `<section class="card med">
    <div class="card-h"><div><h2>${icon('care')}Medical profile</h2><p class="muted small">Used in emergencies and by Questions to check every medicine against your allergies. Your crew sees it only through the emergency flow. Your flight surgeon can fill it in before the mission.</p></div>
      ${p.updatedAt ? `<span class="muted small">Updated ${timeAgo(p.updatedAt)}</span>` : ''}</div>
    <form id="medical-form" class="med-form" novalidate>
      <div class="field"><label>Allergies — medicines and materials</label><div class="algs">${ALLERGENS.filter((a) => !a.food).map(chk).join('')}</div></div>
      <div class="field"><label>Allergies — food</label><div class="algs">${ALLERGENS.filter((a) => a.food).map(chk).join('')}</div></div>
      <div class="field"><label for="med-other">Other allergies <span class="muted">(comma separated)</span></label><input id="med-other" name="other" class="text" type="text" maxlength="200" value="${esc(p.other)}" placeholder="e.g. Bee stings, cephalexin"></div>
      <div class="field-row">
        <div class="field"><label for="med-meds">Medication you take <span class="muted">(one per line)</span></label><textarea id="med-meds" name="meds" class="text" rows="3" placeholder="e.g. Lisinopril 10 mg daily">${esc(p.meds.join('\n'))}</textarea></div>
        <div class="field"><label for="med-cond">Conditions <span class="muted">(one per line)</span></label><textarea id="med-cond" name="conditions" class="text" rows="3" placeholder="e.g. Asthma">${esc(p.conditions.join('\n'))}</textarea></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="med-blood">Blood type</label><select id="med-blood" name="blood" class="text">${BLOOD_TYPES.map((b) => `<option value="${b}" ${p.blood === b ? 'selected' : ''}>${b || 'Unknown'}</option>`).join('')}</select></div>
        <div class="field"><label for="med-notes">Notes for whoever helps you</label><input id="med-notes" name="notes" class="text" type="text" maxlength="300" value="${esc(p.notes)}" placeholder="e.g. Wears contact lenses"></div>
      </div>
      <div class="field"><label>Pre-flight baseline <span class="muted">(from the medical exam before launch)</span></label>
        <div class="field-row">${[['hr', 'Resting heart rate', 'bpm'], ['sys', 'Systolic BP', 'mmHg'], ['dia', 'Diastolic BP', 'mmHg'], ['mass', 'Body mass', 'kg']].map(([k, l, u]) => `<div class="field"><label for="bl-${k}" class="sm">${l} (${u})</label><input id="bl-${k}" name="bl-${k}" class="text num" type="number" step="any" min="0" value="${p.baseline && p.baseline[k] != null ? p.baseline[k] : ''}"></div>`).join('')}</div></div>
      <div class="btnrow end"><button class="btn primary" type="submit">${icon('check')}Save medical profile</button></div>
    </form></section>`;
}

function askHtml(m) {
  const chat = m.chat || [];
  return `<div class="sheet narrow ask" role="dialog" aria-modal="true" aria-label="Questions">
    <header><div><h2>${icon('chat')}Questions</h2><p class="sub">Health, emotional wellbeing or ship problems — by text${Voice.ok ? ' or voice' : ''}. No link to Earth needed.</p>
      <p class="engines"><span>${icon('check')}Rules engine v${RULES_VERSION.split(' ')[0]}</span><span>${icon('file')}Knowledge base v${KB_VERSION.split(' ')[0]} · ${KB.length} protocols</span><span class="${LocalLLM.ready() ? 'on' : ''}">${icon('chat')}Local model ${LocalLLM.ready() ? LocalLLM.model : 'off'}</span></p></div><button class="x" data-act="close" aria-label="Close">${icon('x')}</button></header>
    <div class="sheet-b one">
      <div class="chat" id="chat">${chat.length ? chat.map((x) => `<div class="q">${esc(x.q)}</div><div class="a">${x.a.llm ? llmHtml(x.a) : x.a.html}${x.a.thinking ? `<p class="muted small">${icon('refresh')}Wording with the local model…</p>` : ''}${x.a.act ? `<button class="btn ghost sm" data-act="${x.a.act.act}" ${x.a.act.id ? `data-id="${esc(x.a.act.id)}"` : ''} ${x.a.act.v ? `data-v="${x.a.act.v}"` : ''} ${x.a.act.guess ? `data-guess="${x.a.act.guess}"` : ''}>${esc(x.a.act.label)}</button>` : ''}</div>`).join('')
        : '<p class="muted small">Try one of these, or ask your own question:</p>'}</div>
      <div class="chips ask-sug">${Assistant.SUGGEST.map((s) => `<button data-act="askq" data-q="${esc(s)}">${esc(s)}</button>`).join('')}</div>
      <form id="ask-form" class="ask-row"><input id="ask-in" name="q" class="text" type="text" maxlength="300" autocomplete="off" placeholder="${m.listening ? 'Listening…' : 'Ask a question'}">${micBtn('ask-in')}<button class="btn primary" type="submit">${icon('next')}<span class="vh">Ask</span></button></form>
      <label class="remember small"><input type="checkbox" id="ask-speak" ${m.speak ? 'checked' : ''}> Read answers aloud</label>
      <p class="muted small">Supports, never replaces, the Crew Medical Officer and your medical checklists.</p>
    </div></div>`;
}

/* Inventory-aware treatment panel inside the emergency protocol. */
function emgSuppliesHtml(emgId, m) {
  const pl = Emergency.plan(emgId, m);
  if (!(EMG_NEEDS[emgId] || []).length) return `<section class="emg-sup"><h3>${icon('box')}From the ship inventory</h3><p class="muted small">No medicine for this situation without the Crew Medical Officer. Stay with them.</p></section>`;
  return `<section class="emg-sup"><h3>${icon('box')}Use what is on board</h3>
    ${pl.inventoryEmpty ? '<p class="muted small">The ship inventory for this mission is empty.</p>' : ''}
    <ul class="sup">${pl.use.map((u) => `<li class="ok"><span class="mk">✓</span><div><b>${esc(u.item.name)}</b> <small>${u.item.qty} ${esc(u.item.unit)}${u.item.note ? ' · ' + esc(u.item.note) : ''}</small><p>${esc(u.when)}</p>${u.warn ? `<p class="warn-t">${esc(u.warn)}</p>` : ''}</div></li>`).join('')}
      ${pl.avoid.map((a) => `<li class="no"><span class="mk">⛔</span><div><b>Do not give ${esc(a.item.name)}</b><p>${esc(firstName(m))} — ${esc(a.why)}.</p></div></li>`).join('')}
      ${pl.missing.map((x) => `<li class="miss"><span class="mk">!</span><div><b>${esc(x.name)}</b> <small>${esc(x.why)}</small>${x.alt ? `<p>${esc(x.alt)}</p>` : ''}</div></li>`).join('')}</ul>
    ${pl.missing.length ? '<button class="btn ghost sm" data-act="medkit">Add the standard medical kit to the inventory</button>' : ''}
  </section>`;
}

function emgProfileHtml(m) {
  const p = m.med; const al = Medical.allergyNames(p);
  if (!p || Medical.empty(p)) return `<div class="emg-med empty"><b>No medical profile</b><p class="muted small">Allergies are unknown — ask them if they can answer, and check their medical record before giving any medicine.</p></div>`;
  return `<div class="emg-med"><p><b>Allergies:</b> ${al.length ? al.map((a) => `<span class="alg-chip">${esc(a)}</span>`).join(' ') : 'none recorded'}</p>
    ${p.meds.length ? `<p><b>Takes:</b> ${esc(p.meds.join('; '))}</p>` : ''}${p.conditions.length ? `<p><b>Conditions:</b> ${esc(p.conditions.join('; '))}</p>` : ''}
    ${p.blood ? `<p><b>Blood type:</b> ${esc(p.blood)}</p>` : ''}${p.notes ? `<p class="muted small">${esc(p.notes)}</p>` : ''}</div>`;
}

function emgAskHtml(md) {
  const chat = md.ask || [];
  return `<section class="emg-ask"><h3>${icon('chat')}Ask what to do</h3>
    ${chat.map((x) => `<div class="q">${esc(x.q)}</div><div class="a">${x.a.html}</div>`).join('')}
    ${chat.length ? '' : `<div class="chips ask-sug">${Assistant.SUGGEST_EMG.map((s) => `<button data-act="emgq" data-q="${esc(s)}">${esc(s)}</button>`).join('')}</div>`}
    <form id="emg-ask-form" class="ask-row"><input id="emg-ask-in" name="q" class="text" type="text" maxlength="300" autocomplete="off" placeholder="e.g. What medicine can I give?">${micBtn('emg-ask-in')}<button class="btn sos" type="submit">${icon('next')}<span class="vh">Ask</span></button></form>
  </section>`;
}

/* A knowledge-base answer reworded by the local model: its text, then the protocol's own sources. */
function llmHtml(a) {
  const txt = esc(a.llm).replace(/\[(KB-[A-Z]+-\d+)\]/g, '<code>$1</code>').replace(/\n+/g, '<br>');
  const src = (a.html.match(/<p class="src">[\s\S]*?<\/p>/) || [''])[0];
  return `<p>${txt}</p>${src}<p class="engine">${icon('chat')}Worded by the local model (${esc(LocalLLM.model)}) from the protocol above — it cannot add facts or doses.</p>`;
}
