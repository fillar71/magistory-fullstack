import fetch from "node-fetch";
import fs from "fs";

export const generateScript = async (req, res) => {
  try {
    const { idea, duration = 5, aspect_ratio = "16:9", style = "Edukasi" } = req.body;

    const prompt = `
    Buat naskah video berdasarkan ide berikut:
    Ide: ${idea}
    Durasi: ${duration} menit
    Aspect ratio: ${aspect_ratio}
    Gaya video: ${style}

    Format output JSON seperti ini:
    {
      "judul": "Judul Video",
      "adegan": [
        {
          "nomor_adegan": 1,
          "durasi": "00:00-00:30",
          "deskripsi_visual": ["contoh keyword 1", "contoh keyword 2"],
          "narasi": "Teks narasi"
        }
      ]
    }`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" +
        process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const result = JSON.parse(text);

    // Simpan hasil di file sementara
    const filePath = "./storage/projects.json";
    let projects = [];
    if (fs.existsSync(filePath)) {
      projects = JSON.parse(fs.readFileSync(filePath));
    }
    projects.push({ ...result, createdAt: new Date() });
    fs.writeFileSync(filePath, JSON.stringify(projects, null, 2));

    res.json({ status: "success", ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: "Gagal menghasilkan video." });
  }
};