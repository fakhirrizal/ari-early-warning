/**
 * ARI Worker · Gemini AI + Web Scraping
 * Endpoint:
 *   POST /api/gemini         → generic Gemini proxy
 *   POST /api/gemini-scrape  → Gemini-powered external evidence search
 *   GET  /api/health         → health check
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const url = new URL(request.url);
    try {
      if (url.pathname === '/api/gemini' && request.method === 'POST') return handleGemini(request, env);
      if (url.pathname === '/api/gemini-scrape' && request.method === 'POST') return handleGeminiScrape(request, env);
      if (url.pathname === '/api/health') return json({ status: 'ok', service: 'ARI Proxy', gemini: !!env.GEMINI_API_KEY, timestamp: new Date().toISOString() });
      return json({ error: 'Not found' }, 404);
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  },
};

// =================== GENERIC GEMINI PROXY ===================
async function handleGemini(request, env) {
  const body = await request.json();
  const { prompt, systemInstruction, temperature = 0.3 } = body;
  if (!prompt) return json({ error: 'prompt required' }, 400);
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) return json({ error: 'GEMINI_API_KEY not configured' }, 500);

  // Ensure the model name is correct. If gemini-3.8-flash throws an error, 
  // change this to 'gemini-1.5-flash' or 'gemini-2.0-flash'
  const model = 'gemini-3.8-flash'; 
  
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature, maxOutputTokens: 1024 },
  };
  if (systemInstruction) payload.systemInstruction = { parts: [{ text: systemInstruction }] };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
  );
  const data = await res.json();
  if (!res.ok) return json({ error: data.error?.message || 'Gemini error', details: data }, res.status);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return json({ success: true, text, model, usage: data.usageMetadata || {} });
}

// =================== GEMINI-POWERED SCRAPING ===================
async function handleGeminiScrape(request, env) {
  const { customerName } = await request.json();
  if (!customerName) return json({ error: 'customerName required' }, 400);
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) return json({ error: 'GEMINI_API_KEY not configured' }, 500);

  const model = 'gemini-3.8-flash';

  // ---------- Attempt 1: Gemini with Google Search grounding ----------
  try {
    const grounded = await geminiWithSearch(customerName, apiKey, model);
    if (grounded.ok && grounded.evidence.length > 0) {
      return json({
        success: true,
        customer: customerName,
        mode: 'google_search_grounding',
        model,
        evidence: grounded.evidence,
        total: grounded.evidence.length,
        scraped_at: new Date().toISOString(),
      });
    }
    console.log('Search grounding not available or empty, falling back to analysis mode');
  } catch (e) {
    console.log('Search grounding failed:', e.message);
  }

  // ---------- Attempt 2: Simulated data + Gemini analysis ----------
  try {
    const analyzed = await geminiAnalysis(customerName, apiKey, model);
    return json({
      success: true,
      customer: customerName,
      mode: 'gemini_analysis',
      model,
      evidence: analyzed,
      total: analyzed.length,
      scraped_at: new Date().toISOString(),
    });
  } catch (e) {
    return json({ error: 'Gemini scraping failed: ' + e.message }, 500);
  }
}

async function geminiWithSearch(customerName, apiKey, model) {
  const prompt = `You are a risk analyst for a truck rental company in Indonesia.

Search for RECENT public information about the company named "${customerName}" regarding:
1. Legal status: bankruptcy (PKPU), lawsuits, or court proceedings (source: SIPP, Supreme Court directory)
2. Financial condition: liquidity issues, financial reports, IDX disclosures
3. Operational disruptions: schedule changes, disruptions, official company announcements
4. Industry conditions: slowdown in the transportation/logistics sector

Format the output as a JSON array ONLY (no markdown fences), with the following structure:
[
  {
    "event": "Short title of the event (in English)",
    "category": "LEGAL|FINANCIAL|OPERATIONAL|INDUSTRY",
    "severity": "Low|Medium|High",
    "summary": "1-2 sentence summary (in English)",
    "source_url": "URL of the source if available",
    "confidence": 0.0-1.0,
    "published_date": "YYYY-MM-DD",
    "score": [L, F, O, I]
  }
]
Where score[0..3] is a score from 0-100 for Legal, Financial, Operational, and Industry factors.

If there is no relevant verifiable information, return an empty array [].`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    tools: [{ google_search: {} }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Search API failed');

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Extract grounding sources if provided
  const grounding = data.candidates?.[0]?.groundingMetadata || {};
  const sources = (grounding.groundingChunks || []).map(c => c.web?.uri).filter(Boolean);

  const evidence = parseEvidenceJSON(text, sources);
  return { ok: true, evidence };
}

async function geminiAnalysis(customerName, apiKey, model) {
  const prompt = `You are a risk analyst for a truck rental company in Indonesia.

Based on your knowledge of the company named "${customerName}", classify external risks across 4 categories:
- LEGAL: bankruptcy (PKPU), lawsuits
- FINANCIAL: liquidity pressure / financial distress
- OPERATIONAL: operational disruptions
- INDUSTRY: transportation/logistics industry conditions

Return a JSON array ONLY (no markdown fences) with the 1-3 most relevant evidence items:
[
  {
    "event": "Short description (in English)",
    "category": "LEGAL|FINANCIAL|OPERATIONAL|INDUSTRY",
    "severity": "Low|Medium|High",
    "summary": "1-2 sentence explanation (in English). Mention that this is an AI analysis based on the company name.",
    "source_url": "https://... (general reference)",
    "confidence": 0.0-1.0,
    "published_date": "${new Date().toISOString().slice(0,10)}",
    "score": [L, F, O, I]
  }
]

If there is not enough information to assess, return an array with 1 evidence item categorized as "INDUSTRY" severity "Low" confidence 0.5, with a summary stating that data is insufficient and requires manual verification.`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 1536 },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Analysis API failed');

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return parseEvidenceJSON(text, []);
}

/**
 * Parse Gemini response text → array of evidence objects.
 * Handles various JSON formats: raw array, markdown-fenced, or JSON embedded in prose.
 */
function parseEvidenceJSON(text, sources = []) {
  // Strip markdown fences
  let cleaned = text.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  // Find first [ ... ] block if there is prose
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    cleaned = cleaned.slice(firstBracket, lastBracket + 1);
  }

  let arr;
  try { arr = JSON.parse(cleaned); }
  catch (e) {
    console.warn('Failed to parse Gemini JSON:', e.message, '| text:', text.slice(0, 200));
    return [];
  }

  if (!Array.isArray(arr)) return [];

  return arr.map((item, i) => {
    const validCats = ['LEGAL','FINANCIAL','OPERATIONAL','INDUSTRY'];
    const cat = validCats.includes(item.category) ? item.category : 'INDUSTRY';
    const sev = ['Low','Medium','High'].includes(item.severity) ? item.severity : 'Low';

    // Map category → source_id
    const srcMap = { LEGAL: 'SRC-01', FINANCIAL: 'SRC-02', OPERATIONAL: 'SRC-03', INDUSTRY: 'SRC-04' };

    // Ensure score is 4-length array
    let score = Array.isArray(item.score) && item.score.length === 4
      ? item.score.map(x => Math.max(0, Math.min(100, Number(x) || 0)))
      : cat === 'LEGAL'   ? [70, 50, 50, 30]
      : cat === 'FINANCIAL' ? [20, 70, 40, 30]
      : cat === 'OPERATIONAL' ? [10, 30, 70, 30]
      :                       [10, 20, 30, 60];

    const conf = typeof item.confidence === 'number'
      ? item.confidence
      : item.confidence === 'High' ? 0.9
      : item.confidence === 'Medium' ? 0.7
      : 0.5;

    return {
      id: `EV-GM-${Date.now()}-${i}`,
      source_id: srcMap[cat],
      source_name: `Gemini · ${cat}`,
      customer_name: item.customer_name || '',
      event: String(item.event || 'External signal').slice(0, 200),
      category: cat,
      severity: sev,
      summary: String(item.summary || '').slice(0, 800),
      url: item.source_url || sources[i] || '',
      confidence: conf >= 0.8 ? 'High' : conf >= 0.6 ? 'Medium' : 'Low',
      published_at: item.published_date || new Date().toISOString().slice(0,10),
      first_available_at: new Date().toISOString().slice(0,10),
      retrieved_at: new Date().toISOString(),
      score,
      ai_provider: 'gemini',
    };
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}