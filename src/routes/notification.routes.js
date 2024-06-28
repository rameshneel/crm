
import express from "express";
import {
  getAllNotifications,
  getAllUnreadNotifications,
  getNotificationsByCategory,
} from "../controllers/notification.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(verifyJWT);


router.get("/", getAllNotifications);
router.get("/unread", getAllUnreadNotifications);
router.get("/notifications", getNotificationsByCategory);
export default router;

// Example: /notifications?category=assigned_to_me
// Example: /notifications?category=i_was_mentioned
