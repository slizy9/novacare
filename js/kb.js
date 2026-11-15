/* NOVACARE — onboard knowledge base (KB), versioned, searched locally (retrieval, not "training").

   Each entry is a short protocol: what it is, what to do, when to escalate, and its sources.
   Questions are answered by searching this base on the device (no internet). If nothing here
   matches, NovaCare says so and tells the crew to escalate — it never improvises.
   Medication decisions are NOT made here: they come from the rules engine (js/rules.js). */

const KB_VERSION = '1.0 (2026-11-14)';
const SRC = {
  cv: { id: 'HRP-CV', label: 'NASA HRP — Risk of Cardiovascular Adaptations', url: 'https://humanresearchroadmap.nasa.gov/risks/' },
  bmed: { id: 'HRP-BMed', label: 'NASA HRP — Risk of Adverse Cognitive or Behavioral Changes and Psychiatric Disorders', url: 'https://humanresearchroadmap.nasa.gov/risks/' },
  team: { id: 'HRP-Team', label: 'NASA HRP — Risk of Inadequate Cooperation, Coordination, Communication and Psychosocial Adaptation within a Team', url: 'https://humanresearchroadmap.nasa.gov/risks/' },
  sleep: { id: 'HRP-Sleep', label: 'NASA HRP — Risk from Sleep Loss, Circadian Desynchronization and Work Overload', url: 'https://humanresearchroadmap.nasa.gov/risks/' },
  sans: { id: 'HRP-SANS', label: 'NASA HRP — Risk of Spaceflight Associated Neuro-ocular Syndrome (SANS)', url: 'https://humanresearchroadmap.nasa.gov/risks/' },
  sensori: { id: 'HRP-SM', label: 'NASA HRP — Risk of Altered Sensorimotor/Vestibular Function', url: 'https://humanresearchroadmap.nasa.gov/risks/' },
  immune: { id: 'HRP-Immune', label: 'NASA HRP — Risk due to Altered Immune Response', url: 'https://humanresearchroadmap.nasa.gov/risks/' },
  micro: { id: 'HRP-Micro', label: 'NASA HRP — Risk due to Host-Microorganism Interactions', url: 'https://humanresearchroadmap.nasa.gov/risks/' },
  renal: { id: 'HRP-Renal', label: 'NASA HRP — Risk of Renal Stone Formation', url: 'https://humanresearchroadmap.nasa.gov/risks/' },
  bone: { id: 'HRP-Bone', label: 'NASA HRP — Risk of Bone Fracture due to Spaceflight-induced Changes to Bone', url: 'https://humanresearchroadmap.nasa.gov/risks/' },
  fit: { id: 'HRP-Fitness', label: 'NASA HRP — Risk from Reduced Cardiorespiratory and Musculoskeletal Fitness', url: 'https://humanresearchroadmap.nasa.gov/risks/' },
  food: { id: 'HRP-Food', label: 'NASA HRP — Risk of Performance Decrement and Crew Illness Due to Inadequate Food and Nutrition', url: 'https://humanresearchroadmap.nasa.gov/risks/' },
  hypoxia: { id: 'HRP-Hypoxia', label: 'NASA HRP — Risk of Reduced Crew Health and Performance Due to Hypoxia', url: 'https://humanresearchroadmap.nasa.gov/risks/' },
  rad: { id: 'HRP-Rad', label: 'NASA HRP — Risk of Radiation Carcinogenesis', url: 'https://humanresearchroadmap.nasa.gov/risks/' },
  dust: { id: 'HRP-Dust', label: 'NASA HRP — Risk due to Celestial Dust Exposure', url: 'https://humanresearchroadmap.nasa.gov/risks/' },
  dcs: { id: 'HRP-DCS', label: 'NASA HRP — Risk of Decompression Sickness', url: 'https://humanresearchroadmap.nasa.gov/risks/' },
  med: { id: 'HRP-Medical', label: 'NASA HRP — Risk due to Medical Conditions that occur in Mission', url: 'https://humanresearchroadmap.nasa.gov/risks/' },
  pharm: { id: 'HRP-Pharm', label: 'NASA HRP — Risk of Ineffective or Toxic Medications During Long-Duration Exploration Spaceflight', url: 'https://humanresearchroadmap.nasa.gov/risks/' },
  ei: { id: 'HRP-EIHSO', label: 'NASA HRP — Risk of Adverse Mission Outcomes Due to Earth Independent Human-Systems Operations', url: 'https://humanresearchroadmap.nasa.gov/risks/' },
  std1: { id: 'STD-3001-V1', label: 'NASA-STD-3001 Vol. 1 — Crew Health', url: 'https://www.nasa.gov/ochmo/hsa-standards/' },
  std2: { id: 'STD-3001-V2', label: 'NASA-STD-3001 Vol. 2 — Human Factors, Habitability and Environmental Health', url: 'https://www.nasa.gov/ochmo/hsa-standards/' },
};

/* q = words people use (English and Spanish, no accents needed). */
const KB = [
  /* ---------- medical ---------- */
  { id: 'MED-01', cat: 'medical', title: 'Headache', q: 'headache head hurts migraine dolor de cabeza cefalea me duele la cabeza jaqueca',
    a: 'In space, headaches are most often caused by high cabin CO₂, the fluid shift toward the head, short sleep or dehydration.',
    steps: ['Check cabin CO₂ on the display and move to a well-ventilated module.', 'Drink 250–500 mL of water.', 'Rest with the lights low for 20 minutes.', 'Log your blood pressure and sleep.'],
    esc: 'Sudden or worst-ever headache, or headache with vision change, confusion, weakness or vomiting: tell the Crew Medical Officer now.', src: ['sans', 'std2'] },
  { id: 'MED-02', cat: 'medical', title: 'Space motion sickness, nausea and vomiting', q: 'nausea vomit sick motion sickness space adaptation queasy nauseas vomito mareo malestar estomago',
    a: 'Common in the first 2–3 days of weightlessness or after returning to gravity. The inner ear and eyes disagree about which way is down.',
    steps: ['Keep your head still and look at a fixed visual "floor".', 'Sip fluids; eat small, bland portions.', 'Keep an emesis bag within reach — vomit floats.', 'Anti-nausea medicine only through the medication check (it applies your allergies and other medicines).'],
    esc: 'Vomiting for more than 24 h, blood, or nausea with chest pain or severe headache: Crew Medical Officer.', src: ['sensori'] },
  { id: 'MED-03', cat: 'medical', title: 'Dizziness or fainting on standing (after landing or in gravity)', q: 'dizzy dizziness faint lightheaded orthostatic standing up mareado desmayo vahido presion baja',
    a: 'Without gravity, plasma volume falls and the heart deconditions, so blood pressure can drop when you stand in gravity again.',
    steps: ['Sit or lie down with legs raised.', 'Drink 500 mL of water or an electrolyte drink.', 'Measure blood pressure lying and then standing.', 'Stand up slowly, in stages.'],
    esc: 'Fainting, chest pain or a fast irregular heartbeat: Crew Medical Officer now.', src: ['cv'] },
  { id: 'MED-04', cat: 'medical', title: 'Back pain', q: 'back pain backache spine lower back dolor de espalda lumbar columna',
    a: 'The spine lengthens 4–6 cm in microgravity and back pain is very common in the first weeks.',
    steps: ['Curl into the fetal position for a few minutes to unload the spine.', 'Gentle stretching and core exercise.', 'Heat or cold packs from the medical kit.', 'Pain relief through the medication check.'],
    esc: 'Back pain with numbness, leg weakness or trouble controlling bladder or bowel: urgent.', src: ['fit'] },
  { id: 'MED-05', cat: 'medical', title: 'Blocked nose and puffy face ("space cold")', q: 'stuffy nose congestion sinus puffy face nariz tapada congestion senos paranasales cara hinchada',
    a: 'Fluid shifts toward the head and causes congestion and a puffy face. It is not an infection.',
    steps: ['Saline nasal rinse or spray.', 'Sleep with the head slightly elevated in gravity.', 'Stay hydrated.'],
    esc: 'Fever, facial pain or thick discharge suggest infection: log temperature and tell the Crew Medical Officer.', src: ['sans'] },
  { id: 'MED-06', cat: 'medical', title: 'Fever or possible infection', q: 'fever chills infection flu cold cough sore throat fiebre escalofrios infeccion gripe tos garganta resfriado',
    a: 'Immune function changes in space and germs spread fast in a closed cabin.',
    steps: ['Log temperature, heart rate and SpO₂.', 'Wear a mask, wash hands often, do not share food or utensils.', 'Rest and drink fluids.', 'Wipe shared surfaces.'],
    esc: 'Temperature 38.5 °C or higher, SpO₂ under 94%, or breathing difficulty: Crew Medical Officer today.', src: ['immune', 'micro'] },
  { id: 'MED-07', cat: 'medical', title: 'Constipation or bloating', q: 'constipation bloating gas stomach ache estrenimiento estrenido gases hinchazon barriga',
    a: 'Low fluid intake, less activity and the space diet slow the gut.',
    steps: ['Drink at least 2 L a day.', 'Choose high-fibre menu items and fruit.', 'Daily exercise.'],
    esc: 'Severe abdominal pain, fever or no bowel movement for 4+ days: Crew Medical Officer.', src: ['food'] },
  { id: 'MED-08', cat: 'medical', title: 'Kidney stone warning signs', q: 'kidney stone flank pain side pain blood in urine renal calculo rinon dolor de costado sangre en orina',
    a: 'Bone loss releases calcium and low fluid intake concentrates urine, raising kidney stone risk.',
    steps: ['Drink enough to pass about 2 L of urine a day.', 'Limit salt.', 'Note pain that comes in waves from the side to the groin.'],
    esc: 'Severe side pain, blood in urine, fever or vomiting: Crew Medical Officer now.', src: ['renal'] },
  { id: 'MED-09', cat: 'medical', title: 'Vision change (SANS)', q: 'vision blurry eyes blur sans near vision eye vista borrosa ojos vision cercana',
    a: 'Fluid shift raises pressure behind the eye. Near vision may blur gradually over months.',
    steps: ['Log vision change in Vitals.', 'Use the adjustable or "space anticipation" glasses if issued.', 'Report at the next medical conference for an eye exam.'],
    esc: 'Sudden loss of vision, flashes, a curtain over the eye or eye pain: urgent.', src: ['sans'] },
  { id: 'MED-10', cat: 'medical', title: 'Something in the eye or eye irritation', q: 'eye irritation particle debris red eye dust ojo irritado particula basura ojo rojo polvo',
    a: 'Particles do not fall in microgravity, so dust and debris often reach the eyes.',
    steps: ['Do not rub.', 'Flush with saline eyewash or clean water for several minutes.', 'Wear eye protection near dusty work.'],
    esc: 'Pain that persists, vision change or a chemical in the eye: flush for 15 minutes and call the Crew Medical Officer.', src: ['dust'] },
  { id: 'MED-11', cat: 'medical', title: 'Skin irritation, rash or slow-healing cuts', q: 'skin rash itch dry skin cut wound healing piel sarpullido picazon piel seca corte herida cicatrizar',
    a: 'Skin gets thinner and drier in space and wounds can heal more slowly.',
    steps: ['Moisturise daily.', 'Clean cuts, cover them and keep them dry.', 'Check the area every day for redness or pus.'],
    esc: 'Spreading redness, pus, fever or hives with swelling of the face: Crew Medical Officer (hives with swelling may be an allergic reaction — emergency).', src: ['immune'] },
  { id: 'MED-12', cat: 'medical', title: 'Toothache or broken tooth', q: 'tooth toothache dental broken filling diente dolor de muela muela rota empaste',
    a: 'Dental problems are among the most common in-flight medical events.',
    steps: ['Rinse with warm water.', 'Use the dental kit temporary filling material if the filling fell out.', 'Pain relief through the medication check.'],
    esc: 'Facial swelling or fever: possible abscess — Crew Medical Officer today.', src: ['med'] },
  { id: 'MED-13', cat: 'medical', title: 'Muscle or bone loss', q: 'muscle loss bone loss weakness atrophy osteoporosis perdida muscular perdida osea debilidad huesos musculos',
    a: 'Unloaded bones lose about 1–1.5% of density per month and muscles weaken within weeks.',
    steps: ['Do the full exercise prescription daily: resistance plus aerobic.', 'Eat enough protein and take vitamin D as prescribed.', 'Log exercise and body mass.'],
    esc: 'Bone pain after minor impact may be a fracture — immobilise and call the Crew Medical Officer.', src: ['bone', 'fit'] },
  { id: 'MED-14', cat: 'medical', title: 'Chest pain or palpitations', q: 'chest pain palpitations heart racing irregular heartbeat dolor de pecho palpitaciones corazon acelerado arritmia',
    a: 'Chest pain is always treated as serious until proven otherwise.',
    steps: ['Stop all activity and rest, restrained.', 'Measure blood pressure, heart rate and SpO₂.', 'Open the emergency protocol "Chest pain".'],
    esc: 'Call the Crew Medical Officer now and open emergency help.', src: ['cv'], emg: 'chest' },
  { id: 'MED-15', cat: 'medical', title: 'Shortness of breath', q: 'short of breath breathless breathing difficult wheezing falta de aire me ahogo respirar cuesta respirar silbido',
    a: 'Check the cabin air first, then the person.',
    steps: ['Check CO₂ and alarms.', 'Measure SpO₂.', 'Give oxygen if SpO₂ is under 94% (emergency protocol).'],
    esc: 'Breathless at rest or SpO₂ under 90%: emergency.', src: ['hypoxia', 'std2'], emg: 'breathing' },
  { id: 'MED-16', cat: 'medical', title: 'Radiation exposure and solar particle events', q: 'radiation dose solar storm particle event spe shelter radiacion dosis tormenta solar refugio',
    a: 'During a solar particle event the dose rate can jump; shielding is the main protection.',
    steps: ['Go to the designated shielded area (storm shelter) as soon as the alert sounds.', 'Wear your personal dosimeter and log the reading.', 'Postpone EVAs until the event ends.'],
    esc: 'Nausea, vomiting or skin redness after a large event: Crew Medical Officer and ground.', src: ['rad', 'std1'] },
  { id: 'MED-17', cat: 'medical', title: 'Decompression sickness after EVA', q: 'decompression sickness bends joint pain after eva spacewalk enfermedad descompresion dolor articulaciones caminata espacial',
    a: 'Nitrogen bubbles can form if pressure drops too fast — joint pain, tingling or confusion after an EVA.',
    steps: ['Report any joint pain, skin itching or tingling after EVA immediately.', 'Breathe 100% oxygen.', 'The suit or airlock can be repressurised as a treatment per the EVA checklist.'],
    esc: 'Any neurological symptom (numbness, weakness, confusion) after EVA: emergency.', src: ['dcs'] },
  { id: 'MED-18', cat: 'medical', title: 'Medicines in space', q: 'medicine expired potency medication works pills shelf life medicamento caducado vencido funciona pastillas',
    a: 'Some medicines lose potency faster in space (radiation, temperature). The rules engine checks allergies, interactions and dose; stock comes from the ship inventory.',
    steps: ['Use the Questions medication check before any medicine ("Can I take …?").', 'Check the expiry date on the label.', 'Log what you took in the ship inventory (Use one).'],
    esc: 'Unsure about a dose or the medicine had no effect: ask the Crew Medical Officer.', src: ['pharm'] },
  { id: 'MED-19', cat: 'medical', title: 'Cuts and minor bleeding', q: 'cut bleeding minor wound scrape corte sangrado herida rasguno raspon',
    a: 'Most small cuts stop with pressure. In microgravity, blood forms floating droplets.',
    steps: ['Gloves on; press with a dressing for 10 minutes.', 'Clean with saline, close with strips, cover.', 'Check daily for infection.'],
    esc: 'Bleeding that will not stop with pressure: emergency protocol "Severe bleeding".', src: ['med'], emg: 'bleeding' },
  { id: 'MED-20', cat: 'medical', title: 'Burns', q: 'burn scald hot surface quemadura quemado superficie caliente',
    a: 'Cool first, cover second.',
    steps: ['Cool with water or cold packs for 20 minutes.', 'Remove rings or tight items.', 'Cover loosely with a burn dressing or cling film.'],
    esc: 'Burns to face, hands or airway, or larger than the palm: emergency protocol "Burn".', src: ['med'], emg: 'burn' },

  { id: 'MED-21', cat: 'medical', title: 'Joint, muscle or limb pain', q: 'knee shoulder ankle wrist elbow joint muscle sore strain sprain arm leg hurts rodilla hombro tobillo muneca codo articulacion musculo dolor brazo pierna duele',
    a: 'Joint and muscle pain is common with exercise devices and moving through tight modules; in microgravity it is easy to strain a muscle when stopping a movement.',
    steps: ['Rest the area and avoid loading it for 24 h.', 'Cold pack (wrapped) for 20 minutes, a few times a day.', 'Gentle movement once the pain allows.', 'Pain relief through the medication check.'],
    esc: 'Deformity, a crack sound, inability to move it, or swelling that grows: possible fracture — emergency protocol "Possible fracture".', src: ['fit', 'bone'], emg: 'fracture' },

  /* ---------- emotional wellbeing ---------- */
  { id: 'WB-01', cat: 'wellbeing', title: 'Feeling sad, down or low', q: 'sad down low depressed unhappy crying triste deprimido bajo de animo llorar desanimado',
    a: 'Low mood is common on long missions — isolation, distance from home and workload add up. It is treatable and it is not a personal failing.',
    steps: ['Tell someone you trust on the crew how you feel.', 'Request a private psychological conference — it is confidential.', 'Keep sleep, meals and exercise regular this week.', 'Plan something to look forward to (a call home, a film night).'],
    esc: 'Thoughts of harming yourself, or several days unable to work: tell the Crew Medical Officer today and request an urgent conference.', src: ['bmed'] },
  { id: 'WB-02', cat: 'wellbeing', title: 'Anxiety or panic', q: 'anxiety anxious panic attack nervous worried fear ansiedad ansioso ataque de panico nervioso preocupado miedo',
    a: 'Anxiety is a normal response to a high-stakes environment. The body\'s alarm can be calmed.',
    steps: ['Breathe in for 4 seconds, hold 2, out for 6 — for 3 minutes.', 'Name 5 things you see, 4 you hear, 3 you can touch.', 'Move to a quiet module and anchor yourself to a handhold.', 'Tell a crewmate what is happening.'],
    esc: 'Panic that does not settle in 20 minutes, or chest pain: check vitals and call the Crew Medical Officer.', src: ['bmed'] },
  { id: 'WB-03', cat: 'wellbeing', title: 'Stress and overload', q: 'stress stressed overwhelmed too much work overload burnout estres estresado agobiado mucho trabajo sobrecarga',
    a: 'Workload, time pressure and little control are the main stressors on long missions.',
    steps: ['Write the 3 tasks that matter most today; tell ground what to move.', 'Take a 10-minute break every 2 hours.', 'Exercise — it is one of the best stress relievers.', 'Protect your sleep window.'],
    esc: 'Stress affecting safety-critical work: tell the commander so tasks can be re-planned.', src: ['bmed', 'sleep'] },
  { id: 'WB-04', cat: 'wellbeing', title: 'Insomnia and poor sleep', q: 'cant sleep insomnia sleep badly awake at night tired no puedo dormir insomnio duermo mal desvelado cansado',
    a: 'Light, noise, CO₂, workload and a 90-minute day–night cycle disturb sleep in space.',
    steps: ['Dim lights and avoid screens 1 hour before sleep.', 'Use earplugs and an eye mask; check sleep-station airflow and CO₂.', 'Keep the same sleep window every day.', 'Avoid caffeine after midday.'],
    esc: 'Fewer than 6 hours for 3+ nights: ask ground to protect a full sleep window; sleep medicine only through the Crew Medical Officer.', src: ['sleep'] },
  { id: 'WB-05', cat: 'wellbeing', title: 'Homesickness and missing family', q: 'homesick miss family miss home lonely nostalgia extrano a mi familia extrano casa solo soledad',
    a: 'Missing home is one of the most frequent feelings on long missions.',
    steps: ['Schedule a family call or record a message.', 'Keep photos or a small object from home at your station.', 'Share it with the crew — others feel it too.'],
    esc: 'If it stops you sleeping or working: request a psychological conference.', src: ['bmed'] },
  { id: 'WB-06', cat: 'wellbeing', title: 'Conflict with a crewmate', q: 'conflict argument fight crewmate angry tension discusion pelea companero enojado tension',
    a: 'Small frictions grow in confinement. Early, calm talk prevents them.',
    steps: ['Wait until you are both calm; talk in private.', 'Describe the situation and how it affects you — not the person.', 'Agree on one concrete change.', 'Use the commander or a ground mediator if it does not settle.'],
    esc: 'Conflict affecting safety or teamwork: tell the commander.', src: ['team'] },
  { id: 'WB-07', cat: 'wellbeing', title: 'Bad news from home or grief', q: 'bad news grief death loss family emergency mala noticia duelo muerte perdida emergencia familiar',
    a: 'Receiving hard news far from home is one of the toughest parts of a mission.',
    steps: ['You can pause non-critical work — tell the commander.', 'Request a private call with family and with the psychological support team.', 'Let the crew support you; you do not have to be alone.'],
    esc: 'If you cannot sleep or function: Crew Medical Officer and an urgent psychological conference.', src: ['bmed'] },
  { id: 'WB-08', cat: 'wellbeing', title: 'Boredom and monotony', q: 'bored boredom monotony same routine aburrido aburrimiento monotonia rutina',
    a: 'Monotony lowers motivation and alertness over long missions.',
    steps: ['Vary your routine where you can (new music, a project, a hobby).', 'Plan crew activities: shared meals, films, games.', 'Set personal goals (learn something, photograph Earth).'],
    esc: 'Persistent loss of interest in everything may be low mood: see "Feeling sad".', src: ['bmed'] },
  { id: 'WB-09', cat: 'wellbeing', title: 'Fatigue and low energy', q: 'fatigue tired no energy exhausted cansancio fatiga sin energia agotado',
    a: 'Fatigue usually follows short sleep, stress or overwork — and it is easy not to notice.',
    steps: ['Check your sleep log for the last 5 nights.', 'Pair up on safety-critical tasks.', 'Short breaks, hydration and a balanced meal.'],
    esc: 'Fatigue with fever, shortness of breath or chest pain: Crew Medical Officer.', src: ['sleep'] },
  { id: 'WB-10', cat: 'wellbeing', title: 'Fear before an EVA or a critical task', q: 'scared eva spacewalk nervous critical task fear miedo caminata espacial nervioso tarea critica',
    a: 'Being nervous before high-risk work is normal and can sharpen focus.',
    steps: ['Rehearse the procedure with your partner.', 'Use slow breathing before starting.', 'Agree on clear stop words and check-ins.'],
    esc: 'If fear stops you from performing safely, tell the commander — postponing is an option.', src: ['bmed'] },

  /* ---------- ship problems ---------- */
  { id: 'SHIP-01', cat: 'ship', title: 'High cabin CO₂', q: 'co2 carbon dioxide high co2 scrubber cdra air stuffy dioxido de carbono co2 alto aire pesado depurador',
    a: 'High CO₂ causes headache, poor concentration and poor sleep long before it becomes dangerous.',
    steps: ['Check the CO₂ reading and which removal system is running.', 'Increase airflow: open hatches, turn on fans, avoid dead-air pockets.', 'Swap or regenerate the CO₂ scrubber cartridge (check stock in the ship inventory).', 'Limit exercise in the affected module until it drops.'],
    esc: 'Above the mission limit or rising after the swap: notify ground; if crew have symptoms, move to the cleanest module with masks ready.', src: ['std2'] },
  { id: 'SHIP-02', cat: 'ship', title: 'Fire or smoke', q: 'fire smoke burning smell flames incendio fuego humo olor a quemado llamas',
    a: 'Fire is one of the three main spacecraft emergencies. Act fast and as a crew.',
    steps: ['Sound the alarm and tell the crew.', 'Put on masks or breathing apparatus.', 'Remove power to the affected equipment.', 'Use the fire extinguisher at the port or equipment; close hatches to isolate the module.', 'Account for every crew member.'],
    esc: 'Notify ground immediately; follow the vehicle fire procedure. Treat anyone exposed with the "Smoke or toxic gas" protocol.', src: ['std2'], emg: 'toxic' },
  { id: 'SHIP-03', cat: 'ship', title: 'Rapid depressurisation or air leak', q: 'leak depressurization pressure drop air leak hull breach fuga despresurizacion perdida de presion fuga de aire',
    a: 'A pressure drop is one of the three main spacecraft emergencies.',
    steps: ['Sound the alarm; gather the crew.', 'Check the rate of pressure drop and time to minimum safe pressure.', 'Move to the safe-haven or return vehicle if the rate is high.', 'If time allows, find the leak by closing hatches module by module.', 'Put on masks if pressure keeps falling.'],
    esc: 'Notify ground immediately. Treat symptoms (ear pain, dizziness, breathlessness) after the event.', src: ['std2', 'hypoxia'] },
  { id: 'SHIP-04', cat: 'ship', title: 'Toxic leak (ammonia or chemical)', q: 'ammonia toxic leak chemical spill fumes smell amoniaco fuga toxica derrame quimico vapores olor',
    a: 'A toxic atmosphere is one of the three main spacecraft emergencies.',
    steps: ['Masks or breathing apparatus on first.', 'Leave the contaminated area and close the hatch behind you.', 'Flush eyes and skin with water if exposed.', 'Follow the vehicle toxic-release procedure.'],
    esc: 'Notify ground; anyone exposed follows the "Smoke or toxic gas" protocol.', src: ['std2'], emg: 'toxic' },
  { id: 'SHIP-05', cat: 'ship', title: 'Power loss', q: 'power loss outage blackout electrical failure no power apagon falla electrica sin energia corte de luz',
    a: 'Life support has priority on any remaining power.',
    steps: ['Check the power system status and which loads are off.', 'Shed non-essential loads.', 'Confirm CO₂ removal, ventilation and oxygen are running.', 'Use portable lights.'],
    esc: 'If life support is affected: masks and portable oxygen ready, notify ground.', src: ['ei'] },
  { id: 'SHIP-06', cat: 'ship', title: 'Water recycling or water supply failure', q: 'water recycler failure no water water shortage reciclador de agua sin agua falla agua escasez',
    a: 'Drinking water comes first; hygiene water can be reduced.',
    steps: ['Check stored water volume in the ship inventory.', 'Switch to stored water; ration hygiene use.', 'Troubleshoot the recycler per its procedure (filters, pumps, conductivity).', 'Keep drinking at least 2 L a day.'],
    esc: 'If stored water will not last until repair or resupply: notify ground to re-plan.', src: ['std2', 'renal'] },
  { id: 'SHIP-07', cat: 'ship', title: 'Cabin too hot, too cold or too humid', q: 'temperature too hot too cold humidity condensation calor frio humedad condensacion',
    a: 'Temperature and humidity affect sleep, comfort and electronics.',
    steps: ['Check the thermal control and humidity readings.', 'Adjust the module set point; check fans and heat exchangers.', 'Wipe condensation — water floating near electronics is a hazard.'],
    esc: 'If the trend continues or electronics overheat: notify ground.', src: ['std2'] },
  { id: 'SHIP-08', cat: 'ship', title: 'Communications loss with Earth', q: 'comms loss no signal communication earth radio lost contact perdida de comunicacion sin senal tierra radio',
    a: 'NovaCare is designed for this: everything keeps working on board and syncs when the link returns.',
    steps: ['Keep logging readings — they upload when the link is back.', 'Follow the loss-of-communication procedure and keep a written log of decisions.', 'Medical questions: use the onboard protocols and the Crew Medical Officer.'],
    esc: 'If the loss lasts longer than planned, follow the autonomous-operations plan for your mission.', src: ['ei'] },
  { id: 'SHIP-09', cat: 'ship', title: 'Noise in the cabin', q: 'noise loud fan noise hearing ruido fuerte ventilador oido',
    a: 'Constant fan and pump noise disturbs sleep and, over time, hearing.',
    steps: ['Wear hearing protection near loud equipment.', 'Report new or louder noises — they can signal a failing fan or pump.', 'Use earplugs in the sleep station.'],
    esc: 'Ringing ears or hearing loss: tell the Crew Medical Officer.', src: ['std2'] },
  { id: 'SHIP-10', cat: 'ship', title: 'Exercise equipment broken', q: 'treadmill broken exercise device bike resistive device broken equipo de ejercicio roto caminadora bicicleta',
    a: 'A missed exercise prescription quickly costs bone and muscle.',
    steps: ['Report the failure and try the repair procedure.', 'Switch to another device or to bodyweight and resistance-band exercises.', 'Log what you did so the plan can be adjusted.'],
    esc: 'If no device is available for several days: ask ground for an alternative plan.', src: ['fit', 'bone'] },
  { id: 'SHIP-11', cat: 'ship', title: 'Food supply running low or spoiled food', q: 'food low food shortage spoiled food comida escasa poca comida comida en mal estado',
    a: 'The food supply is fixed; calories and nutrients matter for health and mood.',
    steps: ['Check meal packs in the ship inventory and the days left.', 'Discard packs that are swollen, leaking or smell wrong.', 'Ask ground to re-plan menus to keep calories and protein.'],
    esc: 'Weight loss or not enough food until resupply: notify ground.', src: ['food'] },
  { id: 'SHIP-12', cat: 'ship', title: 'Mould, odour or microbial growth', q: 'mold mould odor smell bacteria microbial growth hongo moho mal olor bacterias',
    a: 'Humidity and closed air let microbes grow behind panels and in fabrics.',
    steps: ['Wear gloves and a mask.', 'Clean the area with disinfectant wipes and dry it.', 'Find and fix the moisture source.', 'Take a sample if the mission has a microbial kit.'],
    esc: 'Recurring growth or crew with respiratory symptoms: notify ground.', src: ['micro', 'std2'] },
  { id: 'SHIP-13', cat: 'ship', title: 'Medical kit running low', q: 'medical kit low supplies running out medicine out of stock botiquin bajo pocos medicamentos agotado',
    a: 'NovaCare tracks medical supplies in the ship inventory and warns at the minimum.',
    steps: ['Open Crew → Ship inventory → filter "Low or out".', 'Use the standard medical kit list to see what is missing.', 'Ask ground to add items to the next resupply.'],
    esc: 'If an essential item (epinephrine, oxygen, AED) is out: tell the commander and ground now.', src: ['med'] },
  { id: 'SHIP-14', cat: 'ship', title: 'Lighting and day–night cycle', q: 'lighting light circadian day night cycle sunrise iluminacion luz ciclo dia noche',
    a: 'Station crews see a sunrise every 90 minutes; lighting is used to keep the body clock steady.',
    steps: ['Bright, blue-rich light in the morning; warm dim light in the evening.', 'Keep the same wake and sleep times.', 'Cover windows in the sleep station.'],
    esc: 'Persistent sleep problems: see "Insomnia".', src: ['sleep', 'std2'] },
];
const KBI = Object.fromEntries(KB.map((e) => [e.id, e]));

/* ---------- local search (BM25 over title + aliases + text) ---------- */
const KBSearch = (() => {
  const STOP = new Set('a an the is are am i my me you we to of in on at for and or with what how do does can should it this that de la el los las un una y o que como para por con mi me es en se lo le hay tengo esta estoy'.split(' '));
  const tok = (s) => fold(s).replace(/[^a-z0-9₂ ]+/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)).map((w) => w.replace(/(ing|es|s)$/, '').slice(0, 9));
  const docs = KB.map((e) => { const words = [...tok(e.title), ...tok(e.title), ...tok(e.q), ...tok(e.q), ...tok(e.a)]; const tf = {}; words.forEach((w) => { tf[w] = (tf[w] || 0) + 1; }); return { e, tf, len: words.length }; });
  const avg = docs.reduce((n, d) => n + d.len, 0) / docs.length;
  const df = {}; docs.forEach((d) => Object.keys(d.tf).forEach((w) => { df[w] = (df[w] || 0) + 1; }));
  /** Best matching entries with a score; empty when nothing is relevant. */
  function search(q, n = 3) {
    const terms = [...new Set(tok(q))]; if (!terms.length) return [];
    return docs.map((d) => {
      let s = 0;
      terms.forEach((w) => { const f = d.tf[w]; if (!f) return; const idf = Math.log(1 + (docs.length - df[w] + 0.5) / (df[w] + 0.5)); s += idf * (f * 2.2) / (f + 1.2 * (0.25 + 0.75 * d.len / avg)); });
      return { e: d.e, s };
    }).filter((x) => x.s >= 2.2).sort((a, b) => b.s - a.s).slice(0, n);
  }
  return { search };
})();

/* ---------- protocol approval: nothing is "validated" until a medical officer approves it ----------
   Every onboard protocol (KB-…), emergency protocol (EMG-…), the medication rules (RULES) and the finding
   rules (ANALYSIS) start as drafts. The Crew Medical Officer approves them from the mission log terminal
   (/approve KB-MED-09 ISS Medical Checklist), naming the document they checked it against. The approval
   is shared with the crew through the same channel as alerts, and every answer, recommendation and
   emergency protocol says whether what it uses is approved or still a draft. */
const PROTOCOL_GROUPS = { RULES: 'Medication rules engine', ANALYSIS: 'Finding and follow-up rules' };

const Protocols = (() => {
  const key = () => 'novacare.approvals:' + ((Auth.user() && Auth.user().crew) || '-');
  const stored = () => { try { return JSON.parse(localStorage.getItem(key())) || {}; } catch (e) { return {}; } };
  const keep = (o) => { try { localStorage.setItem(key(), JSON.stringify(o)); } catch (e) { /* ignore */ } };
  function ids() {
    return [...KB.map((e) => 'KB-' + e.id), ...(typeof EMERGENCIES !== 'undefined' ? EMERGENCIES.map((e) => 'EMG-' + e.id) : []), ...Object.keys(PROTOCOL_GROUPS)];
  }
  const norm = (id) => { const u = String(id || '').trim().toUpperCase(); return ids().find((x) => x.toUpperCase() === u) || null; };
  const nameOf = (id) => { if (PROTOCOL_GROUPS[id]) return PROTOCOL_GROUPS[id]; const k = KB.find((e) => 'KB-' + e.id === id); if (k) return k.title; const e = typeof EMG !== 'undefined' && EMG[id.replace(/^EMG-/, '')]; return e ? e.name : id; };
  /** Current approvals: the crew's shared records, newest last, on top of what this device remembers. */
  function all() {
    const out = { ...stored() };
    const recs = typeof Crew !== 'undefined' ? Crew.alerts().filter((a) => a.type === 'approve' || a.type === 'revoke').sort((a, b) => a.createdAt.localeCompare(b.createdAt)) : [];
    recs.forEach((a) => { const [id, source] = String(a.note || '').split('|'); if (!id) return; if (a.type === 'revoke') delete out[id]; else out[id] = { by: a.fromName, at: a.createdAt, md: a.md, source: source || '' }; });
    keep(out); return out;
  }
  const status = (id) => all()[id] || null;
  /** Who may sign: the Crew Medical Officer. A guest may, for training, and it says so. */
  function signer() {
    const u = Auth.user(); if (!u) return null; const name = (state && state.name) || u.name;
    if (u.role === 'Crew Medical Officer') return `${name}, Crew Medical Officer`;
    if (u.guest) return `${name} (training — not valid for real care)`;
    return null;
  }
  function approve(raw, source) {
    const id = norm(raw); if (!id) return `Unknown protocol “${raw}”. Type /protocols to see the ids.`;
    const by = signer(); if (!by) return 'Only the Crew Medical Officer can approve protocols.';
    if (!source) return `Name the document you checked it against, e.g. /approve ${id} ISS Medical Checklist`;
    const me = Crew.members()[0]; Crew.record(me, 'approve', `${id}|${source}`, by);
    return `${id} (${nameOf(id)}) approved by ${by}, checked against ${source}.`;
  }
  function revoke(raw) {
    const id = norm(raw); if (!id) return `Unknown protocol “${raw}”.`;
    const by = signer(); if (!by) return 'Only the Crew Medical Officer can withdraw an approval.';
    Crew.record(Crew.members()[0], 'revoke', id, by); return `${id} is a draft again.`;
  }
  /** Plain words for an answer or a recommendation. */
  function text(id) {
    const s = id && status(id);
    if (!id) return 'no onboard protocol';
    return s ? `approved by ${s.by} on ${new Date(s.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${s.source ? `, checked against ${s.source}` : ''}`
      : 'draft — not yet approved by a medical officer; confirm with the Crew Medical Officer';
  }
  const approved = (id) => !!status(id);
  function summary() {
    const a = all(); const list = ids(); const ok = list.filter((id) => a[id]);
    return { total: list.length, approved: ok.length, drafts: list.filter((id) => !a[id]) };
  }
  return { ids, norm, nameOf, all, status, approve, revoke, text, approved, summary, signer };
})();
