import Notification from "../models/notification.model.js";

// Controller method to get all notifications for the logged-in user
export const getAllNotifications = async (req, res, next) => {
  const userId = req.user._id; // Assuming userId is available from authentication middleware

  try {
    const notifications = await Notification.find({
      $or: [{ assignedTo: userId }, { mentionedUsers: userId }],
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

export const getAllUnreadNotifications = async (req, res, next) => {
  const userId = req.user._id; // Assuming userId is available from authentication middleware

  try {
    const unreadNotifications = await Notification.find({
      assignedTo: userId,
      isRead: false,
    }).sort({ createdAt: -1 });

    res.json(unreadNotifications);
  } catch (error) {
    next(error);
  }
};

// Controller method to get notifications based on category (assigned_to_me or i_was_mentioned)
export const getNotificationsByCategory = async (req, res, next) => {
  const userId = req.user._id; // Assuming userId is available from authentication middleware
  const { category } = req.query; // Extract category from query parameter

  try {
    let filter = {};

    // Validate category against enum values
    if (category === "assigned_to_me") {
      filter = { assignedTo: userId };
    } else if (category === "i_was_mentioned") {
      filter = { mentionedUsers: userId };
    } else {
      return res.status(400).json({ message: "Invalid category" });
    }

    const notifications = await Notification.find(filter).sort({
      createdAt: -1,
    });
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};
