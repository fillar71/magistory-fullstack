// controllers/timelineController.js
import fs from "fs";

// Contoh: ambil timeline (GET)
export const getTimeline = (req, res) => {
  try {
    // Contoh data dummy — bisa diganti dengan database
    const timelineData = JSON.parse(fs.readFileSync("timeline.json", "utf-8") || "[]");
    res.json(timelineData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memuat timeline" });
  }
};

// Contoh: simpan timeline (POST)
export const postTimeline = (req, res) => {
  try {
    const newItem = req.body;
    let timelineData = [];
    if (fs.existsSync("timeline.json")) {
      timelineData = JSON.parse(fs.readFileSync("timeline.json", "utf-8"));
    }
    timelineData.push(newItem);
    fs.writeFileSync("timeline.json", JSON.stringify(timelineData, null, 2));
    res.json({ message: "Timeline baru disimpan!", item: newItem });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal menyimpan timeline" });
  }
};