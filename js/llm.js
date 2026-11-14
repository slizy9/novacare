/* NOVACARE — optional small local language model, for wording only.

   Runs on the ship's terminal with docker-compose (Ollama, no internet). It never decides anything:
   - medication questions are answered by the rules engine and never sent to it;
   - for everything else it only rephrases the onboard protocols that the local search found,
     must cite them as [KB-…], and must answer "No onboard protocol — escalate" when they do not cover
     the question. If it is not running, NovaCare answers with the protocol text directly. */

const LocalLLM = (() => {
  const cfg = typeof NOVACARE_CONFIG !== 'undefined' ? NOVACARE_CONFIG : {};
  // Default: only on the ship terminal (localhost). The public website never calls a model.
  const url = cfg.LLM_URL !== undefined ? cfg.LLM_URL : (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'http://localhost:11434' : '');
  const model = cfg.LLM_MODEL || 'qwen2.5:1.5b';
  let ok = null;
  const timeout = (ms) => (typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined);
  async function ping() {
    if (!url) return (ok = false);
    try { const r = await fetch(url + '/api/tags', { signal: timeout(2500) }); const j = await r.json(); ok = (j.models || []).some((m) => m.name === model || m.name.startsWith(model.split(':')[0] + ':')); }
    catch (e) { ok = false; }
    return ok;
  }
  const SYSTEM = `You are the language layer of NovaCare, an offline crew health assistant on a spacecraft.
Rules you must follow:
1. Use ONLY the SOURCES given. Do not add medical facts, doses or procedures that are not in them.
2. Cite every statement with its source id in square brackets, e.g. [KB-MED-01].
3. If the SOURCES do not answer the question, reply exactly: "No onboard protocol for this — escalate to the Crew Medical Officer or ground."
4. Never recommend or dose a medicine. Medication decisions are made by the rules engine, not by you.
5. Be brief and calm: 2–5 short sentences, then the steps as a short list if useful. Answer in the language of the question.`;
  /** Rephrase the protocols for this question. Returns text, or null if the model is unavailable. */
  async function phrase(question, entries, person) {
    if (!ok) return null;
    const sources = entries.map((e) => `[KB-${e.id}] ${e.title}\n${e.a}\nSteps: ${e.steps.join(' | ')}\nEscalate: ${e.esc}`).join('\n\n');
    try {
      const r = await fetch(url + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: timeout(30000),
        body: JSON.stringify({ model, stream: false, options: { temperature: 0.1 }, messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: `SOURCES:\n${sources}\n\nAsked by: ${person.me ? 'the crew member about themself' : 'a crewmate about ' + person.name}\nQUESTION: ${question}` }] }) });
      const j = await r.json(); const text = j && j.message && j.message.content ? j.message.content.trim() : '';
      return text || null;
    } catch (e) { return null; }
  }
  return { url, model, ping, phrase, ready: () => !!ok, configured: () => !!url };
})();
