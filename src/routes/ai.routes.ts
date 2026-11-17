import { Router } from "express";

import { chatWithAI } from "../controllers/ai.controller.js";
import aiRateLimit from "../middleware/ai-rate-limit.js";

const router = Router();

router.post("/chat", aiRateLimit, chatWithAI);

export default router;