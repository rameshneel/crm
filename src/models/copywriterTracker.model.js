import mongoose from "mongoose";

const { Schema, model } = mongoose;

const copywriterTrackerSchema = new Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: [
        "Homepage In Process",
        "Rework",
        "Additional Pages in Process",
        "Homepage Complete",
        "Remaining Pages in Process",
        "COMPLETED",
        "In Query",
        "Held for Critical",
        "Waiting on Info",
        "COMPLETED REWORK",
        "Area Pages Remaining",
        "Blog pages",
        "Extra Pages",
      ],
      required: true,
    },
    dateComplete: {
      type: Date,
    },
    updates: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Update",
      },
    ],
  },
  {
    timestamps: true, // adds createdAt and updatedAt fields automatically
  }
);

// Create the model
const CopywriterTracker = model("CopywriterTracker", copywriterTrackerSchema);

export default CopywriterTracker;
