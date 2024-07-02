import Notification from "../models/notification.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAllNotifications = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  try {
    const notifications = await Notification.find({
      $or: [{ assignedTo: userId }, { mentionedUsers: userId }],
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "mentionedUsers",
        select: "_id fullName email",
      })
      .populate({
        path: "assignedTo",
        select: "_id fullName email",
      })
      .populate({
        path: "assignedBy",
        select: "_id fullName email",
      });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          notifications,
          "Notifications fetched successfully"
        )
      );
  } catch (error) {
    next(new ApiError(500, "Error fetching notifications"));
  }
});

export const getAllUnreadNotifications = asyncHandler(
  async (req, res, next) => {
    const userId = req.user._id;

    try {
      const unreadNotifications = await Notification.find({
        assignedTo: userId,
        isRead: false,
      })
        .sort({ createdAt: -1 })
        .populate({
          path: "assignedBy",
          select: "_id fullName email",
        });

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            unreadNotifications,
            "Unread notifications fetched successfully"
          )
        );
    } catch (error) {
      next(new ApiError(500, "Error fetching unread notifications"));
    }
  }
);

export const getNotificationsByCategory = asyncHandler(
  async (req, res, next) => {
    const userId = req.user._id;
    const { category } = req.query;

    try {
      if (!["assigned_to_me", "i_was_mentioned"].includes(category)) {
        return next(new ApiError(400, "Invalid category"));
      }

      let filter = {};
      if (category === "assigned_to_me") {
        filter = { assignedTo: userId };
      } else if (category === "i_was_mentioned") {
        filter = { mentionedUsers: userId };
      }

      const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .populate({
          path: "mentionedUsers",
          select: "_id fullName email",
        })
        .populate({
          path: "assignedTo",
          select: "_id fullName email",
        })
        .populate({
          path: "assignedBy",
          select: "_id fullName email",
        });

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            notifications,
            "Notifications by category fetched successfully"
          )
        );
    } catch (error) {
      next(new ApiError(500, "Error fetching notifications by category"));
    }
  }
);

