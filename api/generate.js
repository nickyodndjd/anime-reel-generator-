// api/generate.js
// Vercel serverless function: calls OpenAI using server-side env var OPENAI_API_KEY
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { anime, scene, count = 3, mode = 'ideas' } = req.body || {};
    if (!anime || !scene) return res.status(400).json({ error: 'Missing anime or scene' });

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return res.status(500).json({ error: 'Server missing OPENAI_API_KEY' });

    const n = Math.max(1, Math.min(10, Number(count)));
    const prompt =
      mode === 'voice'
        ? `Write ${n} short voice-over lines (1-2 sentences each) for a ${scene} scene of the anime "${anime}". Keep them punchy for short reels. Return as JSON array of strings.`
        : `Create ${n} anime reel ideas for anime "${anime}" with scene "${scene}". For each return JSON object: { "dialogue": short line, "caption": short caption <=10 words, "hashtags": ["#..."], "music": "short suggestion" } and return JSON array.`;

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a JSON-only assistant. Output only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 700
      })
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(502).json({ error: 'OpenAI error', detail: text });
    }

    const data = await r.json();
    const assistant = data?.choices?.[0]?.message?.content || '';
    try {
      const parsed = JSON.parse(assistant);
      return res.json({ ok: true, result: parsed });
    } catch (e) {
      // If assistant returned non-JSON, send raw response
      return res.json({ ok: true, raw: assistant });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
