// api/history.js
// Simple history endpoint. For production use a DB (Supabase/Firebase).
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'history.json');

function readHistory() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
  } catch (e) {
    return [];
  }
}
function writeHistory(arr) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(arr.slice(-200)), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const h = readHistory();
    return res.json({ ok: true, history: h });
  } else if (req.method === 'POST') {
    const { item } = req.body || {};
    if (!item) return res.status(400).json({ error: 'Missing item' });
    const h = readHistory();
    const entry = { id: Date.now(), item };
    h.push(entry);
    writeHistory(h);
    return res.json({ ok: true, saved: true, entry });
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
