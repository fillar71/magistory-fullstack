import express from "express";
import { generateIdea } from "../controllers/geminiController.js";

const router = express.Router();

router.post("/", generateIdea);

export default router;
