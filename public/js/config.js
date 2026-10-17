/**
 * ARI - Gemini AI Client + Scraper
 */

const WORKER_KEY = 'ari_worker_url';

const DEFAULT_WORKER_URL = 'https://lingering-silence-02a9.m-fakhirrizal.workers.dev';

const Gemini = {
  getUrl() {
    // Priority: localStorage (if user overrides) > hardcoded default
    return localStorage.getItem(WORKER_KEY) || DEFAULT_WORKER_URL;
  },
  setUrl(u) {
    u = (u || '').trim().replace(/\/$/, '');
    if (u && !/^https?:\/\//i.test(u)) u = 'https://' + u;
    localStorage.setItem(WORKER_KEY, u);
    return u;
  },
  isConfigured() { return !!this.getUrl(); },

  logAI(operation, model, customer, status, details, durationMs) {
    try {
      ARIDB.exec(
        `INSERT INTO ai_log(time,operation,model,customer,status,details,duration_ms) VALUES(?,?,?,?,?,?,?)`,
        [new Date().toISOString(), operation, model || 'gemini-3.8-flash', customer || '-', status, details || '', durationMs || 0]
      );
    } catch (e) { console.warn('AI log failed:', e); }
  },

  async explainRisk(customer, riskResult) {
    if (!this.isConfigured())
      return { success: false, error: 'Worker URL is not configured.' };

    const t0 = performance.now();
    
    // English system prompt
    const systemPrompt = `You are an accounts receivable risk analyst for a truck rental company. 
Answer in professional and easy-to-understand English. 
Use ONLY the provided data. Do not fabricate numbers. 
If data is insufficient, state "insufficient data". 
The risk score is a rule-based priority index, NOT a probability of default.`;

    // English user prompt
    const userPrompt = `Analyze the following customer risk (max 150 words):

Customer: ${customer.name}
Contract: ${customer.contract}
On-Time Rate: ${customer.rate}%
Delay Trend: ${customer.delay ?? 'N/A'} days
Exposure Growth: ${customer.growth}%
Exposure: IDR ${Number(customer.exposure).toLocaleString('en-US')}

Risk Score: ${riskResult.value}/100 · ${riskResult.level}
Components: Payment=${riskResult.components?.[0]}, Delay=${riskResult.components?.[1]}, Growth=${riskResult.components?.[2]}

Provide:
1. Main factors driving the score
2. Specific collection recommendation
3. Note that the final decision requires human review`;

    try {
      const res = await fetch(`${this.getUrl()}/api/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt, systemInstruction: systemPrompt, temperature: 0.3 }),
      });
      const data = await res.json();
      const dur = Math.round(performance.now() - t0);
      if (!data.success) throw new Error(data.error || 'Gemini error');
      this.logAI('explain_risk', data.model, customer.name, 'success', 'Risk explanation generated', dur);
      return { success: true, text: data.text, model: data.model, duration: dur };
    } catch (err) {
      this.logAI('explain_risk', null, customer.name, 'error', err.message, Math.round(performance.now() - t0));
      return { success: false, error: err.message };
    }
  },

  async healthCheck() {
    if (!this.isConfigured()) return { ok: false, error: 'URL is not set' };
    try {
      const res = await fetch(`${this.getUrl()}/api/health`);
      const data = await res.json();
      return { ok: res.ok, data };
    } catch (err) { return { ok: false, error: err.message }; }
  },
};

const Scraper = {
  async fetchEvidence(customerName, onProgress) {
    const url = Gemini.getUrl();
    if (!url) return { success: false, error: 'Worker URL is not configured.' };

    const t0 = performance.now();
    if (onProgress) onProgress('Contacting Gemini AI...');

    try {
      const res = await fetch(`${url}/api/gemini-scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName }),
      });
      const data = await res.json();
      const dur = Math.round(performance.now() - t0);
      if (!data.success) throw new Error(data.error || 'Gemini scraping failed');

      data.evidence.forEach(ev => {
        ARIDB.exec(
          `INSERT INTO scrape_log(time,customer,source,status,details) VALUES(?,?,?,?,?)`,
          [new Date().toISOString(), customerName,
           (ev.source_name || ev.source_id || 'Gemini') + ' [Gemini]',
           ev.error ? 'ERROR' : 'OK',
           ev.event || ev.error || '']
        );
      });

      Gemini.logAI(
        'gemini_scrape',
        data.model || 'gemini-3.8-flash',
        customerName,
        'success',
        `${data.evidence.length} evidence, mode: ${data.mode || 'unknown'}`,
        dur
      );

      return {
        success: true,
        evidence: data.evidence,
        total: data.evidence.length,
        mode: data.mode,
        model: data.model,
        duration: dur,
      };
    } catch (err) {
      Gemini.logAI('gemini_scrape', null, customerName, 'error', err.message, Math.round(performance.now() - t0));
      return { success: false, error: err.message };
    }
  },

  scoreExternal(evidenceList) {
    const srcs = ARIDB.query('SELECT * FROM sources');
    const ok = new Set(srcs.filter(s => s.approved === 1 && s.available === 1).map(s => s.id));
    const elig = evidenceList.filter(e =>
      ok.has(e.source_id) && e.verified === 1 && e.match_status === 'Matched' &&
      e.confidence === 'High' && e.score);
    if (!elig.length) return { value: null, level: 'Insufficient', evidence: [] };

    const scored = elig.map(e => {
      let arr; try { arr = JSON.parse(e.score); } catch { arr = null; }
      if (!Array.isArray(arr) || arr.length !== 4) return null;
      const v = Math.round((arr[0]*0.35 + arr[1]*0.30 + arr[2]*0.25 + arr[3]*0.10)*10)/10;
      return { ...e, externalScore: v };
    }).filter(Boolean).sort((a, b) => b.externalScore - a.externalScore);

    if (!scored.length) return { value: null, level: 'Insufficient', evidence: elig };
    const best = scored[0];
    return { value: best.externalScore, level: best.externalScore>=60?'Red':best.externalScore>=30?'Yellow':'Green', evidence: elig, best };
  },
};

window.ARIGemini = Gemini;
window.ARIScraper = Scraper;