import express from "express";
import {
  getAllNotifications,
  getAllUnreadNotifications,
  getNotificationsByCategory,
  createNotification,
  getNotificationById,
  deleteNotification,
  markNotificationAsRead,
  markMultipleNotificationsAsRead,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  // markNotificationsAsUnread, 
} from "../controllers/notification.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Middleware to verify JWT for all routes
router.use(verifyJWT);

// Route to get all notifications with pagination
router.get("/", getAllNotifications);

// Route to get all unread notifications
router.get("/unread", getAllUnreadNotifications);

// Route to get notifications by category
router.get("/category", getNotificationsByCategory);

// Route to create a new notification
router.post("/", createNotification);

// Route to get a single notification by ID
router.get("/:id", getNotificationById);

// Route to delete a notification by ID
router.delete("/:id", deleteNotification);

// Route to mark a notification as read
router.patch("/:id/read", markNotificationAsRead);

// Route to mark multiple notifications as read
router.patch("/read/multiple", markMultipleNotificationsAsRead);

// Route to get count of unread notifications
router.get("/unread/count", getUnreadNotificationsCount);

// Route to mark all notifications as read
router.patch("/read/all", markAllNotificationsAsRead);

// Route to mark notifications as unread (additional functionality)
// router.patch("/unread", markNotificationsAsUnread);

export default router;




// import express from "express";
// import {
//   createNotification,
//   deleteMultipleNotifications,
//   deleteNotification,
//   getAllNotifications,
//   getAllUnreadNotifications,
//   getNotificationById,
//   getNotificationHistory,
//   getNotifications,
//   getNotificationsByCategory,
//   getNotificationsByCategoryAndReadStatus,
//   getNotificationsByReadStatus,
//   getUnreadNotificationsCount,
//   markAllNotificationsAsRead,
//   markMultipleNotificationsAsRead,
//   markNotificationAsRead,
//   markNotificationsAsUnread,
// } from "../controllers/notification.controllers.js";
// import { verifyJWT } from "../middlewares/auth.middleware.js";

// const router = express.Router();
// router.use(verifyJWT);


// router.get("/", getAllNotifications);
// router.get("/unread", getAllUnreadNotifications);
// router.get("/notifications", getNotificationsByCategory);
// router.get('/:id', getNotificationById);
// router.post('/notifications', createNotification); // Create a new notification
// router.get('/notifications', getNotifications); // Get all notifications
// router.get('/notifications/:id', getNotificationById); // Get notification by ID
// router.patch('/notifications/:id/read', markNotificationAsRead); // Mark as read
// router.delete('/notifications/:id', deleteNotification); // Delete a notification
// router.patch('/notifications/:id/read', markNotificationAsRead); // Mark a single notification as read
// router.patch('/notifications/read', markMultipleNotificationsAsRead);
// router.get('/notifications/read-status', getNotificationsByReadStatus); // Get notifications by read status
// router.delete('/notifications/read', deleteMultipleNotifications); // Delete multiple notifications
// router.get('/notifications/unread/count', getUnreadNotificationsCount); // Get count of unread notifications
// router.patch('/notifications/read/all', markAllNotificationsAsRead); // Mark all notifications as read
// router.get('/notifications/category-read-status', getNotificationsByCategoryAndReadStatus); // Get notifications by category and read status
// router.patch('/notifications/unread', markNotificationsAsUnread); // Mark notifications as unread
// router.get('/notifications/history', getNotificationHistory); // Get notification history
// // router.patch('/user/preferences/notifications', updateUserNotificationPreferences); // Update user notification preferences


// export default router;

//GET /notifications?category=assigned_to_me&limit=10&page=1
//PATCH /notifications/{id}/read

//PATCH /notifications/read
//Content-Type: application/json

// {
//   "ids": ["notificationId1", "notificationId2", "notificationId3"]
// }

// Example: /notifications?category=assigned_to_me
// Example: /notifications?category=i_was_mentioned
