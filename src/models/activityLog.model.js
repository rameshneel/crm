import mongoose from "mongoose";
const activityLogSchema = new mongoose.Schema({
    action: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  });

  const ActivityLog=mongoose.model("ActivityLog", activityLogSchema) 
  
export default ActivityLog