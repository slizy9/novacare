/* NOVACARE — medication rules engine. This is the authority for any "can I give / take X?" question:
   it decides BEFORE any language model is involved, and every decision names its rule and source.

   Order: allergy (block) → interaction (block or caution) → stock (ship inventory) → dose (by weight
   when it applies). Doses are standard adult reference doses and always say "confirm with the
   mission medical checklist" — the Crew Medical Officer has the final word. */

const RULES_VERSION = '1.0 (2026-11-14)';

/* Standard adult reference doses (prototype values). perKg: mg per kg, capped at maxDose. */
const DOSE = {
  paracetamol: { perKg: 15, maxDose: 1000, every: 'every 4–6 h', maxDay: '4 g (3 g with liver disease)' },
  nsaid: { fixed: '400 mg (ibuprofen)', every: 'every 6–8 h with food', maxDay: '1.2 g without medical advice' },
  aspirin: { fixed: '300 mg, chewed, once', every: 'for suspected heart attack only, if the checklist or flight surgeon agrees', maxDay: 'single dose' },
  epinephrine: { fixed: '0.3 mg into the outer thigh (auto-injector, adults ≥30 kg)', every: 'repeat after 5–15 min if no improvement', maxDay: 'as the checklist directs' },
  antihistamine: { fixed: '10 mg (cetirizine)', every: 'once a day', maxDay: '10 mg' },
  inhaler: { fixed: '2 puffs (100 mcg each, salbutamol)', every: 'up to 4–8 puffs in an attack, repeat as the checklist says', maxDay: 'per checklist' },
  antiemetic: { fixed: '4 mg (ondansetron)', every: 'every 8 h if needed', maxDay: '16 mg' },
  nitro: { fixed: '0.4 mg under the tongue', every: 'every 5 min, up to 3 doses, only if systolic BP ≥ 90', maxDay: '3 doses per episode' },
  antibioticPen: { fixed: '500 mg (amoxicillin)', every: 'every 8 h, usually 5–7 days', maxDay: '1.5 g' },
  antibiotic: { fixed: 'per the course label', every: 'as the medical checklist directs', maxDay: '—' },
  opioid: { fixed: 'only as directed by the flight surgeon', every: '—', maxDay: '—' },
  glucose: { fixed: '15–20 g of glucose gel', every: 're-check after 15 min', maxDay: '—' },
};

/* Interactions with what the person already takes (or conditions they have). */
const INTERACT = [
  { id: 'R-INT-01', drugs: ['nitro'], rx: /sildenafil|tadalafil|vardenafil|pde5/, level: 'block', why: 'nitrate with a PDE5 inhibitor can drop blood pressure dangerously' },
  { id: 'R-INT-02', drugs: ['aspirin', 'nsaid'], rx: /warfarin|apixaban|rivaroxaban|dabigatran|heparin|enoxaparin|clopidogrel|anticoag/, level: 'block', why: 'raises bleeding risk with a blood thinner' },
  { id: 'R-INT-03', drugs: ['nsaid'], rx: /lisinopril|enalapril|ramipril|captopril|losartan|valsartan|irbesartan|diuretic|furosemide|hydrochlorothiazide/, level: 'caution', why: 'can raise blood pressure and strain the kidneys with this blood-pressure medicine' },
  { id: 'R-INT-04', drugs: ['opioid'], rx: /diazepam|lorazepam|alprazolam|zolpidem|benzodiazep/, level: 'block', why: 'combined with a sedative it can stop breathing' },
  { id: 'R-INT-05', drugs: ['antiemetic'], rx: /citalopram|escitalopram|amiodarone|haloperidol|methadone/, level: 'caution', why: 'both can prolong the QT interval (heart rhythm)' },
  { id: 'R-INT-06', drugs: ['epinephrine'], rx: /propranolol|metoprolol|atenolol|bisoprolol|carvedilol/, level: 'caution', why: 'a beta-blocker can make epinephrine less effective — still give it, and expect to need a second dose' },
];
const CONDITION = [
  { id: 'R-CON-01', drugs: ['nsaid', 'aspirin'], rx: /asthma|asma/, level: 'caution', why: 'can trigger bronchospasm in some people with asthma' },
  { id: 'R-CON-02', drugs: ['nsaid', 'aspirin'], rx: /ulcer|ulcera|kidney|renal|rinon/, level: 'block', why: 'unsafe with stomach ulcer or kidney disease' },
  { id: 'R-CON-03', drugs: ['paracetamol'], rx: /liver|hepat|higado/, level: 'caution', why: 'with liver disease the daily maximum is lower (3 g)' },
];

const Rules = (() => {
  const SRC_PROFILE = (p) => ({ id: 'Profile', label: `${p.name}'s medical profile`, url: null });
  /** Latest body mass for dosing: today's reading, else pre-flight baseline. */
  function weight(person) {
    if (person.me) { const st = Engine.status('mass'); if (st.v != null) return st.v; }
    else if (person.latest && person.latest.mass && person.latest.mass.v != null) return person.latest.mass.v;
    return person.med && person.med.baseline && person.med.baseline.mass ? +person.med.baseline.mass : null;
  }
  /** Decide about one supply class for one person. Returns { status: block|caution|ok, rules, dose, stock }. */
  function check(cls, person) {
    const p = person.med; const name = person.me ? 'You' : person.name.split(' ')[0]; const rules = [];
    const blocked = Medical.blocked(p);
    if (blocked[cls] && !/thinner/.test(blocked[cls])) rules.push({ id: 'R-ALG-01', level: 'block', text: `${name} ${person.me ? 'are' : 'is'} allergic to ${blocked[cls]}`, src: [SRC_PROFILE(person)] });
    const meds = p ? fold(p.meds.join(' ')) : ''; const cond = p ? fold(p.conditions.join(' ')) : '';
    INTERACT.forEach((r) => { if (r.drugs.includes(cls) && r.rx.test(meds)) rules.push({ id: r.id, level: r.level, text: `Takes ${p.meds.find((m) => r.rx.test(fold(m)))} — ${r.why}`, src: [SRC_PROFILE(person), SRC.pharm] }); });
    CONDITION.forEach((r) => { if (r.drugs.includes(cls) && r.rx.test(cond)) rules.push({ id: r.id, level: r.level, text: `Has ${p.conditions.find((m) => r.rx.test(fold(m)))} — ${r.why}`, src: [SRC_PROFILE(person)] }); });
    if (!p || Medical.empty(p)) rules.push({ id: 'R-PRO-01', level: 'caution', text: `${name}'s medical profile is empty, so allergies and interactions cannot be checked`, src: [] });
    const it = Emergency.find(cls, Emergency.onBoard());
    const stock = it ? (it.qty > 0 ? { ok: true, text: `${it.name}: ${it.qty} ${it.unit} on board${it.note ? ' · ' + it.note : ''}` } : { ok: false, text: `${it.name} is out of stock` }) : { ok: false, text: 'Not in the ship inventory' };
    rules.push({ id: 'R-STK-01', level: stock.ok ? 'ok' : 'caution', text: stock.text, src: [{ id: 'Inventory', label: 'Ship inventory', url: null }] });
    const d = DOSE[cls]; let dose = null;
    if (d) {
      const kg = weight(person);
      if (d.perKg) dose = kg ? `${Math.min(d.maxDose, Math.round((d.perKg * kg) / 50) * 50)} mg (${d.perKg} mg/kg × ${kg} kg, max ${d.maxDose} mg) ${d.every}; max ${d.maxDay} a day` : `${d.maxDose} mg ${d.every}; max ${d.maxDay} a day (no body mass logged — dose not adjusted to weight)`;
      else dose = `${d.fixed}, ${d.every}; max ${d.maxDay}`;
    }
    const status = rules.some((r) => r.level === 'block') ? 'block' : rules.some((r) => r.level === 'caution') ? 'caution' : 'ok';
    return { cls, status, rules, dose, stock };
  }
  return { check, weight };
})();
