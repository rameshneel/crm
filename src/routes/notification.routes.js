// routes/notifications.js

import express from "express";
import {
  getAllNotifications,
  getAllUnreadNotifications,
  getNotificationsByCategory,
} from "../controllers/notification.controllers.js";

const router = express.Router();

// GET all notifications for the logged-in user
router.get("/notifications", getAllNotifications);
router.get("/notifications/unread", getAllUnreadNotifications);
router.get("/notifications", getNotificationsByCategory);
export default router;

// Example: /notifications?category=assigned_to_me
// Example: /notifications?category=i_was_mentioned
