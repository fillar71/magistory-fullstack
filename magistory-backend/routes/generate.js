import express from "express";
import { generateScript } from "../controllers/geminiController.js";

const router = express.Router();

router.post("/generate", generateScript);

export default router;