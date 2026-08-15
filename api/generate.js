// /api/generate.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { promptText } = req.body;

  // 1. Ambil daftar API Key dari Vercel Environment Variables
  const API_KEYS = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
  ].filter(Boolean); // Hanya ambil yang terisi

  // 2. Daftar model yang dicoba berurutan (utamakan flash yang stabil)
  const MODELS = ['gemini-1.5-flash'];
git
  let lastErrorDetail = null;

  // 3. Looping mencoba kombinasi API Key & Model secara otomatis
  for (const apiKey of API_KEYS) {
    for (const modelName of MODELS) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }] }]
            })
          }
        );

        const data = await response.json();

        // Jika sukses mendapatkan jawaban dari Google
        if (response.ok && data.candidates && data.candidates.length > 0) {
          return res.status(200).json(data);
        }

        lastErrorDetail = data.error?.message || 'Server sibuk';
      } catch (err) {
        lastErrorDetail = err.message;
      }
    }
  }

  // 4. Jika semua Key & Model gagal/high demand, kirim status 503 dengan kode 'SERVER_BUSY'
  return res.status(503).json({ 
    error: { message: 'SERVER_BUSY', detail: lastErrorDetail } 
  });
}