/* NOVACARE — reference data: environments, indicators, body systems, hazards, routine.
   Thresholds are general adult resting reference ranges adapted for a prototype.
   This is a hackathon concept, not a medical device. */

const INF = Infinity;

const LEVELS = [
  { key: 'ok',    name: 'Nominal',   sym: '●' },
  { key: 'warn',  name: 'Watch',     sym: '▲' },
  { key: 'alert', name: 'Attention', sym: '◆' },
  { key: 'crit',  name: 'Critical',  sym: '■' },
];

/* rad = typical daily dose (mSv/day): ISS dosimetry; MSL-RAD cruise (~1.8) and
   Mars surface (~0.67); Chang'E-4 LND lunar surface (~1.4). */
const ENVIRONMENTS = {
  iss: {
    name: 'Space station (low Earth orbit)', short: 'Station · LEO', gravity: '0 g (microgravity)',
    g: 0, rad: 0.5, exTarget: 120,
    comm: 'Near real-time voice and video with ground',
    commNote: 'ground can answer in near real-time.',
    evac: 'Return to Earth possible within hours',
    note: 'Full exercise hardware and medical kit available. Earth\'s magnetic field still gives partial radiation protection.',
  },
  transit: {
    name: 'Deep-space transit vehicle', short: 'Transit · deep space', gravity: '0 g (microgravity)',
    g: 0, rad: 1.8, exTarget: 120,
    comm: 'Up to 22 min one-way delay',
    commNote: 'a ground reply can take 40+ minutes round-trip, so begin onboard care first.',
    evac: 'No evacuation — the crew is the medical team',
    note: 'No magnetic shielding: galactic cosmic rays and solar particle events are the main radiation sources. Small cabin, long confinement.',
  },
  moon: {
    name: 'Lunar surface base', short: 'Moon base', gravity: '0.17 g',
    g: 0.17, rad: 1.4, exTarget: 60,
    comm: 'About 1.3 s one-way delay',
    commNote: 'ground can answer within seconds.',
    evac: 'Return to Earth takes days',
    note: 'Partial gravity helps but is not known to be enough to protect bone and muscle. Lunar dust is an added lung and eye irritant.',
  },
  mars: {
    name: 'Mars surface base', short: 'Mars base', gravity: '0.38 g',
    g: 0.38, rad: 0.7, exTarget: 60,
    comm: '4–22 min one-way delay',
    commNote: 'a ground reply can take up to 44 minutes round-trip, so begin onboard care first.',
    evac: 'No evacuation for months',
    note: 'Crew arrives deconditioned after months of transit and must work in gravity immediately — watch for dizziness on standing.',
  },
  rover: {
    name: 'Pressurized rover (surface excursion)', short: 'Rover excursion', gravity: 'Partial gravity',
    g: 0.17, rad: 1.4, exTarget: 60,
    comm: 'Relayed through base — may drop out',
    commNote: 'contact base first; link to ground is relayed and may be delayed.',
    evac: 'Return to base takes hours',
    note: 'Thin shielding, very small cabin, limited medical kit. If a solar particle event is forecast, return to base or shelter.',
  },
};

const CAREER_DOSE_LIMIT = 600; // mSv — NASA career effective dose limit (2022 standard)

const INDICATORS = [
  {
    id: 'sys', name: 'Blood pressure — systolic', short: 'Systolic BP', unit: 'mmHg', type: 'number',
    step: 1, dec: 0, min: 50, max: 250, cadence: 1, def: 118,
    bands: () => ({ ok: [90, 129], warn: [85, 139], crit: [80, 179] }),
    view: () => [70, 200],
    how: [
      'Secure yourself and rest quietly for 5 minutes. No exercise or caffeine in the last 30 minutes.',
      'Wrap the cuff on your bare upper arm, about two fingers above the elbow crease.',
      'Keep the arm relaxed at heart level, stay silent and still, then press start.',
      'Enter the top (larger) number here.',
    ],
    why: 'Systolic pressure is the force in your arteries when the heart pumps. It is the simplest early signal of cardiovascular strain.',
    space: 'Without gravity about 2 litres of fluid shift toward your head and plasma volume drops. Blood vessels can stiffen over months, and salty space food pushes pressure up. After landing on a planet, pressure may fall when you stand.',
    advice: {
      high: { title: 'Systolic pressure is above range', actions: [
        'Rest 5 minutes and re-measure twice, one minute apart. Use the lower reading.',
        'Check today\'s sodium — choose low-salt menu items and keep drinking water.',
        'Note any headache, chest pain, breathlessness or vision change. Any of these makes this urgent.',
        'Repeat tomorrow at the same time to see if it persists.',
      ] },
      low: { title: 'Systolic pressure is below range', actions: [
        'Secure yourself, drink 250–500 mL of water or an electrolyte drink.',
        'In gravity: sit or lie with legs raised and stand up slowly.',
        'Re-measure in 15 minutes. If you feel faint or confused, call the Crew Medical Officer.',
      ] },
    },
  },
  {
    id: 'dia', name: 'Blood pressure — diastolic', short: 'Diastolic BP', unit: 'mmHg', type: 'number',
    step: 1, dec: 0, min: 30, max: 160, cadence: 1, def: 76,
    bands: () => ({ ok: [60, 84], warn: [55, 89], crit: [45, 119] }),
    view: () => [40, 130],
    how: ['Taken in the same cuff reading as systolic.', 'Enter the bottom (smaller) number here.'],
    why: 'Diastolic pressure is the pressure between heartbeats, while the heart refills.',
    space: 'Fluid shifts and changes in blood vessel tone alter resting pressure in flight. A sustained rise deserves attention just as it would on Earth.',
    advice: {
      high: { title: 'Diastolic pressure is above range', actions: [
        'Rest 5 minutes and re-measure twice.',
        'Reduce sodium and caffeine today; keep hydrated.',
        'If it stays high on 3 consecutive days, raise it at the next medical conference.',
      ] },
      low: { title: 'Diastolic pressure is below range', actions: [
        'Drink 250–500 mL of fluid and re-measure in 15 minutes.',
        'If you are dizzy or faint, tell the Crew Medical Officer.',
      ] },
    },
  },
  {
    id: 'hr', name: 'Resting heart rate', short: 'Heart rate', unit: 'bpm', type: 'number',
    step: 1, dec: 0, min: 25, max: 220, cadence: 1, def: 62,
    bands: () => ({ ok: [50, 90], warn: [45, 100], crit: [38, 130] }),
    view: () => [30, 150],
    how: [
      'Measure after waking or after 5 minutes of quiet rest.',
      'Use the pulse oximeter or cuff reading — or place two fingers on your wrist below the thumb.',
      'Count beats for 30 seconds and multiply by 2.',
    ],
    why: 'Resting heart rate reflects fitness, hydration, stress and illness. A rising trend is often the first sign that something is off.',
    space: 'The heart works less against gravity and can lose muscle mass. Dehydration, poor sleep, infection and deconditioning all push resting rate up. Heart rhythm changes have been reported on long missions.',
    advice: {
      high: { title: 'Resting heart rate is elevated', actions: [
        'Rest 10 minutes and re-measure.',
        'Drink water — low plasma volume raises heart rate.',
        'Take your temperature to rule out fever, and think about caffeine and stress today.',
        'Palpitations, chest pain or a rate above 130 at rest: call the Crew Medical Officer now.',
      ] },
      low: { title: 'Resting heart rate is low', actions: [
        'A low rate can be normal for very fit crew. Compare with your own baseline.',
        'If you feel dizzy, faint or unusually tired, tell the Crew Medical Officer.',
      ] },
    },
  },
  {
    id: 'spo2', name: 'Blood oxygen saturation', short: 'SpO₂', unit: '%', type: 'number',
    step: 1, dec: 0, min: 60, max: 100, cadence: 1, def: 98,
    bands: () => ({ ok: [95, 100], warn: [92, 100], crit: [88, 100] }),
    view: () => [84, 100],
    how: [
      'Warm your hands — cold fingers give false low readings.',
      'Clip the pulse oximeter on your index finger and hold still.',
      'Wait about 30 seconds for the number to settle, then record it.',
    ],
    why: 'SpO₂ shows how much oxygen your blood is carrying. It checks both your lungs and the cabin air you are breathing.',
    space: 'You live in a sealed atmosphere made by machines. A leak, a life-support fault or a pocket of stale air affects oxygen before you feel it. Lunar and Martian dust can also irritate the lungs.',
    advice: {
      low: { title: 'Blood oxygen is below range', actions: [
        'Warm the finger, reposition the sensor and re-measure on another finger.',
        'Take slow deep breaths and move to a well-ventilated area.',
        'Check the cabin O₂ and CO₂ readings. Ask whether crewmates have symptoms — a shared cause means an environment problem.',
        'Below 92% on repeat, or any breathlessness: call the Crew Medical Officer.',
      ] },
      high: { title: 'SpO₂', actions: [] },
    },
  },
  {
    id: 'temp', name: 'Body temperature', short: 'Temperature', unit: '°C', type: 'number',
    step: 0.1, dec: 1, min: 33, max: 42, cadence: 1, def: 36.8,
    bands: () => ({ ok: [36.1, 37.5], warn: [35.5, 37.9], crit: [35.0, 38.9] }),
    view: () => [34.5, 40],
    how: [
      'Wait 15 minutes after exercise, food or a hot or cold drink.',
      'Place the thermometer under the tongue (or on the forehead for the infrared model) and hold still until it beeps.',
      'Measure at the same time each day so readings are comparable.',
    ],
    why: 'Temperature is the classic sign of infection or inflammation.',
    space: 'Immune cells behave differently in spaceflight and dormant viruses can reactivate. Microbes spread easily in a closed cabin. Studies also show resting core temperature creeps up by up to about 1 °C on long missions, because the body sheds heat poorly without convection.',
    advice: {
      high: { title: 'Temperature is elevated', actions: [
        'Re-measure in 30 minutes, at rest.',
        'Note symptoms: sore throat, cough, rash, pain, urinary symptoms, any wound.',
        'Drink extra fluids and rest. Skip heavy exercise today.',
        'Use your own utensils and wipes, and clean shared surfaces — infections travel fast in a closed habitat.',
        '38.0 °C or higher: inform the Crew Medical Officer.',
      ] },
      low: { title: 'Temperature is low', actions: [
        'Check the thermometer placement and re-measure.',
        'Add a clothing layer and check the cabin temperature setting.',
        'If you are shivering, clumsy or confused, call the Crew Medical Officer.',
      ] },
    },
  },
  {
    id: 'glu', name: 'Fasting blood glucose', short: 'Blood glucose', unit: 'mg/dL', type: 'number',
    step: 1, dec: 0, min: 20, max: 500, cadence: 3, def: 90,
    bands: () => ({ ok: [70, 99], warn: [65, 125], crit: [54, 250] }),
    view: () => [40, 200],
    how: [
      'Measure before breakfast, at least 8 hours after your last meal.',
      'Clean and dry a fingertip. Prick the side of the finger with the lancet.',
      'Touch the drop to the test strip and wait for the meter to read.',
      'Dispose of the lancet and strip in the sharps container.',
    ],
    why: 'Glucose shows how well your body is handling energy. Both low and high values affect thinking, mood and stamina.',
    space: 'Inactivity, stress hormones and disrupted sleep reduce insulin sensitivity. Bed-rest and flight studies show glucose control drifting toward a pre-diabetic pattern, while under-eating can cause lows.',
    advice: {
      high: { title: 'Fasting glucose is above range', actions: [
        'Confirm the reading was truly fasting. Repeat tomorrow morning.',
        'Choose lower-sugar menu items and spread carbohydrates across meals.',
        'Keep to your exercise prescription — muscle activity improves glucose control.',
        'Protect your sleep; short sleep raises glucose.',
      ] },
      low: { title: 'Glucose is low', actions: [
        'Eat or drink about 15 g of fast carbohydrate now (juice pouch, candy, honey).',
        'Re-measure after 15 minutes and repeat if still low.',
        'Follow with a proper meal. Do not start an EVA or critical task until corrected.',
      ] },
    },
  },
  {
    id: 'sleep', name: 'Sleep last night', short: 'Sleep', unit: 'h', type: 'number',
    step: 0.5, dec: 1, min: 0, max: 16, cadence: 1, def: 7,
    bands: () => ({ ok: [7, 9], warn: [6, 10], crit: [4, INF] }),
    view: () => [3, 11],
    how: [
      'Use your wearable\'s sleep total if you have one.',
      'Otherwise estimate: time asleep, not time in the sleep station.',
      'Subtract long awake periods during the night.',
    ],
    why: 'Sleep restores attention, mood, immune function and blood sugar control. Fatigue is a leading cause of operational errors.',
    space: 'Station crews see a sunrise every 90 minutes; on Mars the day is 39 minutes longer. Noise, workload, CO₂ and excitement all cut sleep — crews average only about 6 hours a night in flight.',
    advice: {
      low: { title: 'Short sleep', actions: [
        'Tonight: dim the lights and stop screens 1 hour before your sleep window.',
        'Use the eye mask and earplugs. Keep the sleep station cool and well ventilated.',
        'No caffeine in the 6 hours before sleep.',
        'Under 5 hours: tell the commander before safety-critical tasks and ask about a schedule adjustment.',
      ] },
      high: { title: 'Long sleep', actions: [
        'Extra sleep can be healthy recovery. If it comes with low mood or feeling unwell, mention it at your next check-in.',
      ] },
    },
  },
  {
    id: 'mood', name: 'Mood', short: 'Mood', unit: '/ 5', type: 'scale',
    step: 1, dec: 0, min: 1, max: 5, cadence: 1, def: 4,
    scale: [
      { v: 1, label: 'Very low' }, { v: 2, label: 'Low' }, { v: 3, label: 'Flat' },
      { v: 4, label: 'Good' }, { v: 5, label: 'Great' },
    ],
    bands: () => ({ ok: [4, 5], warn: [3, 5], crit: [-INF, INF] }),
    view: () => [1, 5],
    how: [
      'Pause for ten seconds and ask: how have I felt overall today?',
      'Pick the answer that fits best. There is no right answer — honesty is what makes the trend useful.',
    ],
    why: 'Mood is the most direct behavioral health signal you have, and you are the only sensor for it.',
    space: 'Isolation, confinement, monotony, distance from family and a small crew wear people down gradually. Studies of long missions and analog habitats show mood often dips in the third quarter.',
    advice: {
      low: { title: 'Mood is low', actions: [
        'Talk to a crewmate you trust today — even briefly.',
        'Do one thing you enjoy: window time, music, the plant growth unit, a message home.',
        'Keep your exercise session; it reliably lifts mood.',
        'Ask for a private psychological or family conference. These are confidential and part of normal mission support.',
      ] },
      high: { title: 'Mood', actions: [] },
    },
  },
  {
    id: 'stress', name: 'Stress level', short: 'Stress', unit: '/ 5', type: 'scale',
    step: 1, dec: 0, min: 1, max: 5, cadence: 1, def: 2,
    scale: [
      { v: 1, label: 'Calm' }, { v: 2, label: 'Mild' }, { v: 3, label: 'Tense' },
      { v: 4, label: 'High' }, { v: 5, label: 'Overwhelmed' },
    ],
    bands: () => ({ ok: [1, 2], warn: [1, 3], crit: [-INF, INF] }),
    view: () => [1, 5],
    how: [
      'Notice your body: tight shoulders, shallow breathing, racing thoughts?',
      'Rate how stressed you have felt today overall.',
    ],
    why: 'Sustained stress impairs sleep, immunity, blood pressure and teamwork.',
    space: 'High workload, danger, confinement with the same few people and limited privacy keep stress hormones raised, which in turn weakens the immune system.',
    advice: {
      high: { title: 'Stress is high', actions: [
        'Box breathing for 5 minutes: in 4 s, hold 4 s, out 4 s, hold 4 s.',
        'Name the main stressor. If it is workload, tell the commander or ground — schedules can change.',
        'Take your exercise session and protect tonight\'s sleep.',
        'If tension involves a crewmate, raise it early and directly, or ask for support in a private conference.',
      ] },
      low: { title: 'Stress', actions: [] },
    },
  },
  {
    id: 'water', name: 'Fluid intake today', short: 'Hydration', unit: 'L', type: 'number',
    step: 0.1, dec: 1, min: 0, max: 8, cadence: 1, def: 2.2,
    bands: () => ({ ok: [2.0, 4.0], warn: [1.5, 5.0], crit: [0.8, INF] }),
    view: () => [0.5, 4.5],
    how: [
      'Add up drink pouches and rehydrated beverages for the day (most pouches are 0.2–0.25 L).',
      'Include soup and rehydration water in meals if you track it.',
      'Quick check: urine should be pale yellow.',
    ],
    why: 'Hydration supports blood volume, kidney function, thinking and temperature control.',
    space: 'Thirst is blunted in microgravity. At the same time, calcium leaving your bones is excreted in urine, so low fluid intake sharply raises kidney stone risk — a serious problem far from Earth.',
    advice: {
      low: { title: 'Fluid intake is low', actions: [
        'Drink 250 mL now and one pouch every hour you are awake.',
        'Check urine colour — dark yellow means drink more.',
        'Keep a pouch clipped at your workstation as a cue.',
        'Flank pain or blood in urine: call the Crew Medical Officer (possible kidney stone).',
      ] },
      high: { title: 'Very high fluid intake', actions: [
        'More than 4 L a day is rarely needed. Add electrolytes rather than plain water if you are sweating heavily.',
      ] },
    },
  },
  {
    id: 'exercise', name: 'Exercise today', short: 'Exercise', unit: 'min', type: 'number',
    step: 5, dec: 0, min: 0, max: 300, cadence: 1, def: 90,
    bands: (env) => ({ ok: [env.exTarget * 0.75, 180], warn: [env.exTarget * 0.4, 210], crit: [-INF, INF] }),
    view: () => [0, 220],
    how: [
      'Add resistance and aerobic minutes together (treadmill, cycle, resistive device, loaded walking).',
      'Count working time, not setup time.',
    ],
    why: 'Exercise is the main countermeasure against bone loss, muscle wasting and heart deconditioning.',
    space: 'Without loading, weight-bearing bones lose about 1–1.5% of mineral density per month and leg muscles shrink quickly. Station crews exercise around 2 hours a day. Partial gravity on the Moon or Mars helps, but nobody yet knows if it is enough.',
    advice: {
      low: { title: 'Exercise below prescription', actions: [
        'Reschedule the missed session today if you can; prioritise resistance work for bone.',
        'Split it: two short sessions count as much as one long one.',
        'If pain or injury is the reason, tell the Crew Medical Officer rather than pushing through.',
        'If hardware is down, use elastic bands and body-weight isometrics.',
      ] },
      high: { title: 'Very high exercise load', actions: [
        'Watch for overtraining: poor sleep, raised resting heart rate, sore joints. Take a lighter day.',
      ] },
    },
  },
  {
    id: 'mass', name: 'Body mass', short: 'Body mass', unit: 'kg', type: 'number',
    step: 0.1, dec: 1, min: 35, max: 160, cadence: 7, def: 72,
    bands: (env, ctx) => {
      const b = ctx.baselineMass;
      if (!b) return { ok: [-INF, INF], warn: [-INF, INF], crit: [-INF, INF] };
      return { ok: [b * 0.97, b * 1.03], warn: [b * 0.95, b * 1.05], crit: [b * 0.90, INF] };
    },
    view: (env, ctx) => { const b = ctx.baselineMass || 72; return [b * 0.86, b * 1.1]; },
    how: [
      'In microgravity, use the body mass measurement device: it oscillates you on a spring and calculates mass from the motion.',
      'On a surface base, use the scale calibrated for local gravity.',
      'Measure before breakfast, in light clothing. Your first entry becomes your baseline.',
    ],
    why: 'Mass loss means you are eating less than you burn — and you lose muscle and bone along with fat.',
    space: 'Appetite drops in flight: food tastes blander with a congested head, menus repeat and schedules squeeze meals. Crews commonly under-eat, which worsens bone and muscle loss.',
    advice: {
      low: { title: 'Body mass is dropping', actions: [
        'Add one extra snack (300–500 kcal) every day and do not skip meals.',
        'Favour protein with each meal to protect muscle.',
        'Log food for 3 days so the nutrition team can adjust your menu.',
        'Keep resistance exercise going — it tells the body to keep muscle.',
      ] },
      high: { title: 'Body mass is rising', actions: [
        'Repeat the measurement to rule out error.',
        'Review snack intake against exercise minutes this week.',
      ] },
    },
  },
  {
    id: 'vision', name: 'Vision change', short: 'Vision', unit: '/ 3', type: 'scale',
    step: 1, dec: 0, min: 0, max: 3, cadence: 7, def: 0,
    scale: [
      { v: 0, label: 'No change' }, { v: 1, label: 'Slight blur' },
      { v: 2, label: 'Clear blur' }, { v: 3, label: 'Marked change' },
    ],
    bands: () => ({ ok: [0, 0], warn: [0, 1], crit: [-INF, INF] }),
    view: () => [0, 3],
    how: [
      'Hold the near-vision card at arm\'s length (40 cm) in good light.',
      'Cover one eye and read the smallest line you can. Repeat with the other eye.',
      'Compare with your pre-flight baseline line. Note any new blur, spots or distortion of straight lines.',
    ],
    why: 'Vision changes are one of the highest-priority risks of long missions, and they begin without pain.',
    space: 'Headward fluid shift raises pressure behind the eye. Many long-duration astronauts develop Spaceflight Associated Neuro-ocular Syndrome (SANS): swelling of the optic disc, flattening of the eyeball and a shift toward far-sightedness. High cabin CO₂ may make it worse.',
    advice: {
      high: { title: 'Vision has changed', actions: [
        'Repeat the near-vision card test for each eye and record the line you can read.',
        'Try the adjustable-focus spare glasses from the medical kit.',
        'Check cabin CO₂ and note any headaches.',
        'Report to the flight surgeon — they may schedule an eye ultrasound, OCT scan or retinal image.',
      ] },
      low: { title: 'Vision', actions: [] },
    },
  },
  {
    id: 'rad', name: 'Radiation dose today', short: 'Radiation', unit: 'mSv', type: 'number',
    step: 0.05, dec: 2, min: 0, max: 500, cadence: 1, def: 0.5,
    bands: (env) => ({ ok: [0, env.rad * 1.5], warn: [0, env.rad * 3], crit: [-INF, env.rad * 10] }),
    view: (env) => [0, env.rad * 5],
    how: [
      'Read your personal active dosimeter — keep it on your body at all times, including during sleep and EVA.',
      'Enter the dose accumulated over the last 24 hours.',
      'If the dosimeter alarm has sounded, follow the shelter procedure first and log afterwards.',
    ],
    why: 'Radiation cannot be felt. Your dosimeter is the only way to know your exposure and to keep your career dose within limits.',
    space: 'Beyond Earth\'s magnetic field you are exposed to galactic cosmic rays all the time and to bursts from solar particle events. Radiation raises lifetime cancer risk and may harm the heart, blood vessels, brain and eye lens.',
    advice: {
      high: { title: 'Radiation dose above expected', actions: [
        'Check for a space weather alert or solar particle event warning.',
        'Move to the best-shielded area (crew quarters or storm shelter) until levels fall.',
        'Postpone EVA and rover excursions.',
        'Compare with crewmates\' dosimeters and report readings to ground.',
      ] },
      low: { title: 'Radiation', actions: [] },
    },
  },
  {
    id: 'co2', name: 'Cabin CO₂ level', short: 'Cabin CO₂', unit: 'mmHg', type: 'number',
    step: 0.1, dec: 1, min: 0, max: 20, cadence: 1, def: 2.6,
    bands: () => ({ ok: [0, 3.0], warn: [0, 5.0], crit: [-INF, 7.6] }),
    view: () => [0, 9],
    how: [
      'Read the partial pressure of CO₂ from the cabin air monitor or your personal CO₂ sensor.',
      'Take it where you actually spend time — your workstation or sleep station.',
    ],
    why: 'Carbon dioxide you breathe out has to be scrubbed by machines. Levels far above Earth-normal cause headaches, poor concentration and poor sleep.',
    space: 'Without gravity, warm air does not rise. Exhaled CO₂ can pool around your head wherever ventilation is weak. Cabin CO₂ is routinely about ten times higher than on Earth, and crews report symptoms at lower levels than expected.',
    advice: {
      high: { title: 'Cabin CO₂ is elevated', actions: [
        'Move to an area with strong airflow. Do not rest or sleep in a dead-air pocket.',
        'Check that vents and fan inlets are not blocked by cargo or debris.',
        'Check the CO₂ removal system status and report the reading to ground.',
        'Note any headache, flushed face or trouble concentrating — and ask your crewmates.',
      ] },
      low: { title: 'CO₂', actions: [] },
    },
  },
  {
    id: 'ecg', name: 'ECG rhythm (exam)', short: 'ECG', unit: '/ 3', type: 'scale', exam: true,
    step: 1, dec: 0, min: 0, max: 3, cadence: 30, def: 0,
    scale: [
      { v: 0, label: 'Normal rhythm' }, { v: 1, label: 'Minor change' },
      { v: 2, label: 'Abnormal rhythm' }, { v: 3, label: 'Dangerous rhythm' },
    ],
    bands: () => ({ ok: [0, 0], warn: [0, 1], crit: [-INF, 2] }),
    view: () => [0, 3],
    how: ['Taken by the Crew Medical Officer with the onboard ECG, at rest, lying restrained.', 'Record what the officer reads: normal, a minor change (such as occasional extra beats), an abnormal rhythm, or a dangerous one.', 'Keep the printout or file with your record for the flight surgeon.'],
    why: 'The heart adapts to weightlessness and its rhythm can change. An ECG finds problems that heart rate and blood pressure cannot show.',
    space: 'Fluid shifts, lower blood volume and stress change the load on the heart. Rhythm problems in flight are rare but can be serious far from a hospital.',
    advice: {
      high: { title: 'ECG shows a change in rhythm', actions: ['Rest, stay restrained and avoid strenuous work until the officer reviews it.', 'Measure heart rate and blood pressure now.', 'The Crew Medical Officer sends the ECG to the flight surgeon at the next link.', 'Press Help at once for chest pain, fainting or a racing heart.'] },
      low: { title: 'ECG', actions: [] },
    },
  },
  {
    id: 'urine', name: 'Urine dipstick (exam)', short: 'Urine test', unit: '/ 3', type: 'scale', exam: true,
    step: 1, dec: 0, min: 0, max: 3, cadence: 14, def: 0,
    scale: [
      { v: 0, label: 'Normal' }, { v: 1, label: 'Trace' },
      { v: 2, label: 'Positive' }, { v: 3, label: 'Strongly positive' },
    ],
    bands: () => ({ ok: [0, 0], warn: [0, 1], crit: [-INF, 2] }),
    view: () => [0, 3],
    how: ['Use a fresh dipstick from the medical kit on a fresh sample.', 'Read it at the time shown on the pack: blood, protein, leukocytes, nitrites, glucose.', 'Record the worst result: normal, trace, positive or strongly positive.'],
    why: 'A dipstick finds early signs of kidney stones, urinary infection and dehydration — all more likely in space.',
    space: 'Bone loss releases calcium into the urine, and lower fluid intake concentrates it. Kidney stones are a known spaceflight risk and very painful far from care.',
    advice: {
      high: { title: 'Urine test is positive', actions: ['Drink more: at least 2.5 L today, spread over the day.', 'Repeat the test tomorrow morning on the first sample.', 'Tell the Crew Medical Officer about any pain in the side or back, burning or blood in the urine.'] },
      low: { title: 'Urine test', actions: [] },
    },
  },
  {
    id: 'ultra', name: 'Ultrasound (exam)', short: 'Ultrasound', unit: '/ 3', type: 'scale', exam: true,
    step: 1, dec: 0, min: 0, max: 3, cadence: 30, def: 0,
    scale: [
      { v: 0, label: 'Normal' }, { v: 1, label: 'Minor finding' },
      { v: 2, label: 'Needs follow-up' }, { v: 3, label: 'Urgent finding' },
    ],
    bands: () => ({ ok: [0, 0], warn: [0, 1], crit: [-INF, 2] }),
    view: () => [0, 3],
    how: ['Done by the Crew Medical Officer with the onboard ultrasound, guided by ground or the checklist.', 'Record the result the officer gives: normal, minor finding, needs follow-up, or urgent.', 'Keep the images with your record for the flight surgeon.'],
    why: 'Ultrasound is the only imaging on board. It checks the eyes, heart, kidneys, bladder and veins.',
    space: 'It is used in flight to look for eye changes (SANS), clots in the neck veins, kidney stones and fluid where it should not be.',
    advice: {
      high: { title: 'Ultrasound found something to follow', actions: ['Follow what the Crew Medical Officer and flight surgeon decide.', 'Repeat the scan when they ask.', 'Press Help for new pain, swelling or breathlessness.'] },
      low: { title: 'Ultrasound', actions: [] },
    },
  },
  {
    id: 'pexam', name: 'Physical exam by the Crew Medical Officer', short: 'CMO exam', unit: '/ 3', type: 'scale', exam: true,
    step: 1, dec: 0, min: 0, max: 3, cadence: 30, def: 0,
    scale: [
      { v: 0, label: 'Normal' }, { v: 1, label: 'Minor finding' },
      { v: 2, label: 'Needs follow-up' }, { v: 3, label: 'Urgent finding' },
    ],
    bands: () => ({ ok: [0, 0], warn: [0, 1], crit: [-INF, 2] }),
    view: () => [0, 3],
    how: ['The Crew Medical Officer examines you with the medical checklist.', 'Record the result: normal, minor finding, needs follow-up, or urgent.', 'Add any detail as a note in the mission log.'],
    why: 'A regular exam by a trained crewmate catches what self-measurements miss.',
    space: 'Far from Earth, the Crew Medical Officer is the first and often only clinician. A record of each exam lets the flight surgeon follow changes.',
    advice: {
      high: { title: 'The exam found something to follow', actions: ['Follow the plan the Crew Medical Officer gave you.', 'Measure again what they asked you to watch.', 'Tell them if anything gets worse.'] },
      low: { title: 'CMO exam', actions: [] },
    },
  },
];

const IND = Object.fromEntries(INDICATORS.map((i) => [i.id, i]));

/* Steps of the guided check-in (blood pressure is one cuff reading, two numbers). */
const CHECKIN_GROUPS = [
  ['sys', 'dia'], ['hr'], ['spo2'], ['temp'], ['glu'], ['sleep'], ['mood'], ['stress'],
  ['water'], ['exercise'], ['mass'], ['vision'], ['rad'], ['co2'], ['ecg'], ['urine'], ['ultra'], ['pexam'],
];

/* Measurements charted in Insights and Hazards, and the exam results shown beside them. */
const CHART_IDS = ['hr', 'sys', 'dia', 'spo2', 'temp', 'sleep', 'mass', 'mood', 'stress', 'exercise', 'water', 'vision', 'rad', 'co2', 'glu'];
const EXAM_IDS = ['ecg', 'urine', 'ultra', 'pexam'];

const SYSTEMS = [
  {
    id: 'brain', name: 'Brain & behavior', indicators: ['sleep', 'mood', 'stress'], hazards: ['isolation', 'distance'],
    fn: 'Controls attention, memory, mood, sleep and decision-making.',
    space: 'Isolation, confinement, shifted light cycles and heavy workload disturb sleep and mood. Behavioral health conditions and fatigue-related errors are top mission risks, and they build slowly.',
  },
  {
    id: 'eyes', name: 'Eyes & vision', indicators: ['vision', 'co2'], hazards: ['gravity', 'environment'],
    fn: 'Focus light onto the retina and send images to the brain through the optic nerve.',
    space: 'Fluid shifting toward the head raises pressure at the back of the eye. Spaceflight Associated Neuro-ocular Syndrome (SANS) can swell the optic disc and blur near vision.',
  },
  {
    id: 'heart', name: 'Heart & circulation', indicators: ['sys', 'dia', 'hr', 'ecg'], hazards: ['gravity', 'radiation'],
    fn: 'Pumps blood to deliver oxygen and nutrients and remove waste.',
    space: 'With no gravity to work against, the heart deconditions and blood volume falls. Radiation may damage vessel linings. Standing in gravity again can cause fainting.',
  },
  {
    id: 'lungs', name: 'Lungs & breathing', indicators: ['spo2', 'co2'], hazards: ['environment'],
    fn: 'Exchange oxygen and carbon dioxide between air and blood.',
    space: 'You depend on life support for every breath. CO₂ build-up, trace contaminants, dust and pressure changes all act on the lungs first.',
  },
  {
    id: 'metabolic', name: 'Metabolism & nutrition', indicators: ['glu', 'water', 'mass', 'urine'], hazards: ['distance', 'gravity'],
    fn: 'Turns food and water into energy, regulates blood sugar and filters waste through the kidneys.',
    space: 'The food supply is fixed and cannot be restocked. Reduced appetite, blunted thirst and inactivity lead to weight loss, dehydration, kidney stones and poorer glucose control.',
  },
  {
    id: 'musculo', name: 'Bones & muscles', indicators: ['exercise', 'mass'], hazards: ['gravity'],
    fn: 'Support the body, allow movement and store calcium.',
    space: 'Unloaded bones lose about 1–1.5% of density per month and muscles weaken within weeks. Daily resistance and aerobic exercise is the proven countermeasure.',
  },
  {
    id: 'immune', name: 'Immune system & radiation', indicators: ['temp', 'rad', 'sleep'], hazards: ['radiation', 'environment', 'isolation'],
    fn: 'Defends the whole body against infection and repairs damaged cells.',
    space: 'Stress, poor sleep and radiation alter immune cells; dormant viruses can reactivate and wounds may heal slowly. Radiation dose adds up across your whole career.',
  },
];
const SYS = Object.fromEntries(SYSTEMS.map((s) => [s.id, s]));

const HAZARDS = [
  {
    id: 'radiation', letter: 'R', name: 'Space radiation',
    text: 'Outside Earth\'s magnetic shield, galactic cosmic rays and solar particle events pass through the spacecraft and your body. You cannot see or feel it.',
    risks: 'Higher lifetime cancer risk, possible damage to heart, blood vessels, brain and eye lens; acute sickness after a large solar event.',
    act: 'Wear your dosimeter, log the daily dose, shelter during solar particle events, and plan EVAs around space weather.',
    tracks: ['rad', 'temp'],
  },
  {
    id: 'isolation', letter: 'I', name: 'Isolation & confinement',
    text: 'A small crew in a small volume for months, with little privacy, repeated routines and no way to step outside.',
    risks: 'Low mood, anxiety, sleep loss, crew conflict, reduced performance, weaker immunity.',
    act: 'Log mood, stress and sleep honestly, protect your sleep window, keep in touch with family, and use private conferences early.',
    tracks: ['mood', 'stress', 'sleep'],
  },
  {
    id: 'distance', letter: 'D', name: 'Distance from Earth',
    text: 'On Mars a question to mission control can take up to 44 minutes to be answered, and resupply or evacuation is impossible. The crew must find and treat problems themselves.',
    risks: 'Delayed care, limited medicines and food that degrade over time, total reliance on the onboard kit and crew skills.',
    act: 'Catch trends early. That is the reason for daily self-monitoring: small, early actions avoid emergencies you cannot fly home from.',
    tracks: ['glu', 'mass', 'water'],
  },
  {
    id: 'gravity', letter: 'G', name: 'Gravity fields',
    text: 'A Mars mission moves through three gravity fields: weightless transit, 0.38 g on the surface and 1 g back on Earth. Each change forces the body to re-adapt.',
    risks: 'Bone and muscle loss, heart deconditioning, fluid shift to the head with vision changes (SANS), kidney stones, motion sickness and fainting after landing.',
    act: 'Complete the exercise prescription, stay hydrated, test your vision weekly and track blood pressure.',
    tracks: ['exercise', 'sys', 'hr', 'vision', 'mass'],
  },
  {
    id: 'environment', letter: 'E', name: 'Hostile & closed environments',
    text: 'The habitat is a sealed ecosystem. Air, water, temperature, noise and microbes are all managed by machines and shared by everyone on board.',
    risks: 'CO₂ build-up, contaminants and dust, changed microbes that pass between crew, noise and light that disrupt sleep.',
    act: 'Log cabin CO₂ and SpO₂, keep vents clear, practise good hygiene and report symptoms that crewmates share.',
    tracks: ['co2', 'spo2', 'temp'],
  },
];

/* Daily routine. `auto` tasks complete themselves from logged data. */
const TASKS = [
  { id: 'vitals', label: 'Morning vitals', detail: 'Blood pressure, heart rate, SpO₂, temperature', ids: ['sys', 'dia', 'hr', 'spo2', 'temp'],
    auto: (d) => ['sys', 'dia', 'hr', 'spo2', 'temp'].every((k) => d.vals[k] != null) },
  { id: 'mind', label: 'Mind check-in', detail: 'Sleep, mood and stress', ids: ['sleep', 'mood', 'stress'],
    auto: (d) => ['sleep', 'mood', 'stress'].every((k) => d.vals[k] != null) },
  { id: 'envr', label: 'Read dosimeter and cabin CO₂', detail: 'Personal radiation dose and air quality', ids: ['rad', 'co2'],
    auto: (d) => ['rad', 'co2'].every((k) => d.vals[k] != null) },
  { id: 'ex', label: 'Exercise countermeasure', detail: (env) => `${Math.round(env.exTarget * 0.75)}+ min of resistance and aerobic work`, ids: ['exercise'],
    auto: (d, env) => d.vals.exercise != null && d.vals.exercise >= env.exTarget * 0.75 },
  { id: 'h2o', label: 'Hydration goal', detail: 'Drink at least 2.0 L', ids: ['water'],
    auto: (d) => d.vals.water != null && d.vals.water >= 2 },
  { id: 'vitd', label: 'Vitamin D supplement', detail: 'No sunlight on skin in the cabin — supports bone' },
  { id: 'social', label: 'Connect with someone', detail: 'Shared crew meal or a message home' },
  { id: 'wind', label: 'Wind-down routine', detail: 'Dim lights and no screens 1 h before sleep' },
];

const RANKS = [
  { xp: 0, name: 'Cadet' },
  { xp: 1000, name: 'Flight Engineer' },
  { xp: 3000, name: 'Mission Specialist' },
  { xp: 6000, name: 'Pilot' },
  { xp: 10000, name: 'Commander' },
  { xp: 15000, name: 'Mission Legend' },
];

/* ---------- evidence behind every indicator ----------
   Why each measurement is tracked in space, from NASA sources: the Human Research Program risk it
   belongs to (Human Research Roadmap) and the crew health standard (NASA-STD-3001). Real NASA OSDR
   studies for each indicator come from js/osdr.js (OSDR.indicators). Reference ranges themselves are
   simplified general adult clinical values. */
const HRP = 'https://humanresearchroadmap.nasa.gov/risks/';
const STD3001 = { label: 'NASA-STD-3001 Space Flight Human-System Standard (Vol. 1 Crew Health, Vol. 2 Habitability & Environmental Health)', url: 'https://www.nasa.gov/ochmo/hsa-standards/' };
const risk = (name) => ({ label: `NASA Human Research Program — ${name}`, url: HRP });
const RISK = {
  cv: risk('Risk of Cardiovascular Adaptations Contributing to Adverse Mission Performance and Health Outcomes'),
  hypoxia: risk('Risk of Reduced Crew Health and Performance Due to Hypoxia'),
  immune: risk('Risk of In Mission Impacts, Adverse Health Events or Long-Term Health Impacts due to Altered Immune Response'),
  food: risk('Risk of Performance Decrement and Crew Illness Due to Inadequate Food and Nutrition'),
  sleep: risk('Risk of Performance Decrements and Adverse Health Outcomes Resulting from Sleep Loss, Circadian Desynchronization, and Work Overload'),
  bmed: risk('Risk of Adverse Cognitive or Behavioral Changes and Psychiatric Disorders'),
  renal: risk('Risk of Renal Stone Formation'),
  fitness: risk('Risk of Mission Performance Decrements and Adverse Health Outcomes Resulting from Reduced Cardiorespiratory and Musculoskeletal Fitness'),
  bone: risk('Risk of Bone Fracture due to Spaceflight-induced Changes to Bone'),
  sans: risk('Risk of Spaceflight Associated Neuro-ocular Syndrome (SANS)'),
  cancer: risk('Risk of Radiation Carcinogenesis'),
  medical: risk('Risk of Adverse Health Outcomes and Decrements in Performance Due to Medical Conditions that occur in Mission'),
};
const EVIDENCE = {
  sys: [RISK.cv, STD3001], dia: [RISK.cv, STD3001], hr: [RISK.cv, STD3001],
  spo2: [RISK.hypoxia, STD3001], temp: [RISK.immune, RISK.medical], glu: [RISK.food, STD3001],
  sleep: [RISK.sleep], mood: [RISK.bmed], stress: [RISK.bmed, RISK.sleep], water: [RISK.renal, RISK.food],
  exercise: [RISK.fitness, RISK.bone], mass: [RISK.food, RISK.fitness], vision: [RISK.sans],
  rad: [RISK.cancer, { label: 'NASA-STD-3001 Vol. 1 — career effective radiation dose limit of 600 mSv', url: STD3001.url }],
  co2: [{ label: 'NASA-STD-3001 Vol. 2 — spacecraft atmosphere and carbon dioxide limits', url: STD3001.url }, RISK.sans],
};
/* Short check-in questions. */
const ASK = {
  sys: 'Your blood pressure?', dia: 'Your blood pressure?', hr: 'Resting heart rate?', spo2: 'Blood oxygen (SpO₂)?', temp: 'Body temperature?',
  glu: 'Fasting blood glucose?', sleep: 'Hours slept last night?', mood: 'How is your mood?', stress: 'How stressed are you?',
  water: 'Fluids drunk today?', exercise: 'Exercise today?', mass: 'Body mass today?', vision: 'Any change in your vision?',
  rad: 'Dosimeter reading today?', co2: 'Cabin CO₂ on the display?',
};
