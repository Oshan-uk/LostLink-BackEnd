import { Request, Response } from "express";
import type { HydratedDocument } from "mongoose";
import Item, { IItem } from "../models/Item.js";

const normalize = (value: string): string => {
  return value.trim().toLowerCase();
};

// Calculate similarity between two item names.
const calculateNameSimilarity = (
  firstName: string,
  secondName: string,
): number => {
  const first = normalize(firstName);
  const second = normalize(secondName);

  if (first === second) {
    return 25;
  }

  if (first.includes(second) || second.includes(first)) {
    return 20;
  }

  const firstWords = new Set(first.split(/\s+/));
  const secondWords = new Set(second.split(/\s+/));

  const commonWords = [...firstWords].filter((word) =>
    secondWords.has(word),
  );

  const totalWords = new Set([...firstWords, ...secondWords]).size;

  if (totalWords === 0) {
    return 0;
  }

  return Math.round((commonWords.length / totalWords) * 25);
};

// Calculate date similarity.
const calculateDateScore = (
  firstDate: Date,
  secondDate: Date,
): number => {
  const difference = Math.abs(
    new Date(firstDate).getTime() - new Date(secondDate).getTime(),
  );

  const days = difference / (1000 * 60 * 60 * 24);

  if (days <= 1) return 10;
  if (days <= 3) return 8;
  if (days <= 7) return 6;
  if (days <= 14) return 4;
  if (days <= 30) return 2;

  return 0;
};

// Calculate the overall matching score.
const calculateMatchScore = (lostItem: any, foundItem: any) => {
  let score = 0;

  const reasons: string[] = [];

  if (normalize(lostItem.category) === normalize(foundItem.category)) {
    score += 30;
    reasons.push("Same category");
  }

  const nameScore = calculateNameSimilarity(
    lostItem.name,
    foundItem.name,
  );

  score += nameScore;

  if (nameScore >= 20) {
    reasons.push("Similar item name");
  }

  if (normalize(lostItem.province) === normalize(foundItem.province)) {
    score += 10;
    reasons.push("Same province");
  }

  if (normalize(lostItem.district) === normalize(foundItem.district)) {
    score += 15;
    reasons.push("Same district");
  }

  if (normalize(lostItem.city) === normalize(foundItem.city)) {
    score += 10;
    reasons.push("Same city");
  }

  const dateScore = calculateDateScore(
    lostItem.date,
    foundItem.date,
  );

  score += dateScore;

  if (dateScore >= 6) {
    reasons.push("Close report dates");
  }

  return {
    score,
    reasons,
  };
};

// Find existing matching items for automatic notifications.
export const findMatchingItemsForNotification = async (
  originalItem: HydratedDocument<IItem>,
) => {
  const oppositeType =
    originalItem.type === "lost" ? "found" : "lost";

  const candidates = await Item.find({
    _id: { $ne: originalItem._id },
    user: { $ne: originalItem.user },
    type: oppositeType,
    status: "active",
  })
    .sort({ createdAt: -1 })
    .limit(100);

  const matches = candidates
    .map((candidate) => {
      const result = calculateMatchScore(originalItem, candidate);

      return {
        item: candidate,
        matchScore: result.score,
      };
    })
    .filter((match) => match.matchScore >= 40)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);

  return matches.map((match) => match.item);
};

// Find potential matching reports for the API.
export const getPotentialMatches = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const itemId = String(req.params.id);

    if (!/^[a-fA-F0-9]{24}$/.test(itemId)) {
      res.status(400).json({
        success: false,
        message: "Invalid item ID",
      });
      return;
    }

    const originalItem = await Item.findById(itemId);

    if (!originalItem) {
      res.status(404).json({
        success: false,
        message: "Item not found",
      });
      return;
    }

    if (originalItem.status === "returned") {
      res.status(400).json({
        success: false,
        message: "Cannot find matches for a returned item",
      });
      return;
    }

    const oppositeType =
      originalItem.type === "lost" ? "found" : "lost";

    const candidates = await Item.find({
      _id: { $ne: originalItem._id },
      user: { $ne: originalItem.user },
      type: oppositeType,
      status: "active",
    })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .limit(100);

    const matches = candidates
      .map((candidate) => {
        const result = calculateMatchScore(
          originalItem,
          candidate,
        );

        return {
          item: candidate,
          matchScore: result.score,
          matchReasons: result.reasons,
        };
      })
      .filter((match) => match.matchScore >= 40)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    res.status(200).json({
      success: true,
      totalMatches: matches.length,
      matches,
    });
  } catch (error) {
    console.error("Smart matching error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to find potential matches",
    });
  }
};