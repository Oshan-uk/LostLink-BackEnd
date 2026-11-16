import { Router } from "express";

import {
  getMyNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../controllers/notification.controller.js";

import protect from "../middleware/auth.middleware.js";

const router = Router();

// All notification routes require authentication
router.use(protect);

// Get all notifications
router.get("/", getMyNotifications);

// Get unread notification count
router.get("/unread-count", getUnreadCount);

// Mark all notifications as read
router.patch("/read-all", markAllNotificationsAsRead);

// Mark one notification as read
router.patch("/:id/read", markNotificationAsRead);

// Delete one notification
router.delete("/:id", deleteNotification);

export default router;