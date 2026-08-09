export default async function handler(req, res) {
    // Hanya menerima request POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { promptText } = req.body;
        
        // Mengambil API Key rahasia yang tersimpan di Vercel
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'Gemini API Key belum diset di Vercel!' });
        }

        // Panggil Google Gemini API dari server-side
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }]
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(400).json({ error: data.error.message });
        }

        // Kirim hasil teks ke frontend
        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: 'Gagal memproses di server: ' + error.message });
    }
}