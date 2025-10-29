// controllers/timelineController.js
import pool from "../db.js";

// Ambil semua timeline
export const getTimeline = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM timeline ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error getTimeline:", err);
    res.status(500).json({ error: "Failed to get timeline" });
  }
};

// Tambah data timeline
export const postTimeline = async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description)
    return res.status(400).json({ error: "Title & description required" });

  try {
    const result = await pool.query(
      "INSERT INTO timeline (title, description) VALUES ($1, $2) RETURNING *",
      [title, description]
    );
    res.status(201).json({
      message: "Timeline added successfully",
      item: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error postTimeline:", err);
    res.status(500).json({ error: "Failed to save timeline" });
  }
};
