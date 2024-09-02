import mongoose from "mongoose";
const { Schema } = mongoose;

const fileSchema = new Schema(
  {
    fileUrl: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },

    itemType: {
      type: String,
      required: true,
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
        "NewWebsiteContent"
      ],
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "itemType",
      required: true,
    },
    source: {
      type: String,
      required: true,
      enum: ["UpdateFile", "FileGallery", "ReplyFile"],
    },
  },
  { timestamps: true }
);

const File = mongoose.model("File", fileSchema);
export default File;
