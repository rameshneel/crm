import mongoose from "mongoose";
const { Schema } = mongoose;

const amendmentschema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    user: 
    { 
      type: Schema.Types.ObjectId,
       ref: "User",
        required: true 
      },
   
      date_current: {
        type: Date,
        required: true
    },

    customer_status: {
        type: String,
        enum:{ values:["Live Site","Demo Link"],message:'{VALUE} is not supported' }
    },
    date_complete: {
        type: Date,
    },
    priority: {
      type: String,
      enum:["Critical","Low"]
    },
    status: {
      type: String,
      enum: ["In Query", "Complete","In Process"],
    },
    generated_by: 
    { 
      type: Schema.Types.ObjectId,
       ref: "User",
        required: true 
      },
      updated_by: 
    { 
      type: Schema.Types.ObjectId,
       ref: "User",
      },
  },
  { timestamps: true }
);

const Amendment = mongoose.model("Amendment", amendmentschema);

export default Amendment;
