// /api/generate.js

// Fungsi pembantu untuk memberi jeda waktu (delay) antar pemanggilan
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function handler(req, res) {
  // 1. Validasi HTTP Method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { promptText } = req.body || {};
    if (!promptText) {
      return res.status(400).json({ error: 'Prompt teks tidak boleh kosong' });
    }

    // 2. Ambil seluruh API Key dari Vercel Environment Variables
    const API_KEYS = [
      process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3
    ].filter(Boolean);

    if (API_KEYS.length === 0) {
      return res.status(500).json({ 
        error: { message: 'API Key Gemini belum dipasang di Vercel Settings' } 
      });
    }

    // 3. Daftar Model Resmi (Gunakan versi v1 stabil)
    const MODELS = ['gemini-1.5-flash'];
    let lastErrorMsg = 'Server sibuk';

    // 4. Looping mencoba kombinasi API Key & Model secara otomatis
    for (const apiKey of API_KEYS) {
      for (const modelName of MODELS) {
        try {
          // Endpoint v1 resmi dan pemanggilan dinamis sesuai modelName
          const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;
          
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }] }]
            })
          });

          const data = await response.json();

          // Jika pemanggilan berhasil, kirim hasil ke frontend
          if (response.ok && data.candidates && data.candidates.length > 0) {
            return res.status(200).json(data);
          }

          lastErrorMsg = data.error?.message || `Model ${modelName} gagal dipanggil`;

          // JEDA 500ms agar IP Vercel tidak dianggap spam/throttled oleh Google[cite: 7]
          await delay(500);

        } catch (err) {
          lastErrorMsg = err.message;
          await delay(500);
        }
      }
    }

    // 5. Jika seluruh Key & Model gagal
    return res.status(503).json({ 
      error: { message: 'SERVER_BUSY', detail: lastErrorMsg } 
    });

  } catch (serverErr) {
    // Menangkap crash tak terduga agar server tetap mengembalikan format JSON
    return res.status(500).json({ 
      error: { message: 'SERVER_CRASH', detail: serverErr.message } 
    });
  }
}