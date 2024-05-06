import mongoose from "mongoose";

const { Schema } = mongoose;

const customerSchema = new Schema(
  {
    // customerNo: {
    //   type: String,
    //   required: true,
    //   unique: true
    // },
    
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required:true
    },
    companyName: {
      type: String,
      required: true,
    },
    contactName: {
      type: String,
      required: true,
    },
    mobileNo: {
      type: String,
      required: true,
    },
    phoneNo: {
      type: String,
    },
  
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    address: {
      type: String,
    },
    hasLead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
