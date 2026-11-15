import { Router } from "express";
import { register, login } from "../controllers/auth.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", register);

router.post("/login", login);

router.get("/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Authenticated successfully",
    userId: req.userId,
  });
});

export default router;
