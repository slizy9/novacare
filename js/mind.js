/* NOVACARE — Mind: psychological support that works without Earth.

   On the way to Mars a message takes up to 20 minutes each way, so there is no psychologist in real
   time. Mind gives the astronaut, on the device and offline:
   - a weekly check with validated screening scales (PHQ-2 → PHQ-9 for low mood, GAD-2 → GAD-7 for
     anxiety; free to use), never presented as a diagnosis;
   - an early-warning signal from data NovaCare already has (mood, stress, sleep, cabin CO₂, mission phase);
   - four short guided programs based on cognitive behavioural therapy (sleep, worry, mood, friction);
   - "Window to Earth": guided breathing in front of the turning planet, rated before and after;
   - a weekly crew-climate pulse that is only ever shown as a crew average of 3 or more answers;
   - a private way to ask the Crew Medical Officer for a conversation.
   Privacy: everything here stays in the astronaut's own record. The crew sees nothing of it, except the
   crew-climate average and — only if the person chooses — that they asked for a conversation. */

const MIND_OPTS = ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'];
const PHQ = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
  'Trouble concentrating on things, such as reading or watching a film',
  'Moving or speaking so slowly that other people could have noticed — or being so fidgety or restless that you have been moving around a lot more than usual',
  'Thoughts that you would be better off dead, or of hurting yourself in some way',
];
const GAD = [
  'Feeling nervous, anxious or on edge',
  'Not being able to stop or control worrying',
  'Worrying too much about different things',
  'Trouble relaxing',
  'Being so restless that it is hard to sit still',
  'Becoming easily annoyed or irritable',
  'Feeling afraid, as if something awful might happen',
];
const PULSE_Q = [
  { q: 'I felt heard by the crew this week', rev: false },
  { q: 'There was tension in the crew this week', rev: true },
  { q: 'I trust the crew to help me if I need it', rev: false },
];
const AGREE = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];

/* Guided programs: short sessions based on cognitive behavioural therapy. */
const PROGRAMS = [
  { id: 'sleep', icon: 'moon', title: 'Sleep better', sub: 'Cognitive behavioural therapy for insomnia, adapted to orbit', for: 'Short or broken sleep', sessions: [
    { t: 'How sleep works in space', learn: ['Sleep is driven by two things: how long you have been awake and your body clock. In orbit, 16 sunrises a day, noise and light confuse the clock.', 'Most sleep problems keep going because of habits we build to cope with them. Those habits can be changed — that is what this program does.'],
      do: { kind: 'check', prompt: 'Which of these happen to you?', items: ['I use screens in my sleep station', 'I lie awake for more than 20 minutes', 'My sleep time changes from day to day', 'I drink caffeine after midday', 'I nap for more than 30 minutes'] } },
    { t: 'A fixed sleep window', learn: ['Choose one wake time and keep it every day, even after a bad night. It is the strongest signal your body clock gets.', 'Your sleep window is the hours you actually sleep plus 30 minutes — never less than 6 hours. When you sleep well in most of it for a week, add 15 minutes.'],
      do: { kind: 'text', prompt: 'My wake time, and when my sleep window starts' } },
    { t: 'The sleeping bag is for sleep', learn: ['If you are awake for more than about 20 minutes, get out of the bag. Float to a dim module and do something calm and dull until you feel sleepy, then go back.', 'Do not work, read the news or worry in the bag. The goal is that your brain links the sleep station with falling asleep.'],
      do: { kind: 'check', prompt: 'My plan for the next 7 nights', items: ['I will leave the bag if I am awake for more than 20 minutes', 'No work or messages in the sleep station', 'Same wake time every day'] } },
    { t: 'Wind down and park your worries', learn: ['In the last hour before sleep: warm dim light, no screens, the same short routine every night.', 'Worries come at night because there is nothing else to think about. Write them down earlier in the evening, each with one first step for tomorrow — then they can wait.'],
      do: { kind: 'text', prompt: 'What is on my mind tonight, and one first step for each' } },
    { t: 'Review your progress', learn: ['Compare your sleep before and during the program (below). Keep what worked; one or two habits are enough.', 'If you still sleep under 6 hours on most nights after two weeks, ask the Crew Medical Officer for a review.'],
      review: 'sleep', do: { kind: 'text', prompt: 'What helped me most' } },
  ] },
  { id: 'worry', icon: 'breath', title: 'Calm the worry', sub: 'Cognitive behavioural therapy for anxiety', for: 'Anxiety, tension, worrying', sessions: [
    { t: 'What anxiety is', learn: ['Anxiety is your alarm system. It is useful in real danger, but under constant pressure it becomes too sensitive and goes off without a real threat.', 'It shows in the body (fast heart, tight chest), in thoughts (what if…) and in behaviour (avoiding things). Avoiding brings short relief but keeps the alarm sensitive.'],
      do: { kind: 'check', prompt: 'What I notice when I am anxious', items: ['Fast heart or tight chest', 'Racing thoughts', 'Trouble sleeping', 'Irritability', 'Avoiding some tasks or people'] } },
    { t: 'Calm the body first', learn: ['Slow breathing with a long out-breath switches the body from alarm to rest: in for 4, hold for 2, out for 6.', 'Practise it when you are calm, so it works when you are not. Try it now in the Window to Earth.'],
      earth: true, do: { kind: 'check', prompt: 'Practice', items: ['I practised slow breathing today'] } },
    { t: 'Catch the thought', learn: ['Feelings follow thoughts. When anxiety rises, ask: what just went through my mind?', 'Write the situation, the thought, and how strong the feeling is from 0 to 100. Just noticing a thought already makes it weaker.'],
      do: { kind: 'text', prompt: 'Situation — thought — feeling (0–100)' } },
    { t: 'Test the thought', learn: ['Look at the thought like a scientist: what supports it, what does not? What would you tell a crewmate who had this thought?', 'Write a more balanced version and rate the feeling again. The aim is not positive thinking — it is accurate thinking.'],
      do: { kind: 'text', prompt: 'Evidence for and against — a more balanced thought — feeling now (0–100)' } },
    { t: 'Worry time and small steps', learn: ['Give worry 15 minutes at a set time each day. When it comes at other times, note it and leave it for worry time.', 'Face what you have been avoiding in small steps, from easiest to hardest. Each step teaches the alarm that it can calm down.'],
      do: { kind: 'text', prompt: 'One thing I have been avoiding, and the first small step' } },
  ] },
  { id: 'mood', icon: 'sun', title: 'Lift your mood', sub: 'Behavioural activation', for: 'Low mood, no motivation', sessions: [
    { t: 'The low-mood cycle', learn: ['Low mood makes us do less. Doing less gives fewer good moments, and fewer good moments lower the mood further.', 'The way out is action before motivation: doing small things first, and letting the mood follow.'],
      do: { kind: 'check', prompt: 'Things I have stopped doing lately', items: ['Exercise', 'Calls or messages home', 'Meals with the crew', 'A hobby or project', 'Looking out of the window'] } },
    { t: 'Track activity and mood', learn: ['For today, note three things you did and rate each: how much pleasure (0–10) and how much sense of achievement (0–10).', 'You will start to see which activities lift you, even a little.'],
      do: { kind: 'text', prompt: 'Three activities today — pleasure and achievement (0–10)' } },
    { t: 'What matters to you', learn: ['Values are what give you direction: family, the crew, curiosity, health, the purpose of the mission.', 'Pick two, and for each one choose a small action you can do this week.'],
      do: { kind: 'check', prompt: 'My two values this week', items: ['Family and friends', 'My crew', 'Curiosity and learning', 'Health', 'The purpose of the mission', 'Creativity'] } },
    { t: 'Plan small, do it anyway', learn: ['Each day, schedule one pleasant activity and one meaningful one — small enough that you cannot fail.', 'Do them as planned, whatever your mood at that moment. Afterwards, notice how you feel.'],
      do: { kind: 'text', prompt: 'My plan for the next three days' } },
    { t: 'Review your progress', learn: ['Compare your mood before and during the program (below).', 'If your mood is still low most days after two weeks, or you lose hope, request a private conference with the flight psychologist.'],
      review: 'mood', do: { kind: 'text', prompt: 'What helped me most' } },
  ] },
  { id: 'team', icon: 'users', title: 'Handle friction', sub: 'Communication and conflict in a small crew', for: 'Tension with a crewmate', sessions: [
    { t: 'Small things grow in small spaces', learn: ['In confinement, small irritations add up because there is no way to get away from each other.', 'Notice the early signs: avoiding someone, sarcasm, silence, keeping score.'],
      do: { kind: 'check', prompt: 'Signs I notice in myself', items: ['Avoiding someone', 'Sarcasm or short answers', 'Going silent', 'Replaying an argument', 'Keeping score'] } },
    { t: 'Cool down first', learn: ['Before you talk, check HALT: are you Hungry, Angry, Lonely or Tired? Fix that first.', 'Take 10 minutes away and breathe slowly. Difficult talks go better when both people are calm.'],
      earth: true, do: { kind: 'check', prompt: 'Before my next difficult talk', items: ['I will check HALT', 'I will wait until we are both calm'] } },
    { t: 'Say it with "I"', learn: ['Describe the situation and its effect on you, not the other person: "When the tools are left out, I lose time looking for them, and I need us to agree where they go."', 'Avoid "always" and "never" — they start a debate about the facts instead of a solution.'],
      do: { kind: 'text', prompt: 'When … happens, I feel …, and I need …' } },
    { t: 'Listen to understand', learn: ['Let the other person finish, then repeat in your own words what you heard. Ask what they need.', 'Remind each other of the shared goal: the mission and getting home together.'],
      do: { kind: 'check', prompt: 'Practice', items: ['I repeated back what I heard', 'I asked what they need'] } },
    { t: 'Repair and agree', learn: ['End with one concrete agreement, and check in on it after 3 days.', 'If it does not settle, the commander or a mediator on the ground can help — asking for that is a strength.'],
      do: { kind: 'text', prompt: 'Our agreement, and when we will check in' } },
  ] },
];
const PROG = Object.fromEntries(PROGRAMS.map((p) => [p.id, p]));

const Mind = (() => {
  const data = () => { if (!state.mind) state.mind = { checks: [], programs: {}, pulse: {}, calm: [] }; const m = state.mind; m.checks = m.checks || []; m.programs = m.programs || {}; m.pulse = m.pulse || {}; m.calm = m.calm || []; return m; };
  const week = (md = state.md) => Math.floor((md - 1) / 7) + 1;
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const avg = (a) => (a.length ? sum(a) / a.length : null);
  const r1 = (x) => Math.round(x * 10) / 10;

  /* ---------- scales ---------- */
  function band(kind, score) {
    if (kind === 'phq') return score >= 20 ? { l: 3, name: 'Severe' } : score >= 15 ? { l: 3, name: 'Moderately severe' } : score >= 10 ? { l: 2, name: 'Moderate' } : score >= 5 ? { l: 1, name: 'Mild' } : { l: 0, name: 'Minimal' };
    return score >= 15 ? { l: 3, name: 'Severe' } : score >= 10 ? { l: 2, name: 'Moderate' } : score >= 5 ? { l: 1, name: 'Mild' } : { l: 0, name: 'Minimal' };
  }
  /** The latest check, scored: { phq, gad (full or 2-item), phqFull, gadFull, harm }. */
  function score(c) {
    if (!c) return null;
    const p = c.phq || [], g = c.gad || [];
    const phqFull = p.length === 9 && p.every((x) => x != null), gadFull = g.length === 7 && g.every((x) => x != null);
    return { at: c.at, md: c.md, phq: phqFull ? sum(p) : (p[0] || 0) + (p[1] || 0), gad: gadFull ? sum(g) : (g[0] || 0) + (g[1] || 0), phqFull, gadFull, harm: phqFull && p[8] > 0 };
  }
  const last = () => { const c = data().checks; return c.length ? score(c[c.length - 1]) : null; };
  const recent = () => { const s = last(); return s && state.md - s.md <= 14 ? s : null; };
  const checkDue = () => { const s = last(); return !s || state.md - s.md >= 7; };

  /* ---------- early warning from the data NovaCare already has ---------- */
  function series(id, from, to) { const out = []; for (let d = Math.max(1, from); d <= to; d++) { const v = state.days[d] && state.days[d].vals[id]; if (v != null) out.push({ d, v: +v }); } return out; }
  function signal() {
    const md = state.md; const reasons = []; const helps = []; let l = 0;
    const moodNow = avg(series('mood', md - 4, md).map((x) => x.v)), moodBefore = avg(series('mood', md - 18, md - 5).map((x) => x.v));
    const low = series('mood', md - 13, md).filter((x) => x.v <= 2).length;
    const sleep = avg(series('sleep', md - 6, md).map((x) => x.v)); const stress = avg(series('stress', md - 6, md).map((x) => x.v));
    const co2 = series('co2', md - 6, md).filter((x) => Engine.classify(IND.co2, x.v).level >= 1).length;
    const s = recent();
    if (s && s.harm) { l = 3; reasons.push('Your last check mentioned thoughts of hurting yourself'); }
    if (s) {
      const bp = band('phq', s.phq), bg = band('gad', s.gad);
      if (s.phqFull && bp.l >= 1) { l = Math.max(l, bp.l); reasons.push(`Low-mood scale (PHQ-9): ${s.phq} — ${bp.name.toLowerCase()}`); }
      else if (!s.phqFull && s.phq >= 3) { l = Math.max(l, 1); reasons.push(`Low-mood screen (PHQ-2): ${s.phq} of 6`); }
      if (s.gadFull && bg.l >= 1) { l = Math.max(l, bg.l); reasons.push(`Anxiety scale (GAD-7): ${s.gad} — ${bg.name.toLowerCase()}`); }
      else if (!s.gadFull && s.gad >= 3) { l = Math.max(l, 1); reasons.push(`Anxiety screen (GAD-2): ${s.gad} of 6`); }
    }
    if (moodNow != null && moodBefore != null && moodBefore - moodNow >= 0.7) { l = Math.max(l, moodBefore - moodNow >= 1.2 ? 2 : 1); reasons.push(`Mood fell from ${r1(moodBefore)} to ${r1(moodNow)} (of 5) in the last days`); }
    if (low >= 5) { l = Math.max(l, 2); reasons.push(`Low mood on ${low} of the last 14 days`); }
    if (sleep != null && sleep < 6.5) { l = Math.max(l, sleep < 6 ? 2 : 1); reasons.push(`Sleep averaged ${r1(sleep)} h this week`); helps.push('sleep'); }
    if (stress != null && stress >= 3.5) { l = Math.max(l, 1); reasons.push(`Stress averaged ${r1(stress)} of 5 this week`); helps.push('worry'); }
    if (co2 >= 3 && reasons.length) reasons.push(`Cabin CO₂ was high on ${co2} of the last 7 days — it worsens sleep, mood and concentration`);
    if (s && (s.phq >= 5 || (!s.phqFull && s.phq >= 3)) || low >= 3 || (moodNow != null && moodNow < 3.2)) helps.unshift('mood');
    if (s && (s.gad >= 5 || (!s.gadFull && s.gad >= 3))) helps.unshift('worry');
    const pulse = data().pulse[week()]; if (pulse && pulse.a[1] >= 4) helps.push('team');
    const enough = series('mood', md - 13, md).length >= 3 || !!s;
    return { level: enough ? l : -1, reasons, helps: [...new Set(helps)], moodNow, moodBefore, sleep, stress };
  }

  /* ---------- mission phase ---------- */
  function phase() {
    const len = state.missionDays || 180; const p = state.md / len;
    if (p <= 0.1) return { name: 'Adaptation', text: 'The first weeks: the body and the routine are adjusting. Sleep and space sickness are the main challenges. Keep the routine simple.' };
    if (p < 0.5) return { name: 'Settled in', text: 'The routine is set. This is the time to build habits that will carry you through the harder middle of the mission.' };
    if (p < 0.75) return { name: 'Third quarter', text: 'Morale often dips after the halfway point — the “third-quarter effect” seen on long missions and in polar stations. It is expected and it passes. Plan things to look forward to.' };
    if (p < 0.92) return { name: 'Last stretch', text: 'Home feels close, and waiting can feel long. Keep exercise high: it decides how fast you recover after landing.' };
    return { name: 'Return preparation', text: 'Your body, your work and your family have changed while you were away. Plan the first weeks after landing with the support team.' };
  }

  /* ---------- crew climate (only an average of 3 or more) ---------- */
  const pulseScore = (a) => Math.round((avg(a.map((v, i) => (PULSE_Q[i].rev ? 6 - v : v))) - 1) / 4 * 100);
  /** What this person shares with the crew: only this week's pulse score, nothing else from Mind. */
  function share(s) { const p = s && s.mind && s.mind.pulse && s.mind.pulse[week(s.md)]; return p && p.a && p.a.every((v) => v != null) ? { week: week(s.md), score: pulseScore(p.a) } : null; }
  function climate() {
    const w = week(); const got = Crew.members().map((m) => (m.me ? share(state) : m.pulse)).filter((p) => p && p.week === w);
    return { n: got.length, score: got.length >= 3 ? Math.round(avg(got.map((p) => p.score))) : null };
  }

  /* ---------- the assistant: listens, reflects and suggests one tool (offline, rule-based) ----------
     It never diagnoses. It recognises a few themes in what the person writes (in any of the app's
     languages), answers with a validating sentence and one question, and offers the matching tool.
     Words about self-harm always get the safety answer first. */
  const TOPICS = [
    ['crisis', /suicid|kill myself|end (it|my life)|want to die|hurt(ing)? myself|self.?harm|matarme|quitarme la vida|no quiero (vivir|seguir)|quiero morir(me)?|hacerme da[nñ]o|autolesi|me matar|tirar (a )?minha vida|quero morrer|me machucar|me tuer|envie de mourir|me faire du mal/i],
    ['sleep', /sleep|insomn|tired|exhaust|awake at night|dorm|sue[nñ]o|cansad|agotad|desvel|insônia|sono|fatigu|sommeil|épuis|epuis/i],
    ['worry', /anx|worr|nervous|panic|fear|scared|afraid|ansi|preocup|nervios|p[aá]nico|miedo|medo|angoiss|inqui[eè]t|peur|stress|estr[eé]s|tens[ií]on|tensão|agobi/i],
    ['low', /sad|down|depress|empty|hopeless|cry|unmotivat|no energy|triste|deprim|vac[ií]o|sin ganas|llor|desanim|desmotiv|bajón|bajon|chor|vazio|desanimad|vide|pleur|déprim|sans envie/i],
    ['team', /crew|argu|fight|conflict|annoy|colleague|crewmate|commander|compa[nñ]er|pelea|discut|molest|tripulaci|comandante|colega|briga|discuss|colleg|équipage|equipage|dispute/i],
    ['home', /home|family|miss (my|them|her|him)|lonely|alone|kids|children|partner|wife|husband|casa|familia|echo de menos|extra[nñ]o a|sol[oa]\b|soledad|hijos|pareja|esposa|esposo|saudade|sozinh|filhos|família|famille|seul|me manque|enfants/i],
    ['anger', /angry|anger|furious|irritat|rage|enoj|enfad|rabia|furios|irrit|raiva|bravo|col[eè]re|énerv|enerv/i],
    ['work', /work|task|workload|mistake|error|deadline|experiment|trabajo|tarea|carga|fallo|equivoqu|trabalho|tarefa|erro|travail|tâche|tache|erreur/i],
    ['good', /\b(good|great|happy|fine|calm|grateful|better)\b|bien|feliz|content|tranquil|agradec|genial|mejor|\bbem\b|ótimo|otimo|grato|heureux|reconnaissant|mieux/i],
  ];
  const REPLY = {
    crisis: { say: ['Thank you for telling me. What you are feeling matters, and you do not have to carry it alone.', 'Please talk to someone right now — a crewmate or the Crew Medical Officer — and stay with another person.', 'This feeling can change with help. Asking for it is the strong thing to do.'], tools: ['help', 'talk'] },
    sleep: { say: ['Sleep in space is hard for almost everyone — light, noise and the schedule all get in the way.', 'What usually happens when you cannot sleep: racing thoughts, discomfort, or noise?'], tools: ['prog:sleep', 'breathe'] },
    worry: { say: ['It sounds like your mind is on alert. That is tiring, and it makes sense under this pressure.', 'What is the worry telling you might happen?'], tools: ['breathe', 'prog:worry'] },
    low: { say: ['I hear that you are feeling low. That is heavy, and you did well to put it into words.', 'Is there one small thing you used to enjoy that you could do today, even for ten minutes?'], tools: ['prog:mood', 'write:weigh'] },
    team: { say: ['Living so close to the same people, small frictions grow quickly. Your reaction is understandable.', 'What would you need from that person for things to feel better?'], tools: ['prog:team', 'breathe'] },
    home: { say: ['Missing home and the people you love is one of the hardest parts of a long mission.', 'Who are you thinking about most? Writing to them can help, even if you do not send it.'], tools: ['write:letter'] },
    anger: { say: ['Anger is a signal that something matters to you. It is okay to feel it.', 'Before acting on it, give your body a few minutes to cool down. What triggered it?'], tools: ['breathe', 'prog:team'] },
    work: { say: ['There is a lot on your shoulders. Pressure on a mission is real.', 'What is one task you could finish, postpone or ask for help with today?'], tools: ['breathe', 'prog:worry'] },
    good: { say: ['That is good to hear.', 'What helped you feel this way? It is worth remembering for harder days.'], tools: ['write:good'] },
  };
  const FOLLOW = ['Tell me more — what happened?', 'What do you notice in your body as you say this?', 'If a crewmate felt this way, what would you tell them?', 'What would help, even a little, in the next hour?'];
  const MOODS = [[1, 'Very low'], [2, 'Low'], [3, 'Okay'], [4, 'Good'], [5, 'Very good']];
  const topics = (text) => TOPICS.filter(([, rx]) => rx.test(text)).map(([id]) => id);
  /** One answer from the assistant: { say: [sentences], tools: [tool ids] }. */
  function reply(text, turn) {
    const found = topics(text);
    if (found.includes('crisis')) return { say: REPLY.crisis.say, tools: REPLY.crisis.tools, crisis: true };
    const hard = found.filter((x) => x !== 'good');
    const main = hard[0] || found[0];
    if (!main) return { say: ['Thank you for sharing that with me.', FOLLOW[turn % FOLLOW.length]], tools: turn >= 1 ? ['write:free', 'breathe'] : [] };
    const r = REPLY[main]; const tools = [...r.tools];
    if (hard[1]) tools.push(REPLY[hard[1]].tools[0]);
    const say = [...r.say];
    if (hard.length > 1) say.splice(1, 0, 'It sounds like several things are piling up at once.');
    return { say, tools: [...new Set(tools)].slice(0, 3) };
  }
  /* Conversations start fresh each mission day (and once for everyone when CHAT_V changes).
     Anything worth keeping can be saved to the journal with "Save to my journal". */
  const CHAT_V = 2;
  const chat = () => {
    const m = data();
    if (!Array.isArray(m.chat) || m.chatV !== CHAT_V || m.chatMd !== state.md) { m.chat = []; m.chatV = CHAT_V; m.chatMd = state.md; }
    return m.chat;
  };
  const GREET = { by: 'bot', say: ['Hello. I am here to listen, help you sort out your thoughts and guide you through short sessions — all without a link to Earth.', 'I am not a psychologist. If something is serious, I will help you reach a person.', 'How are you feeling right now?'], moods: true };

  /* ---------- the journal: a private space to express yourself ---------- */
  const WRITE = {
    free: { icon: 'pen', t: 'Write freely', prompt: 'Whatever is on your mind, in your own words. No one else will read it.' },
    weigh: { icon: 'brain', t: 'What is weighing on me', prompt: 'What happened, what did you feel, and what do you need now?' },
    good: { icon: 'sun', t: 'Three good things', prompt: 'Three things that went well today, however small — and why they happened.' },
    letter: { icon: 'mail', t: 'A letter home', prompt: 'Write to someone you miss. It stays here; you decide later whether to send it.' },
    release: { icon: 'wind', t: 'Write and let go', prompt: 'Get it out of your head. When you finish, let it go — it is not saved anywhere.' },
  };
  const FEEL = ['Calm', 'Grateful', 'Hopeful', 'Tired', 'Sad', 'Anxious', 'Angry', 'Lonely'];
  const journal = () => { const m = data(); m.journal = Array.isArray(m.journal) ? m.journal : []; return m.journal; };

  /* ---------- views ----------
     Mind is drawn with the same parts as the rest of NovaCare: .card + .card-h headers, .tasks rows
     (icon, title, detail, action ›), .mq-opts choices and .ask-sug chips. Nothing moves on hover, so
     every button keeps a steady hit area. */
  const LV = ['l0', 'l1', 'l2', 'l3'];
  const lvName = (l) => ['Steady', 'Worth watching', 'Needs support', 'Talk to someone today'][l];
  const row = (attrs, ic, title, sub, side, cls = '') => `<li class="${cls}"><button ${attrs}><span class="box mind-ic">${icon(ic)}</span><span class="t-main"><b>${title}</b><small>${sub}</small></span><span class="t-side">${side}</span></button></li>`;
  function view() {
    const m = data(); const sg = signal(); const ph = phase(); const s = last(); const cl = climate(); const u = Auth.user();
    const pw = m.pulse[week()];
    const rec = (sg.helps.length ? sg.helps : ['mood']);
    const cmo = u && u.role === 'Crew Medical Officer';
    const talks = Crew.alerts().filter((a) => a.type === 'talk' && state.md - (a.md || 0) <= 14).reverse();
    const todayMood = (state.days[state.md] && state.days[state.md].vals.mood) || null;
    const talking = chat().some((x) => x.by === 'me');
    const total = PROGRAMS.reduce((n, p) => n + p.sessions.length, 0);
    const doneAll = PROGRAMS.reduce((n, p) => n + ((m.programs[p.id] || {}).done || []).length, 0);
    const entries = journal().slice(-3).reverse();
    return `<div class="mind">
      <section class="card mind-now">
        <div class="card-h"><h2>How are you right now?</h2><span class="muted small mind-priv">${icon('lock')}Only you see this page</span></div>
        <p class="muted small">I listen, help you sort out your thoughts and guide short sessions — offline, for when the flight psychologist is 20 light-minutes away.</p>
        <div class="mq-opts five mood-opts" role="group" aria-label="How are you right now?">${MOODS.map(([v, l]) => `<button class="${todayMood === v ? 'on' : ''}" data-act="mindmood" data-v="${v}" aria-pressed="${todayMood === v}"><i class="mdot m${v}" aria-hidden="true"></i>${l}</button>`).join('')}</div>
        <div class="btnrow">
          <button class="btn primary" data-act="mindchat">${icon('chat')}${talking ? 'Continue the conversation' : 'Talk it through'}</button>
          <button class="btn ghost" data-act="mindwrite" data-v="free">${icon('pen')}Write freely</button>
          <button class="btn ghost" data-act="earthwin">${icon('orbit')}Breathe · Window to Earth</button>
        </div>
      </section>
      ${sg.level === 3 ? `<section class="card mind-urgent"><div class="card-h"><h2>${icon('siren')}Please talk to someone today</h2></div><p>If you are having thoughts of hurting yourself, you are not alone and this can get better. Tell a crewmate or the Crew Medical Officer now.</p><div class="btnrow"><button class="btn sos" data-act="help">${icon('siren')}Ask the crew for help now</button><button class="btn ghost" data-act="mindtalk">Ask for a private conversation</button></div></section>` : ''}
      <div class="grid-routine">
        <div class="col">
          <section class="card">
            <div class="card-h"><h2>Guided sessions</h2><span class="muted">${doneAll} of ${total} sessions</span></div>
            <p class="muted small">Four programs of five short sessions (about 5 minutes each), based on cognitive behavioural therapy. Open one and follow the steps.</p>
            <ul class="tasks mind-rows">${PROGRAMS.map((p) => {
              const n = ((m.programs[p.id] || {}).done || []).length; const fin = n >= p.sessions.length;
              const side = fin ? 'Finished' : n ? `Session ${n + 1} of ${p.sessions.length} ›` : 'Start ›';
              return row(`data-act="mindprog" data-id="${p.id}"`, p.icon, p.title, `${p.sub}`, `${side}${rec.includes(p.id) && !fin ? '<em>★ Suggested for you</em>' : `<em>${n} of ${p.sessions.length} sessions</em>`}`, fin ? 'fin' : n ? 'going' : '');
            }).join('')}</ul>
          </section>
          <section class="card">
            <div class="card-h"><h2>A space to express yourself</h2>${journal().length ? `<button class="btn quiet sm" data-act="mindjournal">${icon('file')}My journal · ${journal().length}</button>` : '<span class="muted">Private</span>'}</div>
            <p class="muted small">Write what you feel, in your own words. It stays private, on this device and in your own record.</p>
            <ul class="tasks mind-rows">${Object.entries(WRITE).map(([k, w]) => row(`data-act="mindwrite" data-v="${k}"`, w.icon, w.t, w.prompt, k === 'release' ? 'Not saved ›' : 'Write ›')).join('')}</ul>
            ${entries.length ? `<p class="mind-sub">Latest entries</p><ul class="tasks mind-rows">${entries.map((e) => `<li><button data-act="mindjournal"><span class="box mind-ic">${icon((WRITE[e.kind] || WRITE.free).icon)}</span><span class="t-main"><b>${(WRITE[e.kind] || WRITE.free).t}</b><small translate="no">${esc(e.text.slice(0, 110))}${e.text.length > 110 ? '…' : ''}</small></span><span class="t-side">MD ${e.md}</span></button></li>`).join('')}</ul>` : ''}
          </section>
        </div>
        <div class="col">
          <section class="card mind-state">
            <div class="card-h"><h2>Your state</h2><span class="muted">MD ${state.md} of ${state.missionDays || 180}</span></div>
            <div class="ms-block ${sg.level >= 0 ? LV[sg.level] : 'ln'}">
              <p class="mind-sub">Early warning</p>
              <p class="ms-level"><span class="dot"></span>${sg.level < 0 ? 'Not enough data yet' : lvName(sg.level)}</p>
              ${sg.level < 0 ? '<p class="muted small">Tell me how you are above, log your mood in the daily check-in, or take the weekly check.</p>'
                : sg.reasons.length ? `<ul class="mind-why">${sg.reasons.slice(0, 3).map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : '<p class="muted small">No early signs of low mood, anxiety or poor sleep in your recent data.</p>'}
            </div>
            <div class="ms-block">
              <p class="mind-sub">Weekly check · 2 minutes</p>
              ${s ? `<div class="mind-scores">${scoreTile('Low mood', 'phq', s)}${scoreTile('Anxiety', 'gad', s)}</div><p class="muted small">Last check on MD ${s.md}.</p>` : '<p class="muted small">Four quick questions about the last two weeks, from scales used by doctors worldwide (PHQ and GAD).</p>'}
              <button class="btn ${checkDue() ? 'primary' : 'ghost'} sm" data-act="mindcheck">${icon('checks')}${s ? (checkDue() ? 'Take this week’s check' : 'Check again') : 'Take the check'}</button>
            </div>
            <div class="ms-block">
              <p class="mind-sub">Mission phase</p>
              <p class="ms-level">${esc(ph.name)}</p><p class="muted small">${esc(ph.text)}</p>
            </div>
            <p class="muted small">A signal, not a diagnosis.</p>
          </section>
          <section class="card">
            <div class="card-h"><h2>Crew climate</h2><span class="muted">Week ${week()}</span></div>
            ${cl.score != null ? `<p class="ms-big num">${cl.score}<small>/100</small></p><p class="muted small">Average of ${cl.n} crew answers this week. No one’s individual answers are shown.</p>`
              : `<p class="ms-big num">${cl.n}<small>/3</small></p><p class="muted small">The crew average appears when at least 3 crew members have answered, so no one’s answers can be singled out.</p>`}
            <div class="btnrow"><button class="btn ${pw ? 'ghost' : 'primary'} sm" data-act="mindpulse">${icon('users')}${pw ? 'Change my answer' : 'Answer this week (3 questions)'}</button></div>
          </section>
          <section class="card">
            <div class="card-h"><h2>Talk to someone</h2></div>
            <p class="muted small">You can ask the Crew Medical Officer for a private conversation. Only your name and the request are sent — never your answers or notes.</p>
            <div class="btnrow"><button class="btn ghost sm" data-act="mindtalk">${icon('chat')}Ask for a private conversation</button></div>
            ${cmo ? `<div class="mind-req"><b>Requests to you (last 14 days)</b>${talks.length ? `<ul>${talks.map((a) => `<li><span translate="no">${esc(a.fromName)}</span> · MD ${a.md}${a.note ? ` · <span>${esc(a.note)}</span>` : ''}</li>`).join('')}</ul>` : '<p class="muted small">No requests.</p>'}</div>` : ''}
          </section>
          ${calmHistory()}
        </div>
      </div>
    </div>`;
  }
  function scoreTile(label, kind, s) {
    const full = kind === 'phq' ? s.phqFull : s.gadFull; const v = s[kind]; const b = full ? band(kind, v) : { l: v >= 3 ? 1 : 0, name: v >= 3 ? 'Worth a closer look' : 'No sign' };
    return `<div class="mscore ${LV[b.l]}"><span>${label}</span><b class="num">${v}</b><small>${full ? (kind === 'phq' ? 'PHQ-9 · of 27' : 'GAD-7 · of 21') : (kind === 'phq' ? 'PHQ-2 · of 6' : 'GAD-2 · of 6')}</small><em>${b.name}</em></div>`;
  }
  function calmHistory() {
    const c = data().calm.slice(-4).reverse(); if (!c.length) return '';
    return `<section class="card"><div class="card-h"><h2>Window to Earth</h2><span class="muted">Last sessions</span></div><ul class="calm-list">${c.map((x) => `<li>MD ${x.md} · ${x.min} min · tension ${x.before} → ${x.after}</li>`).join('')}</ul></section>`;
  }

  /* ---------- modals ---------- */
  const sheet = (title, body, cls = '') => `<div class="sheet narrow mind-sheet ${cls}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><header><div><h2>${icon('brain')}${title}</h2></div><button class="x" data-act="close" aria-label="Close">${icon('x')}</button></header><div class="sheet-b one">${body}</div></div>`;
  const qBlock = (kind, i, text, v) => `<div class="mq"><p>${text}</p><div class="mq-opts">${MIND_OPTS.map((o, k) => `<button class="${v === k ? 'on' : ''}" data-act="mindans" data-k="${kind}" data-i="${i}" data-v="${k}">${o}</button>`).join('')}</div></div>`;
  function checkHtml(md) {
    const a = md.ans;
    if (md.step === 'result') return sheet('Weekly check', resultHtml(score({ phq: a.phq, gad: a.gad, md: state.md })));
    const first = [['phq', 0], ['phq', 1], ['gad', 0], ['gad', 1]];
    const more = [...(md.morePhq ? PHQ.map((_, i) => ['phq', i]).slice(2) : []), ...(md.moreGad ? GAD.map((_, i) => ['gad', i]).slice(2) : [])];
    const list = md.step === 'more' ? more : first;
    const ready = list.every(([k, i]) => a[k][i] != null);
    return sheet('Weekly check', `<p class="muted small">Over the last 2 weeks, how often have you been bothered by the following? ${md.step === 'more' ? 'A few more questions, because some answers stood out.' : ''}</p>
      ${list.map(([k, i]) => qBlock(k, i, (k === 'phq' ? PHQ : GAD)[i], a[k][i])).join('')}
      <div class="btnrow end"><button class="btn primary" data-act="mindnext" ${ready ? '' : 'disabled'}>${icon('next')}Continue</button></div>
      <p class="muted small">From the PHQ-9 and GAD-7 questionnaires (Pfizer, free to use). A screening, not a diagnosis.</p>`);
  }
  function resultHtml(s) {
    const bp = s.phqFull ? band('phq', s.phq) : { l: s.phq >= 3 ? 1 : 0 }; const bg = s.gadFull ? band('gad', s.gad) : { l: s.gad >= 3 ? 1 : 0 };
    const top = Math.max(bp.l, bg.l, s.harm ? 3 : 0);
    const next = s.harm ? 'Thoughts of hurting yourself are a medical emergency, not a weakness. Tell a crewmate or the Crew Medical Officer right now — do not stay alone.'
      : top >= 3 ? 'Your answers show a lot of distress. Please talk to the Crew Medical Officer today and request a private conference with the flight psychologist.'
      : top === 2 ? 'Your answers show moderate symptoms. Start the suggested program and request a private conference this week.'
      : top === 1 ? 'Some mild symptoms. A guided program and good sleep usually help — check again next week.'
      : 'No signs of low mood or anxiety right now. Keep your routine — and check again next week.';
    return `<div class="mind-scores">${scoreTile('Low mood', 'phq', s)}${scoreTile('Anxiety', 'gad', s)}</div>
      <p class="mind-next ${LV[top]}">${next}</p>
      ${s.harm || top >= 3 ? `<div class="btnrow"><button class="btn sos" data-act="help">${icon('siren')}Ask the crew for help now</button><button class="btn ghost" data-act="mindtalk">Ask for a private conversation</button></div>` : ''}
      <div class="btnrow end"><button class="btn primary" data-act="mindsave">${icon('check')}Save and close</button></div>
      <p class="muted small">Saved only in your own record. Your crew does not see it.</p>`;
  }
  function progHtml(md) {
    const p = PROG[md.id]; const st = data().programs[p.id] || { done: [], notes: {}, checks: {} }; const i = md.i ?? Math.min(p.sessions.length - 1, (st.done || []).length);
    const s = p.sessions[i]; const key = `${i}`;
    const doHtml = s.do.kind === 'text'
      ? `<label class="mp-l" for="mind-note">${s.do.prompt}</label><textarea id="mind-note" class="text" rows="4" data-mind-note="${p.id}:${key}">${esc((st.notes || {})[key] || '')}</textarea>`
      : `<p class="mp-l">${s.do.prompt}</p><div class="mp-checks">${s.do.items.map((it, k) => `<label><input type="checkbox" data-mind-check="${p.id}:${key}:${k}" ${((st.checks || {})[key] || []).includes(k) ? 'checked' : ''}> <span>${it}</span></label>`).join('')}</div>`;
    return sheet(p.title, `<nav class="mp-steps">${p.sessions.map((x, k) => `<button class="${k === i ? 'on' : ''} ${(st.done || []).includes(k) ? 'done' : ''}" data-act="mindprog" data-id="${p.id}" data-i="${k}" aria-label="Session ${k + 1}">${(st.done || []).includes(k) ? '✓' : k + 1}</button>`).join('')}</nav>
      <p class="eyebrow">Session ${i + 1} of ${p.sessions.length}</p><h3 class="mp-t">${s.t}</h3>
      ${s.learn.map((x) => `<p>${x}</p>`).join('')}
      ${s.review ? reviewHtml(s.review, st) : ''}
      ${s.earth ? `<button class="btn ghost" data-act="earthwin">${icon('orbit')}Practise in the Window to Earth</button>` : ''}
      <div class="mp-do">${doHtml}</div>
      <div class="btnrow end">${i + 1 < p.sessions.length ? `<button class="btn primary" data-act="mindsess" data-id="${p.id}" data-i="${i}">${icon('check')}Session done</button>` : `<button class="btn primary" data-act="mindsess" data-id="${p.id}" data-i="${i}">${icon('star')}Finish the program</button>`}</div>`);
  }
  function reviewHtml(kind, st) {
    const id = kind === 'sleep' ? 'sleep' : 'mood'; const start = st.startMd || state.md;
    const before = avg(series(id, start - 7, start - 1).map((x) => x.v)), since = avg(series(id, start, state.md).map((x) => x.v));
    if (before == null || since == null) return '<p class="muted small">Not enough logged days yet to compare before and during the program.</p>';
    return `<div class="mind-cmp"><div><span>Before</span><b class="num">${r1(before)}</b></div><div><span>During</span><b class="num">${r1(since)}</b></div><small>${id === 'sleep' ? 'average hours of sleep' : 'average mood (of 5)'}</small></div>`;
  }
  function pulseHtml(md) {
    const a = md.ans; const ready = a.every((v) => v != null);
    return sheet('Crew climate', `<p class="muted small">Three questions about this week. The crew only ever sees the average of 3 or more people.</p>
      ${PULSE_Q.map((q, i) => `<div class="mq"><p>${q.q}</p><div class="mq-opts five">${AGREE.map((o, k) => `<button class="${a[i] === k + 1 ? 'on' : ''}" data-act="mindpans" data-i="${i}" data-v="${k + 1}">${o}</button>`).join('')}</div></div>`).join('')}
      <div class="btnrow end"><button class="btn primary" data-act="mindpsave" ${ready ? '' : 'disabled'}>${icon('check')}Save</button></div>`);
  }

  /* Window to Earth: slow breathing (in 4, hold 2, out 6) in front of the turning planet. */
  const BREATH = [['Breathe in', 4], ['Hold', 2], ['Breathe out', 6]];
  let timer = null;
  function windowHtml(md) {
    const rate = (key, v) => `<div class="mq-opts five calm-rate">${[1, 2, 3, 4, 5].map((k) => `<button class="${v === k ? 'on' : ''}" data-act="mindcalm" data-k="${key}" data-v="${k}">${k}</button>`).join('')}</div>`;
    const inner = md.phase === 'run'
      ? `<div class="ew-guide"><div class="ew-ring" id="ew-ring"></div><p class="ew-word" id="ew-word">Breathe in</p><p class="ew-left" id="ew-left"></p></div><div class="btnrow center"><button class="btn ghost light" data-act="mindcalmend">Finish now</button></div>`
      : md.phase === 'after'
        ? `<div class="ew-card"><h3>How tense do you feel now?</h3><p class="muted small">1 = completely calm · 5 = very tense</p>${rate('after', md.after)}
          ${md.after ? `<p class="ew-res">Tension ${md.before} → ${md.after}${md.after < md.before ? ' — well done.' : '.'}</p><div class="btnrow center"><button class="btn primary" data-act="mindcalmsave">${icon('check')}Save and close</button></div>` : ''}</div>`
        : `<div class="ew-card"><h3>Window to Earth</h3><p>Slow breathing with a long out-breath, in front of the planet you are working for. Astronauts describe looking at Earth as one of the strongest sources of calm in flight — the “overview effect”.</p>
          <p class="muted small">How tense do you feel right now? 1 = completely calm · 5 = very tense</p>${rate('before', md.before)}
          <div class="btnrow center">${[1, 3, 5].map((n) => `<button class="btn ${n === 3 ? 'primary' : 'ghost'}" data-act="mindcalmgo" data-v="${n}" ${md.before ? '' : 'disabled'}>${n} min</button>`).join('')}</div></div>`;
    return `<div class="earth-window auth-earth" role="dialog" aria-modal="true" aria-label="Window to Earth"><button class="x" data-act="close" aria-label="Close">${icon('x')}</button>
      <div class="ew-ball earth-ball"><canvas class="earth-spin" width="480" height="480"></canvas></div><div class="ew-over">${inner}</div></div>`;
  }
  function runBreath(md) {
    clearInterval(timer); const t0 = Date.now(); const total = md.min * 60000; const cycle = sum(BREATH.map((b) => b[1])) * 1000;
    const tick = () => {
      if (!ui.modal || ui.modal !== md || md.phase !== 'run') { clearInterval(timer); return; }
      const el = Date.now() - t0; if (el >= total) { clearInterval(timer); md.phase = 'after'; renderModal(); return; }
      let t = el % cycle; let k = 0; while (t >= BREATH[k][1] * 1000) { t -= BREATH[k][1] * 1000; k++; }
      const w = document.getElementById('ew-word'), r = document.getElementById('ew-ring'), left = document.getElementById('ew-left');
      if (w && w.dataset.k !== String(k)) { w.dataset.k = String(k); w.textContent = I18N.t(BREATH[k][0]); if (r) { r.className = 'ew-ring ' + ['in', 'hold', 'out'][k]; r.style.transitionDuration = BREATH[k][1] + 's'; } if (md.voice) Voice.speak(BREATH[k][0]); }
      if (left) { const s = Math.ceil((total - el) / 1000); left.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
    };
    tick(); timer = setInterval(tick, 250);
  }
  /* ---------- the conversation ---------- */
  function toolBtn(t) {
    const [k, v] = t.split(':');
    if (k === 'breathe') return `<button data-act="earthwin">${icon('orbit')}Breathe · Window to Earth</button>`;
    if (k === 'prog' && PROG[v]) return `<button data-act="mindprog" data-id="${v}">${icon(PROG[v].icon)}<span>Guided session:</span> <span>${PROG[v].title}</span></button>`;
    if (k === 'write' && WRITE[v]) return `<button data-act="mindwrite" data-v="${v}">${icon(WRITE[v].icon)}${WRITE[v].t}</button>`;
    if (k === 'talk') return `<button data-act="mindtalk">${icon('chat')}Ask for a private conversation</button>`;
    if (k === 'help') return `<button class="sos" data-act="help">${icon('siren')}Ask the crew for help now</button>`;
    if (k === 'save') return `<button data-act="mindchatsave">${icon('file')}Save to my journal</button>`;
    return '';
  }
  function chatHtml() {
    const msgs = [GREET, ...chat()];
    const body = msgs.map((x) => x.by === 'me'
      ? `<div class="q" translate="no">${esc(x.text)}</div>`
      : `<div class="a ${x.crisis ? 'crisis' : ''}">${x.say.map((t) => `<p>${t}</p>`).join('')}
          ${x.moods ? `<div class="mq-opts five mood-opts">${MOODS.map(([v, l]) => `<button data-act="mindmood" data-v="${v}"><i class="mdot m${v}" aria-hidden="true"></i>${l}</button>`).join('')}</div>` : ''}
          ${(x.tools || []).length ? `<div class="ask-sug mind-tools">${x.tools.map(toolBtn).join('')}</div>` : ''}</div>`).join('');
    return `<div class="sheet narrow mind-sheet mind-chat" role="dialog" aria-modal="true" aria-label="Talk it through"><header><div><h2>${icon('chat')}Talk it through</h2><p class="muted small">Private · works offline · not a diagnosis</p></div>
        ${chat().length ? `<button class="btn quiet sm" data-act="mindchatnew">Start over</button>` : ''}<button class="x" data-act="close" aria-label="Close">${icon('x')}</button></header>
      <div class="sheet-b one"><div class="chat" id="mind-chat-log" aria-live="polite">${body}</div>
        <form id="mind-chat-form" class="ask-row" autocomplete="off"><textarea class="text" name="q" id="mind-chat-q" rows="2" maxlength="1500" placeholder="${esc(I18N.t('Write how you feel or what is on your mind…'))}" aria-label="${esc(I18N.t('Your message'))}"></textarea><button class="btn primary" type="submit">${icon('next')}Send</button></form>
        <p class="muted small">If you have thoughts of hurting yourself, tell a crewmate or the Crew Medical Officer now.</p></div></div>`;
  }

  /* ---------- writing ---------- */
  function writeHtml(md) {
    const w = WRITE[md.kind] || WRITE.free;
    if (md.done) {
      const r = md.kind === 'release' ? { say: ['It is out of your head now, and it was not stored anywhere.', 'Take one slow breath out before you go back.'], tools: ['breathe'] } : md.reply;
      return sheet(w.t, `<div class="wr-done">${icon(md.kind === 'release' ? 'wind' : 'check')}<h3>${md.kind === 'release' ? 'Let go' : 'Saved in your private journal'}</h3>${r.say.map((t) => `<p>${t}</p>`).join('')}</div>
        ${(r.tools || []).length ? `<div class="ask-sug mind-tools">${r.tools.map(toolBtn).join('')}</div>` : ''}
        <div class="btnrow end"><button class="btn ghost" data-act="mindwrite" data-v="${md.kind}">${icon('pen')}Write again</button><button class="btn primary" data-act="close">${icon('check')}Done</button></div>`);
    }
    return sheet(w.t, `<p class="muted">${w.prompt}</p>
      <nav class="ask-sug" aria-label="Ways to write">${Object.entries(WRITE).map(([k, x]) => `<button class="${k === md.kind ? 'on' : ''}" data-act="mindwrite" data-v="${k}" data-keep="1">${x.t}</button>`).join('')}</nav>
      <textarea id="mind-write" class="text wr-area ${md.kind === 'release' ? 'rel' : ''}" rows="9" maxlength="4000" aria-label="${esc(I18N.t(w.t))}" placeholder="${esc(I18N.t('Start writing…'))}">${esc(md.text || '')}</textarea>
      ${md.kind === 'release' ? '' : `<p class="mp-l">How do you feel? <span class="muted small">(optional)</span></p><div class="ask-sug">${FEEL.map((f) => `<button class="${md.feel.includes(f) ? 'on' : ''}" data-act="mindfeel" data-v="${f}">${f}</button>`).join('')}</div>`}
      <div class="btnrow end"><button class="btn primary" data-act="mindwritesave">${icon(md.kind === 'release' ? 'wind' : 'check')}${md.kind === 'release' ? 'Let it go' : 'Save'}</button></div>
      <p class="muted small">${md.kind === 'release' ? 'Nothing you write here is kept.' : 'Only you can read it. Your crew never sees it.'}</p>`);
  }
  function journalHtml(md) {
    const list = journal().slice().reverse();
    return sheet('My journal', list.length ? `<p class="muted small">${list.length} entries · only you can read them.</p><ul class="jr-list">${list.map((e) => `<li>
        <header><b>${(WRITE[e.kind] || WRITE.free).t}</b><small>MD ${e.md}</small>${md.del === e.id
          ? `<button class="btn sos sm" data-act="mindjdel" data-id="${e.id}" data-ok="1">Delete for good</button><button class="btn quiet sm" data-act="mindjdel" data-id="">Keep</button>`
          : `<button class="btn quiet sm" data-act="mindjdel" data-id="${e.id}">Delete</button>`}</header>
        ${(e.feel || []).length ? `<p class="jr-feel">${e.feel.map((f) => `<span>${f}</span>`).join('')}</p>` : ''}
        <p class="jr-x" translate="no">${esc(e.text)}</p></li>`).join('')}</ul>`
      : `<p class="muted">Your journal is empty. Writing for a few minutes helps to put feelings in order.</p><div class="btnrow"><button class="btn primary" data-act="mindwrite" data-v="free">${icon('pen')}Write freely</button></div>`);
  }

  /* ---------- asking the Crew Medical Officer for a private conversation ---------- */
  function talkHtml(md) {
    const u = Auth.user();
    if (!u || !u.crew) return sheet('Talk to someone', `<p>Join a mission first to reach your Crew Medical Officer.</p><p class="muted small">Meanwhile you can talk it through here or write in your journal.</p>
      <div class="btnrow end"><button class="btn ghost" data-act="mindchat">${icon('chat')}Talk it through</button><button class="btn primary" data-act="mindmission">${icon('rocket')}Choose a mission</button></div>`);
    if (md.sent) return sheet('Talk to someone', `<div class="wr-done">${icon('check')}<h3>Request sent to the Crew Medical Officer</h3><p>They will look for a quiet moment with you. Only your name and when you would like to talk were shared.</p></div>
      <div class="btnrow end"><button class="btn primary" data-act="close">${icon('check')}Done</button></div>`);
    const prev = Crew.alerts().filter((a) => a.type === 'talk' && a.fromId === u.id && state.md - (a.md || 0) <= 7).pop();
    const WHEN = ['Today', 'In the next days', 'Whenever suits'];
    return sheet('Talk to someone', `<p>Ask the Crew Medical Officer for a private conversation. Only your name and when you would like to talk are sent — never your answers or notes.</p>
      ${prev ? `<p class="muted small">You already asked on MD ${prev.md}. You can ask again.</p>` : ''}
      <p class="mp-l">When would you like to talk?</p>
      <div class="ask-sug">${WHEN.map((w) => `<button class="${md.when === w ? 'on' : ''}" data-act="mindtalkwhen" data-v="${w}">${w}</button>`).join('')}</div>
      <div class="btnrow end"><button class="btn ghost" data-act="close">Not now</button><button class="btn primary" data-act="mindtalksend">${icon('chat')}Send the request</button></div>`);
  }
  function modal(md) {
    if (md.type === 'mindcheck') return checkHtml(md);
    if (md.type === 'mindprog') return progHtml(md);
    if (md.type === 'mindpulse') return pulseHtml(md);
    if (md.type === 'earthwin') return windowHtml(md);
    if (md.type === 'mindchat') return chatHtml(md);
    if (md.type === 'mindwrite') return writeHtml(md);
    if (md.type === 'mindjournal') return journalHtml(md);
    if (md.type === 'mindtalk') return talkHtml(md);
    return '';
  }
  const isModal = (t) => ['mindcheck', 'mindprog', 'mindpulse', 'earthwin', 'mindchat', 'mindwrite', 'mindjournal', 'mindtalk'].includes(t);
  function afterRender(md) {
    if (!md) return;
    if (md.type === 'earthwin') { Earth.spin(document.getElementById('modal')); if (md.phase === 'run' && !md.running) { md.running = true; runBreath(md); } }
    if (md.type === 'mindchat') { const log = document.getElementById('mind-chat-log'); if (log) log.scrollTop = log.scrollHeight; const q = document.getElementById('mind-chat-q'); if (q && !matchMedia('(pointer: coarse)').matches) q.focus(); }
    if (md.type === 'mindwrite' && !md.done) { const t = document.getElementById('mind-write'); if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); } }
  }

  /* ---------- actions ---------- */
  const save = () => Engine.save();
  const actions = {
    mindgo() { ui.modal = null; ui.view = 'personal'; ui.sub = 'mind'; render(); window.scrollTo(0, 0); },
    mindcheck() { ui.modal = { type: 'mindcheck', step: 'first', ans: { phq: Array(9).fill(null), gad: Array(7).fill(null) } }; renderModal(); },
    mindans(d) { const md = ui.modal; md.ans[d.k][+d.i] = +d.v; renderModal(); },
    mindnext() {
      const md = ui.modal; const a = md.ans;
      if (md.step === 'first') {
        md.morePhq = a.phq[0] + a.phq[1] >= 3; md.moreGad = a.gad[0] + a.gad[1] >= 3;
        md.step = md.morePhq || md.moreGad ? 'more' : 'result';
      } else md.step = 'result';
      renderModal();
    },
    mindsave() {
      const md = ui.modal; const a = md.ans;
      data().checks.push({ at: new Date().toISOString(), md: state.md, phq: md.morePhq ? a.phq : a.phq.slice(0, 2), gad: md.moreGad ? a.gad : a.gad.slice(0, 2) });
      save(); ui.modal = null; render(); toast('Check saved — only you can see it');
    },
    mindprog(d) { const m = data(); if (!m.programs[d.id]) { m.programs[d.id] = { startMd: state.md, done: [], notes: {}, checks: {} }; save(); } ui.modal = { type: 'mindprog', id: d.id, i: d.i != null ? +d.i : undefined }; renderModal(); },
    mindsess(d) {
      const st = data().programs[d.id]; const i = +d.i; if (!st.done.includes(i)) st.done.push(i); save();
      const p = PROG[d.id];
      if (i + 1 < p.sessions.length) { ui.modal = { type: 'mindprog', id: d.id, i: i + 1 }; renderModal(); toast('Session saved'); }
      else { ui.modal = null; render(); toast(`Program finished: ${I18N.t(p.title)}`); }
    },
    mindpulse() { const p = data().pulse[week()]; ui.modal = { type: 'mindpulse', ans: p ? [...p.a] : [null, null, null] }; renderModal(); },
    mindpans(d) { ui.modal.ans[+d.i] = +d.v; renderModal(); },
    mindpsave() { data().pulse[week()] = { a: ui.modal.ans, at: new Date().toISOString() }; save(); ui.modal = null; Crew.refresh(true); render(); toast('Thank you — only the crew average is ever shown'); },
    mindtalk() { ui.modal = { type: 'mindtalk', when: 'In the next days' }; renderModal(); },
    mindtalkwhen(d) { ui.modal.when = d.v; renderModal(); },
    mindtalksend() { const md = ui.modal; Crew.record(null, 'talk', md.when || ''); md.sent = true; render(); toast('Request sent to the Crew Medical Officer'); },
    mindmission() { ui.modal = null; ui.view = 'mission'; render(); window.scrollTo(0, 0); },
    mindchat() { ui.modal = { type: 'mindchat' }; renderModal(); },
    mindchatnew() { data().chat = []; save(); renderModal(); },
    mindchatsave() {
      const lines = chat().map((x) => (x.by === 'me' ? '— ' + x.text : '')).filter(Boolean);
      if (!lines.length) { toast('Write something first'); return; }
      journal().push({ id: 'j' + Date.now().toString(36), at: new Date().toISOString(), md: state.md, kind: 'free', text: lines.join('\n').slice(0, 4000), feel: [] });
      save(); toast('Saved in your private journal');
    },
    mindmood(d) {
      const v = +d.v; const day = Engine.today(); const had = day.vals.mood;
      day.vals.mood = v; save(); if (typeof Crew !== 'undefined' && Crew.refresh) Crew.refresh(true);
      const say = v <= 2 ? ['I am sorry it is a hard moment. I am here with you.', 'What is weighing on you most right now?']
        : v === 3 ? ['Thank you. Some days are just in the middle.', 'What is on your mind today?']
          : ['Good to hear.', 'What is going well? Naming it helps it stay.'];
      say.push(had != null && had !== v ? 'I updated your mood for today.' : 'I saved this as your mood for today.');
      chat().push({ by: 'me', text: I18N.t(MOODS[v - 1][1]), at: Date.now() }, { by: 'bot', say, tools: v <= 2 ? ['breathe'] : v >= 4 ? ['write:good'] : [] });
      trim(); save(); ui.modal = { type: 'mindchat' }; render();
    },
    mindwrite(d) {
      const prev = ui.modal && ui.modal.type === 'mindwrite' && !ui.modal.done && d.keep ? ui.modal : null;
      ui.modal = { type: 'mindwrite', kind: WRITE[d.v] ? d.v : 'free', text: prev ? prev.text : '', feel: prev ? prev.feel : [] }; renderModal();
    },
    mindfeel(d) { const md = ui.modal; md.feel = md.feel.includes(d.v) ? md.feel.filter((x) => x !== d.v) : [...md.feel, d.v]; renderModal(); },
    mindwritesave() {
      const md = ui.modal; const el = document.getElementById('mind-write'); const text = String((el ? el.value : md.text) || '').trim();
      if (!text) { toast('Write something first'); if (el) el.focus(); return; }
      if (md.kind !== 'release') {
        journal().push({ id: 'j' + Date.now().toString(36), at: new Date().toISOString(), md: state.md, kind: md.kind, text: text.slice(0, 4000), feel: md.feel });
        if (journal().length > 300) journal().splice(0, journal().length - 300);
        save();
        const r = reply(text, 1); md.reply = r.crisis ? r : { say: [r.say[0]].concat(r.tools.length ? ['If it helps, here is something you can do next.'] : []), tools: r.tools.filter((t) => t !== 'write:' + md.kind) };
      }
      md.text = ''; md.done = true; render();
    },
    mindjournal() { ui.modal = { type: 'mindjournal' }; renderModal(); },
    mindjdel(d) {
      const md = ui.modal;
      if (d.ok) { data().journal = journal().filter((e) => e.id !== d.id); save(); md.del = null; toast('Entry deleted'); }
      else md.del = d.id || null;
      render();
    },
    earthwin() { const back = ui.modal && ['mindchat', 'mindprog'].includes(ui.modal.type) ? ui.modal : null; ui.modal = { type: 'earthwin', phase: 'start', before: null, after: null, back }; renderModal(); },
    mindcalm(d) { ui.modal[d.k] = +d.v; renderModal(); },
    mindcalmgo(d) { const md = ui.modal; md.min = +d.v; md.phase = 'run'; md.running = false; md.voice = !!(md.voice); renderModal(); },
    mindcalmend() { const md = ui.modal; clearInterval(timer); md.min = Math.max(1, Math.round(md.min / 2)); md.phase = 'after'; renderModal(); },
    mindcalmsave() { const md = ui.modal; data().calm.push({ at: new Date().toISOString(), md: state.md, min: md.min, before: md.before, after: md.after }); save(); ui.modal = md.back || null; render(); toast('Session saved'); },
  };

  const trim = () => { const c = chat(); if (c.length > 80) c.splice(0, c.length - 80); };
  function send(text) {
    text = String(text || '').trim().slice(0, 1500); if (!text) return;
    const turn = chat().filter((x) => x.by === 'me').length;
    const r = reply(text, turn);
    if (turn >= 2 && !r.crisis && !chat().some((x) => (x.tools || []).includes('save'))) { r.say = [...r.say, 'Whenever you want, you can save what you wrote here in your private journal.']; r.tools = [...r.tools, 'save']; }
    chat().push({ by: 'me', text, at: Date.now() }, { by: 'bot', say: r.say, tools: r.tools, crisis: !!r.crisis });
    trim(); save(); renderModal();
  }
  document.addEventListener('submit', (ev) => {
    if (ev.target.id !== 'mind-chat-form') return; ev.preventDefault(); send(new FormData(ev.target).get('q'));
  });
  document.addEventListener('keydown', (ev) => { // Enter sends, Shift+Enter makes a new line
    if (ev.target.id === 'mind-chat-q' && ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) { ev.preventDefault(); send(ev.target.value); }
  });
  document.addEventListener('input', (ev) => { if (ev.target.id === 'mind-write' && ui.modal && ui.modal.type === 'mindwrite') ui.modal.text = ev.target.value; });

  // notes and checklists inside a program are saved as you type
  let noteT;
  document.addEventListener('input', (ev) => {
    const t = ev.target; if (!t || !t.dataset || !t.dataset.mindNote || !state) return;
    const [id, k] = t.dataset.mindNote.split(':'); const st = data().programs[id]; if (!st) return;
    st.notes = st.notes || {}; st.notes[k] = t.value.slice(0, 2000); clearTimeout(noteT); noteT = setTimeout(save, 500);
  });
  document.addEventListener('change', (ev) => {
    const t = ev.target; if (!t || !t.dataset || !t.dataset.mindCheck || !state) return;
    const [id, k, i] = t.dataset.mindCheck.split(':'); const st = data().programs[id]; if (!st) return;
    st.checks = st.checks || {}; const arr = new Set(st.checks[k] || []); if (t.checked) arr.add(+i); else arr.delete(+i); st.checks[k] = [...arr]; save();
  });

  return { view, modal, isModal, afterRender, actions, share, signal, last, checkDue, phase, PROGRAMS };
})();
