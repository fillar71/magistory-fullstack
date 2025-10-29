import express from "express";
import { generateAIStory } from "../controllers/geminiController.js";

const router = express.Router();
router.post("/generate", generateAIStory);

export default router;
