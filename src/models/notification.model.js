import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema({
  message: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ["assigned_to_me", "i_was_mentioned"],
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  assignedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  mentionedUsers: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  item: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "itemType",
    required: true,
  },
  itemType: {
    type: String,
    required: true,
    enum: ["Customer", "Order", "Lead", "Amendment"],
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;