import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import timelineRoutes from "./routes/timelineRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/timeline", timelineRoutes);

app.get("/", (req, res) => {
  res.send("Magistory Backend berjalan 🚀");
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error("DB connection error:", err));