// /api/generate.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { promptText } = req.body || {};
    if (!promptText) {
      return res.status(400).json({ error: 'Prompt teks tidak boleh kosong' });
    }

    // Ambil API Keys dari Environment Variables
    const API_KEYS = [
      process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3
    ].filter(Boolean);

    if (API_KEYS.length === 0) {
      return res.status(500).json({ error: 'API Key Gemini belum dipasang di Vercel Settings' });
    }

    // Model resmi yang terbukti stabil & didukung Google REST API
    const MODELS = ['gemini-1.5-flash', 'gemini-2.0-flash'];
    let lastErrorMsg = 'Server sibuk';

    for (const apiKey of API_KEYS) {
      for (const modelName of MODELS) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }] }]
            })
          });

          const data = await response.json();

          if (response.ok && data.candidates && data.candidates.length > 0) {
            return res.status(200).json(data);
          }

          lastErrorMsg = data.error?.message || `Model ${modelName} gagal`;
        } catch (err) {
          lastErrorMsg = err.message;
        }
      }
    }

    return res.status(503).json({ error: { message: 'SERVER_BUSY', detail: lastErrorMsg } });

  } catch (serverErr) {
    // Menangkap crash tak terduga agar server tetap mengembalikan format JSON
    return res.status(500).json({ error: { message: 'SERVER_CRASH', detail: serverErr.message } });
  }
}