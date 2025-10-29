import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import geminiRoutes from "./routes/geminiRoutes.js";
import timelineRoutes from "./routes/timelineRoutes.js";
import pool from "./db.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Test koneksi database
pool
  .connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch((err) => console.error("❌ Database connection error:", err));

// Routes
app.use("/api/timeline", timelineRoutes);
app.use("/api/gemini", geminiRoutes);

app.get("/", (req, res) => {
  res.send("🚀 Magistory Backend (PostgreSQL + Gemini) is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
