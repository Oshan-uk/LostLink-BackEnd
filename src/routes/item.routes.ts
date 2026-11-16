import { Router } from "express";

import {
  createLostItem,
  createFoundItem,
  getAllItems,
  getItemById,
  getMyItems,
  updateItem,
  deleteItem,
  markItemReturned,
} from "../controllers/item.controller.js";

import { getPotentialMatches } from "../controllers/matching.controller.js";

import protect from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", getAllItems);

router.get("/mine", protect, getMyItems);

// Smart matching
router.get("/:id/matches", getPotentialMatches);

router.post("/lost", protect, createLostItem);

router.post("/found", protect, createFoundItem);

router.patch("/:id/returned", protect, markItemReturned);

router.get("/:id", getItemById);

router.patch("/:id", protect, updateItem);

router.delete("/:id", protect, deleteItem);

export default router;