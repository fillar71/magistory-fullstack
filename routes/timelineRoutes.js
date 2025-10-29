import express from "express";
import { getTimeline, postTimeline } from "../controllers/timelineController.js";

const router = express.Router();

router.get("/", getTimeline);
router.post("/", postTimeline);

export default router;  // ✅ tambahkan baris ini