import { Request, Response } from "express";
import mongoose from "mongoose";
import Notification from "../models/Notification.js";

// Get all notifications belonging to the logged-in user
export const getMyNotifications = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const notifications = await Notification.find({
      recipient: req.userId,
    })
      .populate("item", "name type imageUrl")
      .populate("matchedItem", "name type imageUrl")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      totalNotifications: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve notifications.",
    });
  }
};

// Get unread notification count
export const getUnreadCount = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.userId,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error("Get unread count error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve unread notification count.",
    });
  }
};

// Mark one notification as read
export const markNotificationAsRead = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id;

    if (
      typeof id !== "string" ||
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
      return;
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        recipient: req.userId,
      },
      {
        isRead: true,
      },
      {
        new: true,
      },
    );

    if (!notification) {
      res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      notification,
    });
  } catch (error) {
    console.error("Mark notification as read error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update notification.",
    });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    await Notification.updateMany(
      {
        recipient: req.userId,
        isRead: false,
      },
      {
        isRead: true,
      },
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update notifications.",
    });
  }
};

// Delete one notification
export const deleteNotification = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id;

    if (
      typeof id !== "string" ||
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
      return;
    }

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: req.userId,
    });

    if (!notification) {
      res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully.",
    });
  } catch (error) {
    console.error("Delete notification error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete notification.",
    });
  }
};