import mongoose from "mongoose";
import Notification from "../models/notification.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createNotifications = async (data) => {
  try {
    const notification = new Notification({
      title: data.title,
      message: data.message,
      category: data.category,
      assignedTo: data.assignedTo,
      assignedBy: data.assignedBy,
      mentionedUsers: data.mentionedUsers,
      item: data.item,
      itemType: data.itemType,
      linkUrl: data.linkUrl,
      createdBy: data.createdBy,
    });

    await notification.save();
    console.log("Notification created:", notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    throw new Error("Failed to create notification");
  }
};
// Reusable function to populate fields
const populateFields = () => [
  { path: "mentionedUsers", select: "_id fullName email avatar" },
  { path: "assignedTo", select: "_id fullName email avatar" },
  { path: "assignedBy", select: "_id fullName email avatar" },
];

// Fetch notifications with pagination and filters
const fetchNotifications = async (query, limit, page) => {
  console.log("query",query);
  
  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate(populateFields());

  const totalNotifications = await Notification.countDocuments(query);
  return { notifications, totalNotifications };
};

// Get all notifications with pagination
export const getAllNotifications = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  console.log("UserId",userId);
  
  const isAdmin = req.user.role === 'admin';
  const { limit = 10, page = 1 } = req.query;

  const parsedLimit = Math.max(1, Math.min(100, Number(limit)));
  const parsedPage = Math.max(1, Number(page));

  // Query based on role: admin sees all, others see assigned or mentioned notifications
  const query = isAdmin
    ? {}
    : { $or: [{ assignedTo: userId }, { mentionedUsers: userId }] };

  try {
    const [notifications, totalNotifications] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 }) // Sort by latest created
        .limit(parsedLimit)
        .skip((parsedPage - 1) * parsedLimit)
        .populate({
          path: 'assignedBy',
          select: '_id fullName email',
        })
        .lean(), // Use lean for better performance when only reading
      Notification.countDocuments(query),
    ]);

    // Map notifications to add read status
    const notificationsWithReadStatus = notifications.map(notification => ({
      ...notification,
      isRead: notification.readBy.some(id => id.equals(userId)), // Check if current user has read this notification
    }));
    console.log("notification",notificationsWithReadStatus);
    

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          notifications: notificationsWithReadStatus,
          total: totalNotifications,
          currentPage: parsedPage,
          totalPages: Math.ceil(totalNotifications / parsedLimit),
        },
        'Notifications fetched successfully'
      )
    );
  } catch (error) {
    console.error(error);
    next(new ApiError(500, 'Error fetching notifications'));
  }
});

// export const getAllNotifications = asyncHandler(async (req, res, next) => {
//   const userId = req.user._id;
//   const isAdmin = req.user.role === 'admin';
//   const { limit = 10, page = 1 } = req.query;

//   const parsedLimit = Math.max(1, Math.min(100, Number(limit)));
//   const parsedPage = Math.max(1, Number(page));

//   const query = isAdmin
//     ? {}
//     : { $or: [{ assignedTo: userId }, { mentionedUsers: userId }] };

//   try {
//     const { notifications, totalNotifications } = await fetchNotifications(query, parsedLimit, parsedPage);
    
//     return res.status(200).json(new ApiResponse(200, {
//       notifications,
//       total: totalNotifications,
//       currentPage: parsedPage,
//       totalPages: Math.ceil(totalNotifications / parsedLimit),
//     }, "Notifications fetched successfully"));
//   } catch (error) {
//     console.error(error);
//     next(new ApiError(500, "Error fetching notifications"));
//   }
// });

// Get all unread notifications
export const getAllUnreadNotifications = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  try {
    const unreadNotifications = await Notification.find({
      $or: [{ assignedTo: userId }, { mentionedUsers: userId }],
      readBy: { $ne: userId }, // User has not read these notifications
    })
      .sort({ createdAt: -1 })
      .populate({
        path: 'assignedBy',
        select: '_id fullName email',
      })
      .lean(); // Use lean for faster read

    return res.status(200).json(
      new ApiResponse(
        200,
        unreadNotifications,
        'Unread notifications fetched successfully'
      )
    );
  } catch (error) {
    next(new ApiError(500, 'Error fetching unread notifications'));
  }
});
// export const getAllUnreadNotifications = asyncHandler(async (req, res, next) => {
//   const userId = req.user._id;

//   try {
//     const unreadNotifications = await Notification.find({
//       $or: [{ assignedTo: userId }, { mentionedUsers: userId }],
//       readBy: { $ne: userId }, // User has not read these notifications
//     })
//       .sort({ createdAt: -1 })
//       .populate({
//         path: 'assignedBy',
//         select: '_id fullName email',
//       })
//       .lean(); // Use lean for faster read

//     return res.status(200).json(
//       new ApiResponse(
//         200,
//         unreadNotifications,
//         'Unread notifications fetched successfully'
//       )
//     );
//   } catch (error) {
//     next(new ApiError(500, 'Error fetching unread notifications'));
//   }
// });
// export const getAllUnreadNotifications = asyncHandler(async (req, res, next) => {
//   const userId = req.user._id;

//   try {
//     const unreadNotifications = await Notification.find({
//       assignedTo: userId,
//       isRead: false,
//     })
//       .sort({ createdAt: -1 })
//       .populate({
//         path: "assignedBy",
//         select: "_id fullName email",
//       });

//     return res.status(200).json(new ApiResponse(200, unreadNotifications, "Unread notifications fetched successfully"));
//   } catch (error) {
//     next(new ApiError(500, "Error fetching unread notifications"));
//   }
// });

// Get notifications by category
export const getNotificationsByCategory = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { category } = req.query;
  const { limit = 10, page = 1 } = req.query;

  // Validate category
  const validCategories = ["assigned_to_me", "i_was_mentioned", "update_posted", "reply_received", "other"];
  if (!validCategories.includes(category)) {
    return next(new ApiError(400, "Invalid category"));
  }

  // Validate and parse pagination parameters
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const parsedPage = Math.max(1, parseInt(page, 10));

  try {
    let query = { category };

    // Add user-specific filters
    if (category === "assigned_to_me") {
      query.assignedTo = userId;
    } else if (category === "i_was_mentioned") {
      query.mentionedUsers = { $elemMatch: { $eq: new mongoose.Types.ObjectId(userId) } };
    } else {
      // For other categories, ensure the user has access
      query.$or = [
        { assignedTo: userId },
        { mentionedUsers: { $elemMatch: { $eq: new mongoose.Types.ObjectId(userId) } } }
      ];
    }
     console.log("userId=",userId);
     console.log("category=",category);
     
     
    // Execute query with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit)
      .populate('mentionedUsers', '_id fullName email avatar')
      .populate('assignedTo', '_id fullName email avatar')
      .populate('assignedBy', '_id fullName email avatar')
      .lean();

    // Get total count for pagination
    const totalNotifications = await Notification.countDocuments(query);

    return res.status(200).json(new ApiResponse(200, {
      notifications,
      total: totalNotifications,
      currentPage: parsedPage,
      totalPages: Math.ceil(totalNotifications / parsedLimit),
    }, "Notifications by category fetched successfully"));
  } catch (error) {
    console.error("Error in getNotificationsByCategory:", error);
    next(new ApiError(500, "Error fetching notifications by category"));
  }
});
// export const getNotificationsByCategory = asyncHandler(async (req, res, next) => {
//   const userId = req.user._id;
//   const { category } = req.query;
//  console.log("catogry",category);
 
//   if (!["assigned_to_me", "i_was_mentioned"].includes(category)) {
//     return next(new ApiError(400, "Invalid category"));
//   }

//   const filter = category === "assigned_to_me"
//     ? { assignedTo: userId }
//     : { mentionedUsers: userId };
// console.log("filter",filter);

//   try {
//     const { notifications } = await fetchNotifications(filter, 10, 1); // Default pagination
//     return res.status(200).json(new ApiResponse(200, notifications, "Notifications by category fetched successfully"));
//   } catch (error) {
//     next(new ApiError(500, "Error fetching notifications by category"));
//   }
// });
// Create a new notification
export const createNotification = asyncHandler(async (req, res, next) => {
  const { title, message, category, assignedTo, assignedBy, mentionedUsers, item, itemType, linkUrl } = req.body;

  try {
    const notification = await Notification.create({
      title,
      message,
      category,
      assignedTo,
      assignedBy,
      mentionedUsers,
      item,
      itemType,
      linkUrl,
    });

    return res.status(201).json(new ApiResponse(201, notification, "Notification created successfully."));
  } catch (error) {
    console.error(error);
    next(new ApiError(400, "Error creating notification"));
  }
});

// Get a single notification by ID
export const getNotificationById = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { id } = req.params;

  try {
    const notification = await Notification.findById(id).populate(populateFields());
  console.log("notification",notification);
  
    if (!notification) {
      return res.status(404).json(new ApiResponse(404, null, "Notification not found."));
    }

    // if (!notification.assignedTo.equals(userId) && !notification.mentionedUsers.includes(userId)) {
    //   return res.status(403).json(new ApiResponse(403, null, "Access denied to this notification."));
    // }

    return res.status(200).json(new ApiResponse(200, notification, "Notification fetched successfully."));
  } catch (error) {
    console.error(error);
    next(new ApiError(500, "Error fetching notification"));
  }
});

// Delete a notification
export const deleteNotification = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { id } = req.params;

  try {
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json(new ApiResponse(404, null, "Notification not found."));
    }

    if (!notification.assignedTo.equals(userId) && !notification.mentionedUsers.includes(userId)) {
      return res.status(403).json(new ApiResponse(403, null, "Access denied to this notification."));
    }

    await notification.remove();
    return res.status(200).json(new ApiResponse(200, null, "Notification deleted successfully."));
  } catch (error) {
    console.error(error);
    next(new ApiError(500, "Error deleting notification"));
  }
});

// Mark a notification as read
export const markNotificationAsRead = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { id } = req.params;

  try {
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json(new ApiResponse(404, null, "Notification not found."));
    }

    // Check if the user has already marked this notification as read
    if (!notification.readBy.includes(userId)) {
      notification.readBy.push(userId); // Add the user to the readBy array
      await notification.save(); // Save the updated notification
    }

    return res.status(200).json(new ApiResponse(200, notification, "Notification marked as read."));
  } catch (error) {
    console.error(error);
    next(new ApiError(500, "Error updating notification status"));
  }
});


// export const markNotificationAsRead = asyncHandler(async (req, res, next) => {
//   const userId = req.user._id;
//   const { id } = req.params;

//   try {
//     const notification = await Notification.findById(id);

//     if (!notification) {
//       return res.status(404).json(new ApiResponse(404, null, "Notification not found."));
//     }

//     // if (!notification.assignedTo.equals(userId) && !notification.mentionedUsers.includes(userId)) {
//     //   return res.status(403).json(new ApiResponse(403, null, "Access denied to this notification."));
//     // }

//     notification.isRead = true;
//     await notification.save();

//     return res.status(200).json(new ApiResponse(200, notification, "Notification marked as read."));
//   } catch (error) {
//     console.error(error);
//     next(new ApiError(500, "Error updating notification status"));
//   }
// });

// Mark multiple notifications as read
export const markMultipleNotificationsAsRead = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json(new ApiResponse(400, null, "Invalid request: IDs must be an array."));
  }

  try {
    const notifications = await Notification.find({
      _id: { $in: ids },
      $or: [{ assignedTo: userId }, { mentionedUsers: userId }]
    });

    if (notifications.length === 0) {
      return res.status(404).json(new ApiResponse(404, null, "No notifications found for the provided IDs."));
    }

    await Promise.all(notifications.map(async (notification) => {
      notification.isRead = true;
      return notification.save();
    }));

    return res.status(200).json(new ApiResponse(200, notifications, "Notifications marked as read."));
  } catch (error) {
    console.error(error);
    next(new ApiError(500, "Error updating notification statuses"));
  }
});
// Get count of unread notifications
export const getUnreadNotificationsCount = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const isAdmin = req.user.role === 'admin';

  try {
    const query = isAdmin ? { isRead: false } : { $or: [{ assignedTo: userId, isRead: false }, { mentionedUsers: userId, isRead: false }] };
    const unreadCount = await Notification.countDocuments(query);

    return res.status(200).json(new ApiResponse(200, { count: unreadCount }, "Unread notifications count fetched successfully."));
  } catch (error) {
    console.error(error);
    next(new ApiError(500, "Error fetching unread notifications count"));
  }
});
// Mark all notifications as read
export const markAllNotificationsAsRead = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  try {
    const result = await Notification.updateMany(
      {
        $or: [{ assignedTo: userId }, { mentionedUsers: userId }],
        isRead: false
      },
      { isRead: true }
    );

    return res.status(200).json(new ApiResponse(200, result, "All notifications marked as read."));
  } catch (error) {
    console.error(error);
    next(new ApiError(500, "Error marking all notifications as read"));
  }
});







// import Notification from "../models/notification.model.js";
// import { ApiError } from "../utils/ApiError.js";
// import { ApiResponse } from "../utils/ApiResponse.js";
// import { asyncHandler } from "../utils/asyncHandler.js";
// // import WebSocket from 'ws';

// // const wss = new WebSocket.Server({ port: 8080 });

// // export const sendNotification = async (notification) => {
// //   wss.clients.forEach((client) => {
// //     if (client.readyState === WebSocket.OPEN) {
// //       client.send(JSON.stringify(notification));
// //     }
// //   });
// // };
// export const getAllNotifications = asyncHandler(async (req, res, next) => {
//   const userId = req.user._id;
//   const isAdmin = req.user.role === 'admin';
//   const { limit = 10, page = 1 } = req.query; // Pagination parameters

//   try {
//     let query = isAdmin
//       ? {} // Admins can see all notifications
//       : {
//           $or: [{ assignedTo: userId }, { mentionedUsers: userId }],
//         };

//     const notifications = await Notification.find(query)
//       .sort({ createdAt: -1 })
//       .skip((page - 1) * limit) // Apply pagination
//       .limit(Number(limit)) // Limit number of notifications
//       .populate({
//         path: "mentionedUsers",
//         select: "_id fullName email avatar",
//       })
//       .populate({
//         path: "assignedTo",
//         select: "_id fullName email avatar",
//       })
//       .populate({
//         path: "assignedBy",
//         select: "_id fullName email avatar",
//       });

//     const totalNotifications = await Notification.countDocuments(query); // Count based on the same query

//     return res.status(200).json(
//       new ApiResponse(200, {
//         notifications,
//         total: totalNotifications,
//         currentPage: page,
//         totalPages: Math.ceil(totalNotifications / limit),
//       }, "Notifications fetched successfully")
//     );
//   } catch (error) {
//     console.error(error); // Log error for debugging
//     next(new ApiError(500, "Error fetching notifications"));
//   }
// });
// export const getAllUnreadNotifications = asyncHandler(
//   async (req, res, next) => {
//     const userId = req.user._id;

//     try {
//       const unreadNotifications = await Notification.find({
//         assignedTo: userId,
//         isRead: false,
//       })
//         .sort({ createdAt: -1 })
//         .populate({
//           path: "assignedBy",
//           select: "_id fullName email",
//         });

//       return res
//         .status(200)
//         .json(
//           new ApiResponse(
//             200,
//             unreadNotifications,
//             "Unread notifications fetched successfully"
//           )
//         );
//     } catch (error) {
//       next(new ApiError(500, "Error fetching unread notifications"));
//     }
//   }
// );
// export const getNotificationsByCategory = asyncHandler(
//   async (req, res, next) => {
//     const userId = req.user._id;
//     const { category } = req.query;

//     try {
//       if (!["assigned_to_me", "i_was_mentioned"].includes(category)) {
//         return next(new ApiError(400, "Invalid category"));
//       }

//       let filter = {};
//       if (category === "assigned_to_me") {
//         filter = { assignedTo: userId };
//       } else if (category === "i_was_mentioned") {
//         filter = { mentionedUsers: userId };
//       }

//       const notifications = await Notification.find(filter)
//         .sort({ createdAt: -1 })
//         .populate({
//           path: "mentionedUsers",
//           select: "_id fullName email",
//         })
//         .populate({
//           path: "assignedTo",
//           select: "_id fullName email",
//         })
//         .populate({
//           path: "assignedBy",
//           select: "_id fullName email",
//         });

//       return res
//         .status(200)
//         .json(
//           new ApiResponse(
//             200,
//             notifications,
//             "Notifications by category fetched successfully"
//           )
//         );
//     } catch (error) {
//       next(new ApiError(500, "Error fetching notifications by category"));
//     }
//   }
// );
// export const getAllNotificationss = asyncHandler(async (req, res, next) => {
//   const userId = req.user._id;

//   try {
//     const notifications = await Notification.find({
//       $or: [{ assignedTo: userId }, { mentionedUsers: userId }],
//     })
//      .sort({ createdAt: -1 })
//      .populate({
//         path: "mentionedUsers",
//         select: "_id fullName email",
//       })
//      .populate({
//         path: "assignedTo",
//         select: "_id fullName email",
//       })
//      .populate({
//         path: "assignedBy",
//         select: "_id fullName email",
//       });

//     // WebSocket ke through notification ko bhejna
//     wss.clients.forEach((client) => {
//       if (client.readyState === WebSocket.OPEN) {
//         client.send(JSON.stringify(notifications));
//       }
//     });

//     return res
//      .status(200)
//      .json(
//         new ApiResponse(
//           200,
//           notifications,
//           "Notifications fetched successfully"
//         )
//       );
//   } catch (error) {
//     next(new ApiError(500, "Error fetching notifications"));
//   }
// });
// export const createNotification = asyncHandler(async (req, res, next) => {
//   const { title, message, category, assignedTo, assignedBy, mentionedUsers, item, itemType, linkUrl } = req.body;

//   try {
//     const notification = await Notification.create({
//       title,
//       message,
//       category,
//       assignedTo,
//       assignedBy,
//       mentionedUsers,
//       item,
//       itemType,
//       linkUrl,
//     });

//     return res.status(201).json(new ApiResponse(201, notification, "Notification created successfully."));
//   } catch (error) {
//     console.error(error);
//     next(new ApiError(400, "Error creating notification"));
//   }
// });
// // Get all notifications (with optional pagination and filters)
// export const getNotifications = asyncHandler(async (req, res, next) => {
//   const userId = req.user._id;
//   const isAdmin = req.user.role === 'admin';
//   const { limit = 10, page = 1, category, isRead } = req.query;

//   // Validate pagination parameters
//   const parsedLimit = Math.max(1, Math.min(100, Number(limit)));
//   const parsedPage = Math.max(1, Number(page));

//   try {
//     const query = isAdmin ? {} : { $or: [{ assignedTo: userId }, { mentionedUsers: userId }] };

//     if (category) query.category = category;
//     if (isRead !== undefined) query.isRead = isRead === 'true';

//     const notifications = await Notification.find(query)
//       .sort({ createdAt: -1 })
//       .skip((parsedPage - 1) * parsedLimit)
//       .limit(parsedLimit)
//       .populate('mentionedUsers', '_id fullName email')
//       .populate('assignedTo', '_id fullName email')
//       .populate('assignedBy', '_id fullName email');

//     const totalNotifications = await Notification.countDocuments(query);

//     return res.status(200).json(new ApiResponse(200, {
//       notifications,
//       total: totalNotifications,
//       currentPage: parsedPage,
//       totalPages: Math.ceil(totalNotifications / parsedLimit),
//     }, "Notifications fetched successfully."));
//   } catch (error) {
//     console.error(error);
//     next(new ApiError(500, "Error fetching notifications"));
//   }
// });
// // Get a single notification by ID
// export const getNotificationById = asyncHandler(async (req, res, next) => {
//   const userId = req.user._id;
//   const { id } = req.params;

//   try {
//     const notification = await Notification.findById(id)
//       .populate('mentionedUsers', '_id fullName email')
//       .populate('assignedTo', '_id fullName email')
//       .populate('assignedBy', '_id fullName email');

//     if (!notification) {
//       return res.status(404).json(new ApiResponse(404, null, "Notification not found."));
//     }

//     // Check access for non-admins
//     if (!notification.assignedTo.equals(userId) && !notification.mentionedUsers.includes(userId)) {
//       return res.status(403).json(new ApiResponse(403, null, "Access denied to this notification."));
//     }

//     return res.status(200).json(new ApiResponse(200, notification, "Notification fetched successfully."));
//   } catch (error) {
//     console.error(error);
//     next(new ApiError(500, "Error fetching notification"));
//   }
// });
// // Delete a notification
// export const deleteNotification = asyncHandler(async (req, res, next) => {
//   const userId = req.user._id;
//   const { id } = req.params;

//   try {
//     const notification = await Notification.findById(id);

//     if (!notification) {
//       return res.status(404).json(new ApiResponse(404, null, "Notification not found."));
//     }

//     // Ensure the user has access
//     if (!notification.assignedTo.equals(userId) && !notification.mentionedUsers.includes(userId)) {
//       return res.status(403).json(new ApiResponse(403, null, "Access denied to this notification."));
//     }

//     await notification.remove(); // Delete the notification

//     return res.status(200).json(new ApiResponse(200, null, "Notification deleted successfully."));
//   } catch (error) {
//     console.error(error);
//     next(new ApiError(500, "Error deleting notification"));
//   }
// });
// // Get all notifications (with optional pagination and filters, including category)
// export const getNotification = asyncHandler(async (req, res, next) => {
//   const userId = req.user._id;
//   const isAdmin = req.user.role === 'admin';
//   const { limit = 10, page = 1, category, isRead } = req.query;

//   // Validate pagination parameters
//   const parsedLimit = Math.max(1, Math.min(100, Number(limit)));
//   const parsedPage = Math.max(1, Number(page));

//   try {
//     // Build the query based on user role and filters
//     const query = isAdmin ? {} : { $or: [{ assignedTo: userId }, { mentionedUsers: userId }] };

//     if (category) query.category = category; // Filter by category
//     if (isRead !== undefined) query.isRead = isRead === 'true';

//     const notifications = await Notification.find(query)
//       .sort({ createdAt: -1 })
//       .skip((parsedPage - 1) * parsedLimit)
//       .limit(parsedLimit)
//       .populate('mentionedUsers', '_id fullName email')
//       .populate('assignedTo', '_id fullName email')
//       .populate('assignedBy', '_id fullName email');

//     const totalNotifications = await Notification.countDocuments(query);

//     return res.status(200).json(new ApiResponse(200, {
//       notifications,
//       total: totalNotifications,
//       currentPage: parsedPage,
//       totalPages: Math.ceil(totalNotifications / parsedLimit),
//     }, "Notifications fetched successfully."));
//   } catch (error) {
//     console.error(error);
//     next(new ApiError(500, "Error fetching notifications"));
//   }
// });
// // Mark a notification as read
// export const markNotificationAsRead = asyncHandler(async (req, res, next) => {
//   const userId = req.user._id;
//   const { id } = req.params;

//   try {
//     const notification = await Notification.findById(id);

//     if (!notification) {
//       return res.status(404).json(new ApiResponse(404, null, "Notification not found."));
//     }

//     // Ensure the user has access
//     if (!notification.assignedTo.equals(userId) && !notification.mentionedUsers.includes(userId)) {
//       return res.status(403).json(new ApiResponse(403, null, "Access denied to this notification."));
//     }

//     notification.isRead = true; // Mark as read
//     await notification.save();

//     return res.status(200).json(new ApiResponse(200, notification, "Notification marked as read."));
//   } catch (error) {
//     console.error(error);
//     next(new ApiError(500, "Error updating notification status"));
//   }
// });
// // Mark multiple notifications as read
// export const markMultipleNotificationsAsRead = asyncHandler(async (req, res, next) => {
//   const userId = req.user._id;
//   const { ids } = req.body; // Expecting an array of notification IDs

//   if (!Array.isArray(ids) || ids.length === 0) {
//     return res.status(400).json(new ApiResponse(400, null, "Invalid request: IDs must be an array."));
//   }

//   try {
//     const notifications = await Notification.find({
//       _id: { $in: ids },
//       $or: [{ assignedTo: userId }, { mentionedUsers: userId }]
//     });

//     if (notifications.length === 0) {
//       return res.status(404).json(new ApiResponse(404, null, "No notifications found for the provided IDs."));
//     }

//     const updatedNotifications = await Promise.all(notifications.map(async (notification) => {
//       notification.isRead = true; // Mark as read
//       return notification.save();
//     }));

//     return res.status(200).json(new ApiResponse(200, updatedNotifications, "Notifications marked as read."));
//   } catch (error) {
//     console.error(error);
//     next(new ApiError(500, "Error updating notification statuses"));
//   }
// });
// // Get notifications by read status
// export const getNotificationsByReadStatus = asyncHandler(async (req, res, next) => {
//   const userId = req.user._id;
//   const isAdmin = req.user.role === 'admin';
//   const { isRead, limit = 10, page = 1 } = req.query;

//   // Validate pagination parameters
//   const parsedLimit = Math.max(1, Math.min(100, Number(limit)));
//   const parsedPage = Math.max(1, Number(page));

//   try {
//     const query = isAdmin ? {} : { $or: [{ assignedTo: userId }, { mentionedUsers: userId }] };
    
//     if (isRead !== undefined) query.isRead = isRead === 'true';

//     const notifications = await Notification.find(query)
//       .sort({ createdAt: -1 })
//       .skip((parsedPage - 1) * parsedLimit)
//       .limit(parsedLimit)
//       .populate('mentionedUsers', '_id fullName email')
//       .populate('assignedTo', '_id fullName email')
//       .populate('assignedBy', '_id fullName email');

//     const totalNotifications = await Notification.countDocuments(query);

//     return res.status(200).json(new ApiResponse(200, {
//       notifications,
//       total: totalNotifications,
//       currentPage: parsedPage,
//       totalPages: Math.ceil(totalNotifications / parsedLimit),
//     }, "Notifications fetched successfully."));
//   } catch (error) {
//     console.error(error);
//     next(new ApiError(500, "Error fetching notifications by read status"));
//   }
// });
// // Delete multiple notifications
// export const deleteMultipleNotifications = asyncHandler(async (req, res, next) => {
//   const userId = req.user._id;
//   const { ids } = req.body; // Expecting an array of notification IDs

//   if (!Array.isArray(ids) || ids.length === 0) {
//     return res.status(400).json(new ApiResponse(400, null, "Invalid request: IDs must be an array."));
//   }

//   try {
//     const notifications = await Notification.find({
//       _id: { $in: ids },
//       $or: [{ assignedTo: userId }, { mentionedUsers: userId }]
//     });

//     if (notifications.length === 0) {
//       return res.status(404).json(new ApiResponse(404, null, "No notifications found for the provided IDs."));
//     }

//     await Notification.deleteMany({ _id: { $in: ids } }); // Delete the notifications

//     return res.status(200).json(new ApiResponse(200, null, "Notifications deleted successfully."));
//   } catch (error) {
//     console.error(error);
//     next(new ApiError(500, "Error deleting notifications"));
//   }
// });
// // Get count of unread notifications
// export const getUnreadNotificationsCount = asyncHandler(async (req, res, next) => {
//   const userId = req.user._id;
//   const isAdmin = req.user.role === 'admin';

//   try {
//     const query = isAdmin ? { isRead: false } : { 
//       $or: [
//         { assignedTo: userId, isRead: false },
//         { mentionedUsers: userId, isRead: false }
//       ]
//     };

//     const unreadCount = await Notification.countDocuments(query);

//     return res.status(200).json(new ApiResponse(200, { count: unreadCount }, "Unread notifications count fetched successfully."));
//   } catch (error) {
//     console.error(error);
//     next(new ApiError(500, "Error fetching unread notifications count"));
//   }
// });
// // Mark all notifications as read
// export const markAllNotificationsAsRead = asyncHandler(async (req, res, next) => {
//   const userId = req.user._id;

//   try {
//     const result = await Notification.updateMany(
//       {
//         $or: [{ assignedTo: userId }, { mentionedUsers: userId }],
//         isRead: false
//       },
//       { isRead: true }
//     );

//     return res.status(200).json(new ApiResponse(200, result, "All notifications marked as read."));
//   } catch (error) {
//     console.error(error);
//     next(new ApiError(500, "Error marking all notifications as read"));
//   }
// });
// // Get notifications by category and read status
// export const getNotificationsByCategoryAndReadStatus = asyncHandler(async (req, res, next) => {
//   const userId = req.user._id;
//   const isAdmin = req.user.role === 'admin';
//   const { category, isRead, limit = 10, page = 1 } = req.query;

//   // Validate pagination parameters
//   const parsedLimit = Math.max(1, Math.min(100, Number(limit)));
//   const parsedPage = Math.max(1, Number(page));

//   try {
//     const query = isAdmin ? {} : { $or: [{ assignedTo: userId }, { mentionedUsers: userId }] };

//     if (category) query.category = category;
//     if (isRead !== undefined) query.isRead = isRead === 'true';

//     const notifications = await Notification.find(query)
//       .sort({ createdAt: -1 })
//       .skip((parsedPage - 1) * parsedLimit)
//       .limit(parsedLimit)
//       .populate('mentionedUsers', '_id fullName email')
//       .populate('assignedTo', '_id fullName email')
//       .populate('assignedBy', '_id fullName email');

//     const totalNotifications = await Notification.countDocuments(query);

//     return res.status(200).json(new ApiResponse(200, {
//       notifications,
//       total: totalNotifications,
//       currentPage: parsedPage,
//       totalPages: Math.ceil(totalNotifications / parsedLimit),
//     }, "Notifications fetched successfully."));
//   } catch (error) {
//     console.error(error);
//     next(new ApiError(500, "Error fetching notifications by category and read status"));
//   }
// });
// // Mark notifications as unread
// export const   = asyncHandler(async (req, res, next) => {
//   const userId = req.user._id;
//   const { ids } = req.body; // Expecting an array of notification IDs

//   if (!Array.isArray(ids) || ids.length === 0) {
//     return res.status(400).json(new ApiResponse(400, null, "Invalid request: IDs must be an array."));
//   }

//   try {
//     const notifications = await Notification.find({
//       _id: { $in: ids },
//       $or: [{ assignedTo: userId }, { mentionedUsers: userId }]
//     });

//     if (notifications.length === 0) {
//       return res.status(404).json(new ApiResponse(404, null, "No notifications found for the provided IDs."));
//     }

//     await Notification.updateMany(
//       { _id: { $in: ids } },
//       { isRead: false } // Mark as unread
//     );

//     return res.status(200).json(new ApiResponse(200, null, "Notifications marked as unread."));
//   } catch (error) {
//     console.error(error);
//     next(new ApiError(500, "Error marking notifications as unread"));
//   }
// });
// // Get notification history for a user
// export const getNotificationHistory = asyncHandler(async (req, res, next) => {
//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     return res.status(400).json(new ApiResponse(400, null, "Invalid ID format."));
//   }
//   console.log("FDHJFKD");
  
//   const userId = req.user._id;
//   const { limit = 10, page = 1 } = req.query;

//   // Validate pagination parameters
//   const parsedLimit = Math.max(1, Math.min(100, Number(limit)));
//   const parsedPage = Math.max(1, Number(page));

//   try {
//     const notifications = await Notification.find({
//       $or: [{ assignedTo: userId }, { mentionedUsers: userId }]
//     })
//     .sort({ createdAt: -1 })
//     .skip((parsedPage - 1) * parsedLimit)
//     .limit(parsedLimit)
//     .populate('mentionedUsers', '_id fullName email')
//     .populate('assignedTo', '_id fullName email')
//     .populate('assignedBy', '_id fullName email');

//     const totalNotifications = await Notification.countDocuments({
//       $or: [{ assignedTo: userId }, { mentionedUsers: userId }]
//     });

//     return res.status(200).json(new ApiResponse(200, {
//       notifications,
//       total: totalNotifications,
//       currentPage: parsedPage,
//       totalPages: Math.ceil(totalNotifications / parsedLimit),
//     }, "Notification history fetched successfully."));
//   } catch (error) {
//     console.error(error);
//     next(new ApiError(500, "Error fetching notification history"));
//   }
// });


