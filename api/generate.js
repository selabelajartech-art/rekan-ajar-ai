// /api/generate.js

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { promptText } = req.body || {};
    if (!promptText) {
      return res.status(400).json({ error: 'Prompt teks tidak boleh kosong' });
    }

    // Ambil API Keys dan bersihkan dari spasi, newline (\n), & tanda petik
    const rawKeys = [
      process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3
    ];

    const API_KEYS = rawKeys
      .filter(Boolean)
      .map((key) => key.trim().replace(/^["']|["']$/g, '')); // Pembersihan total karakter pengganggu

    if (API_KEYS.length === 0) {
      return res.status(500).json({ 
        error: { message: 'API Key belum terpasang di Vercel Settings' } 
      });
    }

    const modelName = 'gemini-flash-latest';
    let lastErrorMsg = '';

    for (const apiKey of API_KEYS) {
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

        lastErrorMsg = data.error?.message || `Status HTTP ${response.status}`;
        await delay(300);
      } catch (err) {
        lastErrorMsg = err.message;
        await delay(300);
      }
    }

    return res.status(503).json({ 
      error: { message: 'SERVER_BUSY', detail: lastErrorMsg } 
    });

  } catch (serverErr) {
    return res.status(500).json({ 
      error: { message: 'SERVER_CRASH', detail: serverErr.message } 
    });
  }
}