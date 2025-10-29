// controllers/timelineController.js
import Timeline from "../models/timelineModel.js";

// Ambil semua timeline
export const getTimeline = async (req, res) => {
  try {
    const timelines = await Timeline.find();
    res.json(timelines);
  } catch (error) {
    console.error("Error fetching timeline:", error);
    res.status(500).json({ message: "Gagal mengambil data timeline" });
  }
};

// Tambah timeline baru
export const postTimeline = async (req, res) => {
  try {
    const { title, description, date } = req.body;
    const newTimeline = new Timeline({ title, description, date });
    await newTimeline.save();
    res.status(201).json(newTimeline);
  } catch (error) {
    console.error("Error saving timeline:", error);
    res.status(500).json({ message: "Gagal menyimpan data timeline" });
  }
};