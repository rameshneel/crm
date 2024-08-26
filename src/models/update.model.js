import mongoose from "mongoose";
const { Schema } = mongoose;

const updateSchema = new Schema(
  {
    content: {
      type: String,
      trim: true,
    },
    files: [
      {
        type: String,
      },
    ],
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    replies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Update",
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    views: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isPinned: {
      type: Boolean,
      default: false,
    },
    itemType: {
      type: String,
      enum: [
        "Customer",
        "Order",
        "Lead",
        "Amendment",
        "Reply",
        "Update",
        "TechnicalTracker",
        "ProductFlow",
        "CopywriterTracker",
      ],
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "itemType",
    },
    parentUpdate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Update",
    },
    isReply: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Update = mongoose.model("Update", updateSchema);
export default Update;
