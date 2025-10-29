// controllers/geminiController.js

import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const generateIdea = async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    // Simulasi (karena di Railway tidak ada API key Gemini)
    // Kamu bisa ubah ini dengan pemanggilan API Gemini nanti
    const responseText = `✨ Ide berdasarkan prompt kamu: "${prompt}"\n1. Buat storyboard menarik\n2. Tambahkan musik lembut\n3. Gunakan gaya sinematik`;

    res.json({ result: responseText });
  } catch (error) {
    console.error("Gemini API Error:", error.message);
    res.status(500).json({ error: "Failed to generate idea" });
  }
};
