import express from "express";
import { createStory, getStories } from "../controllers/storyController.js";

const router = express.Router();
router.post("/create", createStory);
router.get("/all", getStories);

export default router;
