import express from "express";
import cors from "cors";
import timelineRoutes from "./routes/timelineRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

// route utama
app.use("/api/timeline", timelineRoutes);

app.listen(process.env.PORT || 5000, () => {
  console.log("Server running on port " + (process.env.PORT || 5000));
});
