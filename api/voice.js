// api/voice.js
// Vercel serverless function: converts text -> audio using ElevenLabs (proxy).
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { text, voice = 'alloy' } = req.body || {};
    if (!text) return res.status(400).json({ error: 'Missing text' });

    const key = process.env.ELEVENLABS_KEY;
    if (!key) return res.status(500).json({ error: 'Server missing ELEVENLABS_KEY' });

    // Note: adjust voice id or endpoint as per ElevenLabs API docs.
    const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${voice}`;

    const r = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': key
      },
      body: JSON.stringify({ text })
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(502).json({ error: 'TTS error', detail: t });
    }

    const buffer = await r.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    return res.end(Buffer.from(buffer));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
