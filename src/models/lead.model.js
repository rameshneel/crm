import mongoose from "mongoose";

const { Schema } = mongoose;

const LeadSchema = new Schema(
  {
    customer_id: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    generated_by: 
    { 
      type: Schema.Types.ObjectId,
       ref: "User",
        required: true 
      },
    lead_type: {
      type:String,
      enum: ["Referal","Cold call","Contact Metting","Old Client","Promate Client","Renewal"],
      required: true,
    },
    existing_website: {
      type: String,
    },
    outcome:{
       type :String,
       enum: ["Appointement Made","Callback","Not Interseted","Old Client","Sold"],
       required: true,
    },
    Appointement:{
      type: Schema.Types.ObjectId,
      ref: "Appointment",
    },
    orderforced :{
      type:Number
    },
    notes: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Sell", "Not_Sell"],
      default: "Not_Sell",
    },
  },
  { timestamps: true }
);

const Lead = mongoose.model("Lead", LeadSchema);

export default Lead;
