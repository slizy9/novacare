/* NOVACARE — onboard knowledge base (KB), versioned, searched locally (retrieval, not "training").

   Each entry is a short protocol: what it is, what to do, when to escalate, and its sources.
   Questions are answered by searching this base on the device (no internet). If nothing here
   matches, NovaCare says so and tells the crew to escalate — it never improvises.
   Medication decisions are NOT made here: they come from the rules engine (js/rules.js). */

const KB_VERSION = '1.1 (2026-11-15)';
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
  { id: 'MED-01', cat: 'medical', title: 'Headache', q: 'headache head hurts head pain dolor de cabeza cefalea me duele la cabeza',
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

  { id: 'MED-21', cat: 'medical', title: 'Joint, muscle or limb pain', q: 'knee shoulder ankle wrist elbow hip joint muscle sore strain sprain arm leg hurts rodilla hombro tobillo muneca codo cadera articulacion musculo dolor brazo pierna duele esguince',
    a: 'Joint and muscle pain is common with exercise devices and moving through tight modules; in microgravity it is easy to strain a muscle when stopping a movement.',
    steps: ['Rest the area and avoid loading it for 24 h.', 'Cold pack (wrapped) for 20 minutes, a few times a day.', 'Gentle movement once the pain allows.', 'Pain relief through the medication check.'],
    esc: 'Deformity, a crack sound, inability to move it, or swelling that grows: possible fracture — emergency protocol "Possible fracture".', src: ['fit', 'bone'], emg: 'fracture' },

  /* ---------- emotional wellbeing ---------- */
  { id: 'WB-01', cat: 'wellbeing', title: 'Feeling sad, down or low', q: 'sad down low depressed depression unhappy crying hopeless worthless empty triste tristeza deprimido depresion bajo de animo llorar lloro desanimado vacio sin esperanza inutil',
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

  /* ---------- more medical ---------- */
  { id: 'MED-22', cat: 'medical', title: 'Sore throat, cough and congestion', q: 'sore throat cough cold congestion runny nose dolor de garganta tos resfriado gripe mocos congestion catarro',
    a: 'Most are viral and settle in a week. In the cabin they spread easily, and a weaker immune system in flight can make them last longer.',
    steps: ['Log your temperature and SpO₂ today.', 'Drink warm fluids and rest your voice.', 'Wash hands often, use your own cup and cover coughs.', 'Medicine only through the medication check (it applies your allergies).'],
    esc: 'Fever over 38 °C, breathlessness, SpO₂ under 94%, or no improvement after 5 days: tell the Crew Medical Officer.', src: ['immune', 'micro'] },
  { id: 'MED-23', cat: 'medical', title: 'Diarrhoea or stomach pain', q: 'diarrhea diarrhoea stomach ache belly pain cramps loose stool diarrea dolor de estomago panza barriga colicos abdominal',
    a: 'Usually from food, stress or a mild infection. In space the main danger is losing fluids, because thirst is weaker.',
    steps: ['Drink small sips often; add an electrolyte packet to each pouch.', 'Eat small, bland portions.', 'Log hydration and temperature.', 'Use your own hygiene wipes and clean the toilet area after use.'],
    esc: 'Blood in the stool, fever, severe or constant pain, pain in the lower right belly, or more than 6 episodes a day: tell the Crew Medical Officer now.', src: ['food', 'micro'] },
  { id: 'MED-24', cat: 'medical', title: 'Heartburn or indigestion', q: 'heartburn reflux indigestion acid burning chest after eating acidez agruras reflujo indigestion ardor estomago',
    a: 'Without gravity, stomach acid moves up more easily, especially after large meals.',
    steps: ['Eat smaller meals and avoid eating in the 2 hours before sleep.', 'Cut down on coffee and spicy food for a few days.', 'Antacid only through the medication check.'],
    esc: 'Chest pain that spreads to the arm, jaw or back, or comes with breathlessness or sweating, is not heartburn until proven otherwise: press Help.', src: ['food', 'cv'] },
  { id: 'MED-25', cat: 'medical', title: 'Burning when urinating or urinary infection', q: 'burning urination pee pain urinary infection uti bladder ardor al orinar orinar duele infeccion urinaria vejiga orina',
    a: 'Low fluid intake and changes in the urine in flight make urinary infections and kidney stones more likely.',
    steps: ['Drink at least 2.5 L today.', 'Do a urine dipstick test and log it (Vitals → Urine test).', 'Log your temperature.'],
    esc: 'Fever, pain in the side or back, or blood in the urine: tell the Crew Medical Officer today — it may need antibiotics.', src: ['renal', 'micro'] },
  { id: 'MED-26', cat: 'medical', title: 'Nosebleed', q: 'nosebleed nose bleeding bloody nose epistaxis sangra la nariz sangrado nasal sangre de la nariz',
    a: 'Common in flight: the cabin air is dry and the fluid shift fills the vessels in the head. Blood does not drip in microgravity — it collects.',
    steps: ['Sit, lean slightly forward and pinch the soft part of the nose for 10 minutes without letting go.', 'Catch the blood with gauze so droplets do not float.', 'Breathe through the mouth; do not lie back.', 'Afterwards, avoid blowing your nose for a day.'],
    esc: 'Bleeding that does not stop after 20 minutes of pressure, or if you take a blood thinner: tell the Crew Medical Officer now.', src: ['med'] },
  { id: 'MED-27', cat: 'medical', title: 'Ear pain or ear pressure', q: 'ear pain earache ear pressure blocked ears ringing dolor de oido oreja oidos tapados presion en los oidos zumbido',
    a: 'Usually from pressure changes, congestion or noise. Ringing after loud noise is a warning to protect your hearing.',
    steps: ['Swallow or yawn to equalise; do not force air through a blocked nose.', 'Use earplugs in loud modules and during sleep.', 'Log any ringing or hearing change.'],
    esc: 'Sudden hearing loss, discharge from the ear, severe pain or dizziness: tell the Crew Medical Officer today.', src: ['std2', 'med'] },
  { id: 'MED-28', cat: 'medical', title: 'Muscle cramps', q: 'cramp cramps muscle spasm charley horse calambre calambres espasmo muscular tiron',
    a: 'Often from fluid and salt loss, hard exercise or long periods without moving.',
    steps: ['Stretch the muscle gently and hold for 30 seconds.', 'Drink a pouch with an electrolyte packet.', 'Warm up before resistance exercise.'],
    esc: 'Cramps with weakness, dark urine or a swollen, painful calf: tell the Crew Medical Officer — rule out a clot or muscle damage.', src: ['fit'] },
  { id: 'MED-29', cat: 'medical', title: 'Numbness or tingling', q: 'numbness tingling pins and needles hands feet hormigueo entumecido adormecido manos pies cosquilleo',
    a: 'Brief tingling from pressure on a nerve (a tight restraint, sleeping on an arm) is common and goes away when you move.',
    steps: ['Change position and loosen straps or gloves.', 'Note where it is and how long it lasts.'],
    esc: 'Sudden numbness or weakness of the face, arm or leg on one side, trouble speaking or seeing, or tingling after an EVA: emergency — press Help (stroke or decompression sickness).', src: ['dcs', 'med'] },
  { id: 'MED-30', cat: 'medical', title: 'High blood pressure reading', q: 'high blood pressure hypertension bp high reading presion alta hipertension tension alta presion arterial alta',
    a: 'A single high reading is often caused by stress, caffeine, a full bladder or the cuff. What matters is whether it stays high.',
    steps: ['Sit still for 5 minutes, arm at heart level, and measure again.', 'Go easy on salt and caffeine today.', 'Measure at the same time tomorrow.'],
    esc: 'Systolic 180 or more, or high pressure with headache, chest pain, vision change or confusion: tell the Crew Medical Officer now.', src: ['cv', 'std1'] },
  { id: 'MED-31', cat: 'medical', title: 'Low blood sugar (shaky, sweaty, hungry)', q: 'low blood sugar hypoglycemia shaky sweaty hungry weak azucar baja glucosa baja hipoglucemia tembloroso sudoroso',
    a: 'Skipping meals during long tasks can drop blood sugar: shakiness, sweating, hunger, poor concentration.',
    steps: ['Take 15–20 g of fast sugar now (glucose gel or a sweet drink).', 'Check again after 15 minutes; repeat if still shaky.', 'Then eat a proper meal.'],
    esc: 'Confusion, drowsiness or not improving after two doses: tell the Crew Medical Officer now.', src: ['food'] },
  { id: 'MED-32', cat: 'medical', title: 'Dehydration', q: 'dehydrated dehydration thirsty dry mouth dark urine deshidratado deshidratacion sed boca seca orina oscura',
    a: 'In weightlessness thirst is weaker, so many crew drink less than they need.',
    steps: ['Drink a pouch now and one every hour until your urine is pale.', 'Add an electrolyte packet if you sweated or had diarrhoea.', 'Log your fluid intake today.'],
    esc: 'Dizziness when moving, confusion, or very little urine for a day: tell the Crew Medical Officer.', src: ['renal', 'food'] },
  { id: 'MED-33', cat: 'medical', title: 'Mild allergic reaction', q: 'allergy allergic reaction mild hives itchy eyes sneezing alergia leve reaccion alergica ronchas estornudos ojos llorosos',
    a: 'Itchy skin, hives or sneezing without breathing problems is usually mild.',
    steps: ['Move away from what triggered it, if you know.', 'Antihistamine only through the medication check (it applies your allergies).', 'Record the trigger in your medical profile.'],
    esc: 'Swelling of the lips, tongue or throat, wheezing or dizziness: emergency — press Help (severe allergic reaction).', src: ['immune'], emg: 'allergy' },
  { id: 'MED-34', cat: 'medical', title: 'Menstrual pain', q: 'menstrual pain period cramps menstruation colicos menstruales regla dolor de regla menstruacion periodo',
    a: 'Many crew suppress menstruation for flight; when it happens, cramps are managed as on Earth.',
    steps: ['Apply warmth (a warm pack) to the lower belly.', 'Gentle movement and stretching help.', 'Pain relief only through the medication check.', 'Make sure hygiene supplies are stocked.'],
    esc: 'Pain much worse than usual, very heavy bleeding, or pain with fever: tell the Crew Medical Officer.', src: ['med'] },
  { id: 'MED-35', cat: 'medical', title: 'Hiccups', q: 'hiccups hiccup hipo',
    a: 'Harmless and usually short. Eating fast or swallowing air makes them more likely.',
    steps: ['Hold your breath for 10 seconds, then breathe slowly.', 'Sip cold water slowly.'],
    esc: 'Hiccups lasting more than 48 hours: tell the Crew Medical Officer.', src: ['med'] },
  { id: 'MED-36', cat: 'medical', title: 'Loss of appetite', q: 'no appetite loss of appetite not hungry eating less food tastes bland no tengo hambre sin apetito falta de apetito no quiero comer',
    a: 'Food often tastes bland in space (blocked nose from the fluid shift), and stress lowers appetite. Eating too little costs muscle and bone.',
    steps: ['Eat small portions more often.', 'Use spicier menu items and condiments.', 'Log your body mass weekly.'],
    esc: 'Losing more than 3% of body mass, or not eating for 2 days: tell the Crew Medical Officer.', src: ['food'] },
  { id: 'WB-11', cat: 'wellbeing', title: 'Anger and irritability', q: 'angry anger irritable irritability short temper rage enojado enojo irritable rabia mal humor molesto',
    a: 'Irritability is one of the first signs of poor sleep, stress and confinement — not a character flaw.',
    steps: ['Step away for 10 minutes before you answer.', 'Check your sleep and workload in the last few days.', 'Talk about the issue later, in private, with "I" statements.'],
    esc: 'If you feel close to hurting someone or yourself, tell the Crew Medical Officer or commander now.', src: ['team', 'bmed'] },
  { id: 'WB-12', cat: 'wellbeing', title: 'Loneliness', q: 'lonely loneliness alone isolated nobody to talk solo soledad aislado nadie con quien hablar me siento solo',
    a: 'You can feel lonely even in a crew. It is common on long missions and gets better with small, regular contact.',
    steps: ['Share a meal with the crew today.', 'Schedule a call or message with someone at home.', 'Tell one crewmate how you feel.'],
    esc: 'If loneliness lasts weeks or comes with hopelessness, request a private psychological conference.', src: ['team', 'bmed'] },
  { id: 'WB-13', cat: 'wellbeing', title: 'Burnout', q: 'burnout burned out burnt out exhausted overwork no energy quemado agotado del trabajo sobrecarga burnout exhausto',
    a: 'Long stretches of work without recovery lead to exhaustion, cynicism and mistakes.',
    steps: ['Tell the commander which tasks can move; protect one rest period a day.', 'Keep sleep and exercise even when busy.', 'Do one thing just for you every day.'],
    esc: 'If you are making errors on safety-critical tasks, tell the commander now so work can be shared.', src: ['sleep', 'bmed'] },
  { id: 'WB-14', cat: 'wellbeing', title: 'Trouble concentrating ("space fog")', q: 'concentrate concentration focus forgetful memory brain fog slow thinking no me puedo concentrar concentracion olvido memoria niebla mental',
    a: 'Short sleep, CO₂, stress and the first weeks of adaptation all slow thinking.',
    steps: ['Check cabin CO₂ and last night\'s sleep.', 'Use checklists and ask a crewmate to cross-check critical steps.', 'Take short breaks every hour.'],
    esc: 'Sudden confusion, trouble speaking or one-sided weakness is an emergency: press Help.', src: ['bmed', 'sleep'] },
  { id: 'WB-15', cat: 'wellbeing', title: 'Nightmares or distressing memories after an emergency', q: 'nightmares bad dreams flashbacks trauma distressing memories after emergency pesadillas malos suenos recuerdos trauma',
    a: 'After a frightening event, nightmares and replaying it in your mind are common in the first weeks.',
    steps: ['Talk about what happened with the crew in a short debrief.', 'Keep your sleep routine; avoid screens before sleep.', 'Write down what you remember — it helps the mind file it.'],
    esc: 'If it lasts more than a month or affects your work, request a private psychological conference.', src: ['bmed', 'sleep'] },
  { id: 'WB-16', cat: 'wellbeing', title: 'Thoughts of hurting yourself', q: 'suicide suicidal kill myself end my life self harm hurt myself suicidio matarme quitarme la vida hacerme dano no quiero vivir',
    a: 'If you are having thoughts of hurting yourself, you are not alone and this can get better. It is a medical emergency, not a weakness.',
    steps: ['Tell a crewmate or the Crew Medical Officer right now — do not stay alone.', 'Ask for a private conference with the flight psychologist today.', 'Keep away from medicines and tools that could hurt you until you have talked to someone.'],
    esc: 'This is urgent: press Help now so a crewmate comes to you.', src: ['bmed'], emg: 'psych' },
  { id: 'WB-17', cat: 'wellbeing', title: 'Low motivation', q: 'no motivation unmotivated apathy dont care falta de motivacion desmotivado sin ganas apatia',
    a: 'Motivation often dips in the middle of a long mission — the "third quarter" effect.',
    steps: ['Set one small goal for today and finish it.', 'Plan something to look forward to this week.', 'Check sleep and mood — low motivation can be a sign of low mood.'],
    esc: 'If it comes with sadness, hopelessness or poor sleep for two weeks, request a private psychological conference.', src: ['bmed', 'team'] },

  /* ---------- more medical (v1.1) ---------- */
  { id: 'MED-37', cat: 'medical', title: 'Migraine', q: 'migraine migraines migrana migranas jaqueca aura throbbing pulsating one side light sensitivity zigzag lights pulsatil punzante luz molesta un lado lucecitas',
    a: 'A migraine is a throbbing headache, often on one side, with sensitivity to light and noise and sometimes nausea or an "aura" (zigzag lights) before it. In flight, short sleep, skipped meals, dehydration, stress, high CO₂ and screens are common triggers.',
    steps: ['Rest in a dark, quiet sleep station with an eye mask and earplugs.', 'Drink 250–500 mL of water and eat something if you skipped a meal.', 'Cold pack on the forehead or neck for 15 minutes.', 'Take pain relief early — through the medication check ("Can I take paracetamol?").', 'Log the time, sleep, meals and cabin CO₂ to find your triggers.'],
    esc: 'First migraine of your life, worst headache ever, an aura lasting more than 1 hour, weakness, numbness, trouble speaking, fever with a stiff neck, or a headache after a bump to the head: press Help and tell the Crew Medical Officer now.', src: ['sans', 'sleep', 'std2'] },
  { id: 'MED-38', cat: 'medical', title: 'Bump or blow to the head', q: 'head injury hit my head bump on the head concussion knocked head golpe en la cabeza me pegue en la cabeza contusion conmocion chichon',
    a: 'In microgravity it is easy to hit your head on hatches and equipment. Most bumps are minor, but a concussion can show up hours later.',
    steps: ['Stop and rest; a crewmate should stay with you for the next hours.', 'Cold pack on the bump for 15 minutes.', 'Check for headache, nausea, confusion, blurred vision or memory gaps.', 'No safety-critical tasks or EVA for 24 h.'],
    esc: 'Loss of consciousness, vomiting, worsening headache, confusion, unequal pupils, seizure, clear fluid from the nose or ears, or unusual sleepiness: emergency — press Help ("Head injury").', src: ['med'], emg: 'head' },
  { id: 'MED-39', cat: 'medical', title: 'Seizure (convulsion)', q: 'seizure convulsion fit epilepsy shaking jerking convulsion convulsiones ataque epileptico epilepsia temblores',
    a: 'During a seizure the priority is to protect the person from injury; it usually stops by itself within 1–2 minutes.',
    steps: ['Do not hold them down and put nothing in their mouth.', 'Move hard objects away; in microgravity, loosely restrain them to a soft surface.', 'Time the seizure.', 'Afterwards, put them on their side and stay with them.'],
    esc: 'A seizure lasting more than 5 minutes, a second seizure, breathing problems or a first-ever seizure: emergency — press Help.', src: ['med'], emg: 'head' },
  { id: 'MED-40', cat: 'medical', title: 'Asthma or wheezing', q: 'asthma asthma attack wheeze wheezing inhaler tight chest asma ataque de asma silbido en el pecho inhalador pecho apretado',
    a: 'Dust, cabin chemicals or an infection can trigger asthma. Floating particles reach the airways more easily in microgravity.',
    steps: ['Sit upright and breathe slowly through pursed lips.', 'Use your prescribed inhaler (check it with the medication check if it is not in your profile).', 'Measure SpO₂.', 'Move away from dust or fumes.'],
    esc: 'No relief from the inhaler, trouble speaking, blue lips or SpO₂ under 92%: emergency — press Help ("Trouble breathing").', src: ['hypoxia', 'dust'], emg: 'breathing' },
  { id: 'MED-41', cat: 'medical', title: 'Choking', q: 'choking choke food stuck swallowed wrong cant swallow atragantado ahogado comida atorada me atragante no puedo tragar',
    a: 'If the person can cough or speak, the airway is partly open — let them cough.',
    steps: ['Encourage strong coughing.', 'If they cannot cough, speak or breathe: 5 back blows, then 5 abdominal thrusts (brace against a wall in microgravity).', 'Repeat until it clears or they become unresponsive.'],
    esc: 'If they become unresponsive: start CPR and press Help ("Unresponsive").', src: ['med'], emg: 'breathing' },
  { id: 'MED-42', cat: 'medical', title: 'Dry, tired or strained eyes', q: 'dry eyes tired eyes eye strain screens burning eyes ojos secos ojos cansados vista cansada ardor de ojos pantallas',
    a: 'Dry cabin air, floating dust and long screen work dry the eyes.',
    steps: ['Use lubricating eye drops from the medical kit.', 'Follow 20-20-20: every 20 minutes look at something far away for 20 seconds.', 'Blink fully and lower screen brightness.'],
    esc: 'Pain, sudden vision change or a red eye that does not improve in 2 days: tell the Crew Medical Officer.', src: ['sans', 'std2'] },
  { id: 'MED-43', cat: 'medical', title: 'Red, sticky eye or stye', q: 'pink eye conjunctivitis red eye sticky discharge stye eyelid bump conjuntivitis ojo rojo lagana orzuelo parpado',
    a: 'A red eye with discharge is usually an infection; a stye is a small painful bump on the eyelid.',
    steps: ['Do not rub or touch; wash hands often.', 'Warm compress for 10 minutes, 3–4 times a day (stye).', 'Use your own towel and wipes; no contact lenses until it clears.'],
    esc: 'Eye pain, light sensitivity, blurred vision or no improvement in 3 days: tell the Crew Medical Officer.', src: ['micro', 'immune'] },
  { id: 'MED-44', cat: 'medical', title: 'Mouth ulcers, cold sores or bleeding gums', q: 'mouth ulcer canker sore cold sore herpes lip blister bleeding gums aftas llaga en la boca fuego labial herpes encias sangran',
    a: 'Stress and changes in the immune system make mouth sores and cold sores more frequent in flight.',
    steps: ['Rinse with salt water after meals.', 'Avoid spicy, acidic food until it heals.', 'Brush gently with a soft brush and floss daily.', 'Cold sores: do not share cups and wash hands after touching.'],
    esc: 'A sore lasting more than 2 weeks, fever, or swelling of the face or jaw: tell the Crew Medical Officer.', src: ['immune', 'med'] },
  { id: 'MED-45', cat: 'medical', title: 'Neck pain or stiff neck', q: 'neck pain stiff neck neck ache torticollis dolor de cuello cuello rigido torticolis nuca',
    a: 'Holding the head in odd positions while working or sleeping in microgravity often strains the neck.',
    steps: ['Gentle neck rolls and shoulder shrugs, several times a day.', 'Warm pack for 15 minutes.', 'Adjust your sleep restraint and workstation height.'],
    esc: 'Stiff neck with fever and headache, or neck pain with arm numbness or weakness: tell the Crew Medical Officer now.', src: ['fit'] },
  { id: 'MED-46', cat: 'medical', title: 'Hand or fingernail injury after EVA', q: 'fingernail nail lifting glove hand pain fingertips eva gloves una una levantada guantes dolor de manos yemas de los dedos',
    a: 'Pressurised EVA gloves can bruise fingertips and lift fingernails (delamination).',
    steps: ['Keep nails short before every EVA.', 'Clean and cover a lifted nail; keep it dry.', 'Report glove fit problems so they can be adjusted.'],
    esc: 'Signs of infection (redness, pus, throbbing) or numbness lasting more than a day: tell the Crew Medical Officer.', src: ['dcs', 'med'] },
  { id: 'MED-47', cat: 'medical', title: 'Swollen arm, leg or neck (clot warning)', q: 'swollen leg swollen arm calf pain clot thrombosis neck swelling dvt pierna hinchada brazo hinchado coagulo trombosis pantorrilla cuello hinchado',
    a: 'Blood clots have been found in the neck veins of some astronauts. One-sided swelling, pain or warmth in a limb or the neck needs checking.',
    steps: ['Do not massage the area.', 'Measure heart rate and SpO₂.', 'Note which side, since when, and compare with the other side.'],
    esc: 'Swelling with sudden breathlessness or chest pain: emergency — press Help. Any one-sided swelling: tell the Crew Medical Officer today (ultrasound exam).', src: ['cv', 'med'] },
  { id: 'MED-48', cat: 'medical', title: 'Trouble passing urine', q: 'cant pee cannot urinate trouble urinating urinary retention weak stream no puedo orinar me cuesta orinar retencion de orina chorro debil',
    a: 'In the first days of flight the bladder does not feel full the same way, so some crew have trouble starting to urinate.',
    steps: ['Urinate on a schedule, every 2–3 hours, even without the urge.', 'Relax, take your time and use the airflow of the toilet as designed.', 'Log fluid intake.'],
    esc: 'No urine for 8 hours, lower belly pain or swelling: tell the Crew Medical Officer now — a catheter may be needed.', src: ['renal', 'med'] },
  { id: 'MED-49', cat: 'medical', title: 'Haemorrhoids or anal pain', q: 'hemorrhoids haemorrhoids piles anal pain itching bleeding when pooping hemorroides almorranas dolor anal picazon sangrado al defecar',
    a: 'Constipation and straining make haemorrhoids more likely.',
    steps: ['Prevent constipation: 2 L of fluid a day and high-fibre food.', 'Do not strain; keep the area clean and dry.', 'Soothing cream only through the medication check.'],
    esc: 'Heavy bleeding, black stools, or severe pain: tell the Crew Medical Officer.', src: ['food'] },
  { id: 'MED-50', cat: 'medical', title: 'Fungal infection (feet, groin, skin folds)', q: 'athletes foot fungus fungal infection itchy groin itchy feet ringworm pie de atleta hongos picazon en la ingle pies con picazon tina',
    a: 'Warm, damp clothing and the lack of showers help fungi grow on the feet and in skin folds.',
    steps: ['Keep the area clean and fully dry.', 'Change socks and underwear daily.', 'Antifungal cream only through the medication check.'],
    esc: 'Spreading redness, pain, oozing or fever: tell the Crew Medical Officer.', src: ['micro'] },
  { id: 'MED-51', cat: 'medical', title: 'Peeling feet or soft calluses', q: 'peeling feet calluses soles skin peeling feet baby feet pies pelados callos piel de los pies se pela',
    a: 'Without walking, the soles lose their hard skin, which peels off and floats.',
    steps: ['Remove loose skin over a wipe or in socks so flakes do not float.', 'Moisturise the feet daily.', 'Expect tender soles after landing.'],
    esc: 'Cracks that bleed, redness or pus: tell the Crew Medical Officer.', src: ['std2'] },
  { id: 'MED-52', cat: 'medical', title: 'Vertigo — the room is spinning', q: 'vertigo spinning room spinning dizzy spinning balance vertigo todo me da vueltas la habitacion gira equilibrio',
    a: 'The inner ear adapts to weightlessness and again to gravity; brief spinning with head movement is common in those days.',
    steps: ['Keep your head still and fix your eyes on one point.', 'Move your head slowly; avoid fast turns.', 'Hold on with a hand or foot restraint.'],
    esc: 'Spinning with a severe headache, double vision, weakness, slurred speech, hearing loss or vomiting that does not stop: press Help.', src: ['sensori'] },
  { id: 'MED-53', cat: 'medical', title: 'High blood sugar or diabetes', q: 'diabetes high blood sugar hyperglycemia insulin thirsty peeing a lot azucar alta glucosa alta diabetes hiperglucemia insulina mucha sed orino mucho',
    a: 'Spaceflight can lower insulin sensitivity. Very high sugar causes thirst, frequent urination and tiredness.',
    steps: ['Measure fasting blood glucose and log it.', 'Drink water; avoid sweet drinks.', 'Keep exercise and meals regular.'],
    esc: 'Glucose above 250 mg/dL, vomiting, confusion or fruity-smelling breath: tell the Crew Medical Officer now.', src: ['food', 'med'] },
  { id: 'MED-54', cat: 'medical', title: 'Pale, tired and short of breath on effort (anaemia)', q: 'anemia anaemia pale low iron low hemoglobin weak tired anemia palido hierro bajo hemoglobina baja debil',
    a: 'In space the body destroys more red blood cells ("space anaemia"), which can cause tiredness and breathlessness on effort.',
    steps: ['Log fatigue and heart rate during exercise.', 'Eat the full menu, including iron and protein.', 'Ask for a blood count at the next medical conference.'],
    esc: 'Fainting, chest pain, black stools or breathlessness at rest: tell the Crew Medical Officer now.', src: ['immune', 'food'] },
  { id: 'MED-55', cat: 'medical', title: 'Weight loss or weight gain', q: 'weight loss losing weight weight gain getting fat body mass bajar de peso perdi peso subir de peso engorde masa corporal',
    a: 'Most crew lose weight in flight because they eat less than they burn; that costs muscle and bone.',
    steps: ['Log body mass every week.', 'Eat all meal packs and snacks on the menu.', 'Keep the exercise prescription.'],
    esc: 'Loss of more than 5% of body mass, or a sudden change without a reason: tell the Crew Medical Officer.', src: ['food', 'fit'] },
  { id: 'MED-56', cat: 'medical', title: 'Overheating or heat exhaustion', q: 'overheating heat exhaustion too hot in the suit sweating a lot hot flushed calor agotamiento por calor sudor mucho calor en el traje acalorado',
    a: 'Heat builds up during hard work, exercise or in a suit with poor cooling.',
    steps: ['Stop the activity and move to a cooler module.', 'Drink a pouch with electrolytes.', 'Cool the neck and armpits with wet cloths; increase airflow.'],
    esc: 'Temperature 39 °C or more, confusion, fainting or no sweating: emergency — press Help.', src: ['std2', 'fit'] },
  { id: 'MED-57', cat: 'medical', title: 'Swallowed or inhaled a chemical', q: 'poison poisoning swallowed chemical inhaled fumes ingested intoxicado envenenado trague quimico inhale vapores intoxicacion',
    a: 'Act fast and identify the product.',
    steps: ['Do not make the person vomit.', 'Move to clean air; mask on if fumes are present.', 'Rinse the mouth; keep the label or the name of the product.', 'Measure SpO₂ and heart rate.'],
    esc: 'Any breathing trouble, drowsiness or burns in the mouth: emergency — press Help ("Smoke or toxic gas").', src: ['std2'], emg: 'toxic' },
  { id: 'MED-58', cat: 'medical', title: 'Electric shock', q: 'electric shock electrocuted shocked by equipment descarga electrica electrocutado me dio corriente choque electrico',
    a: 'Even a shock that seems small can disturb the heart rhythm.',
    steps: ['Cut the power before touching the person.', 'Check breathing and pulse.', 'Look for burns where the current entered and left.', 'Record an ECG if available.'],
    esc: 'Unresponsive, irregular heartbeat, chest pain or burns: emergency — press Help.', src: ['cv', 'std2'], emg: 'unresponsive' },
  { id: 'MED-59', cat: 'medical', title: 'Vomiting blood or black stools', q: 'vomiting blood black stool tarry stool blood in vomit vomito con sangre heces negras popo negro sangre en el vomito',
    a: 'This can be bleeding in the stomach or gut and must be checked the same day.',
    steps: ['Stop all activity and rest.', 'Measure blood pressure, heart rate and SpO₂.', 'Do not take aspirin or ibuprofen.'],
    esc: 'Tell the Crew Medical Officer now; with dizziness or fainting press Help ("Severe bleeding").', src: ['med'], emg: 'bleeding' },
  { id: 'MED-60', cat: 'medical', title: 'Severe or constant belly pain', q: 'severe belly pain severe abdominal pain appendicitis lower right pain stomach very hard dolor fuerte de estomago dolor abdominal fuerte apendicitis lado derecho abajo',
    a: 'Severe, constant belly pain — especially low on the right, with fever or vomiting — may be appendicitis or another serious problem.',
    steps: ['Do not eat; small sips of water only.', 'Measure temperature, heart rate and blood pressure.', 'Note where the pain started and where it is now.'],
    esc: 'Tell the Crew Medical Officer now — an ultrasound exam and a call to ground are needed.', src: ['med'] },
  { id: 'MED-61', cat: 'medical', title: 'Jaw pain or teeth grinding', q: 'jaw pain teeth grinding clenching bruxism tmj dolor de mandibula rechinar los dientes apretar los dientes bruxismo',
    a: 'Stress and sleep problems make people clench or grind their teeth, usually at night.',
    steps: ['Relax the jaw: lips together, teeth apart.', 'Warm pack on the jaw muscles for 10 minutes.', 'Use a mouth guard at night if one is in the dental kit.'],
    esc: 'Jaw pain with chest pain or breathlessness: press Help (it can be the heart).', src: ['bmed', 'med'] },
  { id: 'MED-62', cat: 'medical', title: 'Bruises that appear easily', q: 'bruise bruising easily purple marks moreton moretones hematoma morado',
    a: 'Bumping into equipment is common; most bruises fade in 1–2 weeks.',
    steps: ['Cold pack for the first day, warm after that.', 'Note where and how it happened.'],
    esc: 'Bruises without a bump, with bleeding gums or nosebleeds, or if you take a blood thinner: tell the Crew Medical Officer.', src: ['med'] },
  { id: 'MED-63', cat: 'medical', title: 'Side effects of a medicine', q: 'side effect side effects reaction to medicine bad reaction pill made me feel efecto secundario efectos secundarios reaccion al medicamento me cayo mal la pastilla',
    a: 'Medicines can behave differently in space. Any new symptom after starting one should be recorded.',
    steps: ['Write down the medicine, dose, time and the symptom.', 'Do not take another dose until you have checked it with the medication check.', 'Record the reaction in your medical profile.'],
    esc: 'Rash with swelling, breathing trouble or fainting: emergency — press Help ("Severe allergic reaction").', src: ['pharm'], emg: 'allergy' },
  { id: 'MED-64', cat: 'medical', title: 'Itchy scalp, dandruff or greasy hair', q: 'itchy scalp dandruff greasy hair hair loss wash hair picazon cuero cabelludo caspa pelo grasoso caida del pelo lavar el pelo',
    a: 'Without showers, oil and skin flakes build up on the scalp.',
    steps: ['Use no-rinse shampoo and a towel every 2–3 days.', 'Comb over a vacuum or wipe so hair and flakes do not float.'],
    esc: 'Red, painful or oozing patches: tell the Crew Medical Officer.', src: ['std2'] },

  /* ---------- more emotional wellbeing (v1.1) ---------- */
  { id: 'WB-18', cat: 'wellbeing', title: 'Feeling trapped or closed in (claustrophobia)', q: 'claustrophobia trapped closed in confined small space no way out claustrofobia encerrado atrapado espacio pequeno sin salida',
    a: 'Living in a small space for months can trigger the feeling of being trapped, even in people who never felt it before.',
    steps: ['Go to the largest module or a window and look far away (Earth or stars).', 'Slow breathing: in for 4, out for 6.', 'Plan time alone each day in your own sleep station.'],
    esc: 'If it causes panic attacks or stops you working: request a private psychological conference.', src: ['bmed', 'std2'] },
  { id: 'WB-19', cat: 'wellbeing', title: 'Guilt or shame after a mistake', q: 'guilt guilty shame ashamed made a mistake my fault failed culpa culpable verguenza me equivoque cometi un error fue mi culpa falle',
    a: 'Everyone makes mistakes on long missions. What matters is reporting it, learning and moving on — a calm crew is safer than a perfect one.',
    steps: ['Report the mistake plainly so it can be fixed.', 'Separate what happened from who you are.', 'Write one thing you will do differently next time.', 'Talk to a crewmate you trust.'],
    esc: 'If guilt keeps you awake for days or comes with thoughts of hurting yourself: tell the Crew Medical Officer today.', src: ['bmed', 'team'] },
  { id: 'WB-20', cat: 'wellbeing', title: 'Low self-confidence or feeling not good enough', q: 'low self esteem self confidence not good enough impostor insecure inferior autoestima baja inseguridad inseguro no soy suficiente impostor no sirvo',
    a: 'Being surrounded by highly trained people can make anyone doubt themselves. You were selected because you are capable.',
    steps: ['Write three things you did well this week.', 'Ask for feedback on one concrete task.', 'Compare yourself with your own progress, not with others.'],
    esc: 'If it comes with persistent sadness or hopelessness, see "Feeling sad" and request a psychological conference.', src: ['bmed'] },
  { id: 'WB-21', cat: 'wellbeing', title: 'Overthinking, worrying or intrusive thoughts', q: 'overthinking worry worrying intrusive thoughts obsessive thoughts cant stop thinking rumination pienso demasiado pensamientos intrusivos pensamientos obsesivos no paro de pensar preocupacion darle vueltas',
    a: 'In a quiet, closed environment the mind tends to replay worries. A thought is not a fact and does not have to be acted on.',
    steps: ['Set a 15-minute "worry time" each day and write the worries down.', 'When a thought loops, name it ("this is a worry") and return to what you are doing.', 'Exercise and slow breathing lower the volume of worry.'],
    esc: 'If thoughts are frightening, violent, or you cannot control them: request a private psychological conference today.', src: ['bmed'] },
  { id: 'WB-22', cat: 'wellbeing', title: 'Mood swings', q: 'mood swings emotional ups and downs moody emotional cambios de humor cambios de animo emocional altibajos',
    a: 'Sleep loss, stress and confinement make emotions stronger and faster to change.',
    steps: ['Log your mood twice a day for a week to see the pattern.', 'Protect your sleep window.', 'Name the emotion before you react to it.'],
    esc: 'Days of very high energy with little sleep, or swings that affect safety: tell the Crew Medical Officer.', src: ['bmed', 'sleep'] },
  { id: 'WB-23', cat: 'wellbeing', title: 'Fear that something bad will happen', q: 'fear of dying afraid of dying scared something will go wrong fear of death worried about health miedo a morir miedo a la muerte miedo a que algo salga mal preocupado por mi salud',
    a: 'Thinking about the risks of the mission is natural. The crew, the procedures and NovaCare exist to handle those risks.',
    steps: ['Talk about the fear with a crewmate or the flight psychologist.', 'Review the procedure for the situation you fear — knowing the plan reduces fear.', 'Focus on what you can control today.'],
    esc: 'If the fear is constant, causes panic or stops you sleeping: request a private psychological conference.', src: ['bmed'] },
  { id: 'WB-24', cat: 'wellbeing', title: 'Problems with partner or family at home', q: 'relationship problems partner wife husband girlfriend boyfriend kids family problems divorce problemas de pareja esposa esposo novia novio hijos problemas familiares divorcio',
    a: 'Being far away makes it hard to help with problems at home, and that feeling of helplessness is very stressful.',
    steps: ['Schedule a private call with time to talk calmly.', 'Ask the family support office on the ground to help at home.', 'Write down what you want to say before the call.'],
    esc: 'If it stops you sleeping or concentrating: request a private psychological conference.', src: ['bmed', 'team'] },
  { id: 'WB-25', cat: 'wellbeing', title: 'Feeling left out by the crew', q: 'left out excluded ignored crew doesnt like me no friends rejected me excluyen me ignoran no le caigo bien a nadie rechazado excluido',
    a: 'Sub-groups form in every crew. Feeling left out is common and can be fixed with small steps.',
    steps: ['Join one shared meal or activity today.', 'Ask a crewmate for help or offer yours.', 'Tell the commander privately if it continues.'],
    esc: 'If it comes with sadness or isolation for weeks: request a psychological conference.', src: ['team'] },
  { id: 'WB-26', cat: 'wellbeing', title: 'Feeling unreal, or seeing or hearing things', q: 'feel unreal detached derealization depersonalization hearing voices seeing things hallucination me siento irreal desconectado oigo voces veo cosas alucinacion',
    a: 'Extreme tiredness and stress can make the world feel unreal. Hearing or seeing things others do not is a medical issue that needs checking.',
    steps: ['Ground yourself: touch something cold, name 5 things you see.', 'Sleep and eat — exhaustion is a common cause.', 'Tell a crewmate what you are experiencing.'],
    esc: 'Voices, visions or strong beliefs others do not share: tell the Crew Medical Officer today.', src: ['bmed', 'sleep'] },
  { id: 'WB-27', cat: 'wellbeing', title: 'Emotional eating or not eating', q: 'emotional eating binge eating overeating not eating stress eating comer por ansiedad atracones como mucho no como comer emocional',
    a: 'Stress and boredom change appetite. In space, eating too little is the bigger risk to muscle and bone.',
    steps: ['Eat at fixed times with the crew.', 'Before eating outside meals, ask: am I hungry or stressed?', 'Log your meals and body mass.'],
    esc: 'Making yourself vomit, skipping meals on purpose, or large weight changes: tell the Crew Medical Officer.', src: ['food', 'bmed'] },
  { id: 'WB-28', cat: 'wellbeing', title: 'Cravings or withdrawal (caffeine, nicotine, alcohol)', q: 'craving withdrawal nicotine smoking cigarette caffeine coffee alcohol addiction antojo abstinencia nicotina fumar cigarro cafeina cafe alcohol adiccion',
    a: 'Withdrawal can cause irritability, headache and poor sleep for days or weeks.',
    steps: ['Expect the craving to peak and pass within 10–20 minutes.', 'Distract yourself: exercise, a task, a call.', 'Keep caffeine to the morning.'],
    esc: 'Shaking, sweating, confusion or seeing things (alcohol withdrawal): tell the Crew Medical Officer now.', src: ['bmed'] },
  { id: 'WB-29', cat: 'wellbeing', title: 'Pressure to perform or fear of failure', q: 'pressure to perform fear of failure perfectionism perfectionist performance anxiety presion miedo al fracaso perfeccionismo perfeccionista ansiedad de rendimiento',
    a: 'High standards help in a mission, but perfectionism increases stress and mistakes.',
    steps: ['Define "good enough" for each task before starting.', 'Use checklists and a crewmate check instead of worrying.', 'Celebrate tasks finished, not only perfect ones.'],
    esc: 'If fear of failure blocks you from tasks: talk to the commander or request a psychological conference.', src: ['bmed'] },
  { id: 'WB-30', cat: 'wellbeing', title: 'Worry about returning to Earth', q: 'returning to earth after the mission going home life after landing worry readaptation volver a la tierra despues de la mision regresar a casa adaptacion',
    a: 'Many astronauts feel unsure about going back: their body, work and family have changed. This is a normal transition.',
    steps: ['Plan the first weeks after landing with the support team.', 'Talk with family about expectations.', 'Keep exercise high — it makes physical recovery faster.'],
    esc: 'If worry affects sleep or mood: request a psychological conference.', src: ['bmed', 'fit'] },
  { id: 'WB-31', cat: 'wellbeing', title: 'Big feelings about Earth, life and meaning', q: 'overview effect meaning of life existential small universe looking at earth sentido de la vida existencial pequeno universo mirar la tierra',
    a: 'Seeing Earth from space often brings strong emotions and questions about life. Most astronauts describe it as positive.',
    steps: ['Write or record what you feel.', 'Share it with the crew or family.', 'Take time at the window — it can be a source of calm.'],
    esc: 'If the feelings become distressing or hopeless: see "Feeling sad".', src: ['bmed'] },
  { id: 'WB-32', cat: 'wellbeing', title: 'How to relax and calm down', q: 'relax relaxation calm down breathing exercise meditation mindfulness how to calm relajarme relajacion calmarme ejercicio de respiracion meditacion como me calmo tranquilizarme',
    a: 'Slow breathing and body relaxation lower heart rate and stress within minutes.',
    steps: ['Box breathing: in 4, hold 4, out 4, hold 4 — for 4 minutes.', 'Tense each muscle group for 5 seconds, then release, from feet to face.', '5 minutes of attention on your breath or on the view of Earth.'],
    esc: 'If you cannot calm down after 20 minutes, see "Anxiety or panic".', src: ['bmed'] },
  { id: 'WB-33', cat: 'wellbeing', title: 'Feeling overwhelmed — "I can’t take it anymore"', q: 'overwhelmed cant take it anymore breaking down too much falling apart no puedo mas ya no aguanto me estoy derrumbando colapso abrumado demasiado',
    a: 'Feeling overwhelmed means your load is bigger than your resources right now. That can change.',
    steps: ['Stop for 10 minutes; slow breathing.', 'Tell a crewmate now — you do not have to carry it alone.', 'Ask the commander to move non-critical tasks.'],
    esc: 'If you are thinking of hurting yourself: press Help now. Otherwise request a psychological conference today.', src: ['bmed', 'team'] },
  { id: 'WB-34', cat: 'wellbeing', title: 'Looking after your mental health', q: 'mental health psychological health how to feel better improve mood be happy wellbeing salud mental salud psicologica sentirme mejor mejorar el animo ser feliz bienestar',
    a: 'Mental health on a mission rests on the same basics every day: sleep, exercise, connection and meaning.',
    steps: ['Protect 8 hours of sleep and daily exercise.', 'One real conversation a day with the crew or home.', 'Do one thing for yourself every day.', 'Log mood and stress in your check-in so changes are caught early.'],
    esc: 'If you notice two weeks of low mood, anxiety or poor sleep: request a private psychological conference.', src: ['bmed', 'sleep', 'team'] },

  /* ---------- general fallbacks: used when no specific protocol matches ---------- */
  { id: 'GEN-01', cat: 'medical', fallback: true, title: 'A symptom that is not in the onboard list', q: 'symptom general other symptom sintoma general otro sintoma',
    a: 'There is no specific onboard protocol for this symptom, so use the general approach: check for danger signs, measure, record and tell the Crew Medical Officer.',
    steps: ['Danger signs first: chest pain, trouble breathing, fainting, confusion, one-sided weakness, severe bleeding or the worst pain of your life → press Help now.', 'Measure heart rate, blood pressure, temperature and SpO₂ and log them.', 'Write down: where it is, since when, how strong (0–10), what makes it better or worse, and anything that came with it.', 'Rest, drink water and do not take any medicine without the medication check.', 'Tell the Crew Medical Officer and ask for a medical conference with ground.'],
    esc: 'If it gets worse, lasts more than 24 hours, or you are worried: tell the Crew Medical Officer today.', src: ['med'] },
  { id: 'GEN-02', cat: 'wellbeing', fallback: true, title: 'A feeling or worry that is not in the onboard list', q: 'feeling emotion general sentimiento emocion general',
    a: 'There is no specific onboard protocol for this, but what you feel matters. Many feelings on long missions come from sleep, workload, distance from home and confinement.',
    steps: ['Name what you feel and write it down — it helps to sort it out.', 'Talk to a crewmate you trust today.', 'Check the basics: sleep, meals, exercise and time to yourself.', 'Request a private psychological conference — it is confidential.'],
    esc: 'If you have thoughts of hurting yourself or someone else, press Help now.', src: ['bmed', 'team'] },
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
  const STOP = new Set('a an the is are am i my me you we to of in on at for and or with what how do does can should it this that de la el los las un una y o que como para por con mi me es en se lo le hay tengo esta estoy feel feeling felt siento sentir senti muy very have has'.split(' '));
  const GENERIC = new Set('pain dolor duele hurt ache sore weird strange raro rara extrano extrana bad mal problem problema sick symptom sintoma'.split(' '));
  const tok = (s) => fold(s).replace(/[^a-z0-9₂ ]+/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)).map((w) => w.replace(/(ing|es|s)$/, '').slice(0, 9));
  // general fallbacks (GEN-…) are not searched: they answer only when nothing specific matches
  const docs = KB.filter((e) => !e.fallback).map((e) => { const words = [...tok(e.title), ...tok(e.title), ...tok(e.q), ...tok(e.q), ...tok(e.a)]; const tf = {}; words.forEach((w) => { tf[w] = (tf[w] || 0) + 1; }); return { e, tf, len: words.length }; });
  const avg = docs.reduce((n, d) => n + d.len, 0) / docs.length;
  const df = {}; docs.forEach((d) => Object.keys(d.tf).forEach((w) => { df[w] = (df[w] || 0) + 1; }));
  const vocab = Object.keys(df);
  /* Edit distance, stopped early once it is over the limit. */
  function near(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return false;
    let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i]; let best = i;
      for (let j = 1; j <= b.length; j++) { cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); best = Math.min(best, cur[j]); }
      if (best > max) return false; prev = cur;
    }
    return prev[b.length] <= max;
  }
  /* A word that is not in the base still counts if it is a typo or a close spelling of one that is
     ("migrana" → "migraine", "diarea" → "diarrea"), at a lower weight. */
  const fuzzyCache = {};
  function expand(w) {
    if (df[w]) return [[w, 1]];
    if (fuzzyCache[w]) return fuzzyCache[w];
    const max = w.length >= 7 ? 2 : w.length >= 5 ? 1 : 0;
    const pre = (v) => { let i = 0; while (i < v.length && i < w.length && v[i] === w[i]) i++; return i; };
    const out = !max ? [] : vocab.filter((v) => v.length >= 4 && ((v.length >= 5 && (v.startsWith(w) || w.startsWith(v))) || near(w, v, max) || (pre(v) >= 5 && pre(v) >= Math.min(v.length, w.length) - 2))).map((v) => [v, 0.75]);
    return (fuzzyCache[w] = out);
  }
  /** Best matching entries with a score; empty when nothing is relevant. */
  function search(q, n = 3) {
    const terms = [...new Set(tok(q))]; if (!terms.length) return [];
    const ex = terms.map(expand);
    return docs.map((d) => {
      let s = 0, specific = false;
      ex.forEach((alts, i) => {
        let best = 0; // each word of the question counts once, by its best spelling
        alts.forEach(([w, k]) => { const f = d.tf[w]; if (!f) return; const idf = Math.log(1 + (docs.length - df[w] + 0.5) / (df[w] + 0.5)); best = Math.max(best, k * idf * (f * 2.2) / (f + 1.2 * (0.25 + 0.75 * d.len / avg))); });
        s += best; if (best && !GENERIC.has(terms[i])) specific = true;
      });
      return { e: d.e, s: specific ? s : 0 }; // "pain" alone does not say which protocol
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
