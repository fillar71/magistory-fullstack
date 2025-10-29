// controllers/geminiController.js
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export const generateIdea = async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `Kamu adalah AI pembuat ide video. Buatkan ide menarik berdasarkan prompt berikut:\n"${prompt}". 
                Sertakan ringkasan, gaya video, dan contoh narasi singkat.`,
              },
            ],
          },
        ],
      }
    );

    const text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Gagal mengambil hasil dari Gemini";

    res.json({ result: text });
  } catch (error) {
    console.error("Gemini API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate idea" });
  }
};
