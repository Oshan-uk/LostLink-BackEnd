import { Types } from "mongoose";
import Notification from "../models/Notification.js";

interface MatchItem {
  _id: Types.ObjectId;
  name: string;
  type: "lost" | "found";
  user: Types.ObjectId | string;
}

export const createPotentialMatchNotifications = async (
  newItem: MatchItem,
  matchedItems: MatchItem[],
): Promise<void> => {
  try {
    const operations = matchedItems
      .filter(
        (matchedItem) =>
          matchedItem.user.toString() !== newItem.user.toString(),
      )
      .map((matchedItem) => ({
        updateOne: {
          filter: {
            recipient: matchedItem.user,
            item: newItem._id,
            matchedItem: matchedItem._id,
          },
          update: {
            $setOnInsert: {
              recipient: matchedItem.user,
              item: newItem._id,
              matchedItem: matchedItem._id,
              title: "Potential Item Match Found!",
              message: `A newly reported ${newItem.type} item "${newItem.name}" may match your ${matchedItem.type} report "${matchedItem.name}".`,
              type: "potential_match" as const,
              isRead: false,
            },
          },
          upsert: true,
        },
      }));

    if (operations.length === 0) {
      return;
    }

    await Notification.bulkWrite(operations);
  } catch (error) {
    console.error("Create potential match notifications error:", error);
  }
};