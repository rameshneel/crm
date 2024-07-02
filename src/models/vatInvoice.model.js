import mongoose, { Schema } from "mongoose";
const invoiceSchema = new Schema({
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
    },
    invoiceDate: {
      type: Date,
      required: true,
    },
    amountExcludingVAT: {
      type: Number,
      required: true,
    },
    vatAmount: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    pdfPath: {
      type: String, 
      required: true,
    },
    sentToCustomer: {
      type: Boolean,
      default: false,
    },  
  },{ timestamps: true });

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice