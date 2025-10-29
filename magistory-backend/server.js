import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import generateRouter from "./routes/generate.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", generateRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Magistory backend running on port ${PORT}`));