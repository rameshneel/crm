import mongoose, { Schema } from "mongoose";

const productFlowSchema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, default: Date.now },
  currentStage: {
    type: String,
    enum: [
      "Copywriter",
      "Upload",
      "Awaiting Domain",
      "In Query",
      "AWR Cloud/Search Console",
      "All Content Added",
      "QC Changes",
      "QC",
      "Quality Control",
      "Waiting on Area Pages",
      "Upload Query",
      "Complete",
      "Design Stage 1",
      "Design Stage 2",
      "",
    ],
    required: true,
  },
  datePhase1Instructed: Date,
  datePhase2Instructed: Date,
  demoLink: String,
  demoCompletedDate: Date,
  liveDate: Date,
  notes: String,
  updates: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Update",
    },
  ],
});

const ProductFlow = mongoose.model("ProductFlow", productFlowSchema);

export default ProductFlow;
