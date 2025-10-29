import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import aiRoutes from "./routes/aiRoutes.js";
import storyRoutes from "./routes/storyRoutes.js";
import timelineRoutes from "./routes/timelineRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Magistory Backend is running 🚀");
});

app.use("/api/ai", aiRoutes);
app.use("/api/story", storyRoutes);
app.use("/api/timeline", timelineRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
