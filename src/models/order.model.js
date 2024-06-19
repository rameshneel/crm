import mongoose from "mongoose";
const { Schema } = mongoose;
const orderSchema = new Schema(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    dateOfOrder: {
      type: Date,
    },
    orderType: {
      type: String,
      enum: {values:["Renewal", "New Business",""],message:'{VALUE} is not supported'},
      default:""
    },
    orderNo: {
      type: String,
    },
    renewalStatus: {
      type: String,
      enum: {values:["Meeting Booked", "Sold", "Dropped", "Still to Contact", ""],message:'{VALUE} is not supported'},
      default:""
    },
    renewalNotes: {
      type: String,
    },
    renewalValue: {
      type: Number,
    },
    renewalApptDandT: {
      type: String,
    },
    orderValue: {
      type: Number,
      // required: true,
    },
    deposit: {
      type: Number,
      // required: true,
    },
    numberOfInstallments: {
      type: Number,
      // required: true,
    },
    DdMonthly: {
      type: Number,
      // required: true,
    },
    DdChange: {
      type: Number,
    },
    dateOfFirstDd: {
      type: Date,
      // required: true,
    },
    depositMethod: {
      type: String,
      enum: {values:[
        "Cash",
        "",
        "Cheque",
        "Direct Debit",
        "N/A",
        "Square Card Machine",
        "SumUp",
        "Bank Transfer",
      ],message:'{VALUE} is not supported'},
      default:""
     
    },
    customerAccountName: {
      type: String,
    },
    customerAccountNumber: {
      type: String,
    },
    customerSortCode: {
      type: String,
    },
    googleEmailRenewCampaign: {
      type: String,
      enum:{values:["N/A","Needs to be set up", ""],message:'{VALUE} is not supported'} ,
       default:""
    },
    customerSignature: {
      type: String,
      // required: true,
    },
    renewalDate2024: {
      type: Date,
    },
    increase: {
      type: Number,
      // required: true,
    },
    expected2024OrderValue: {
      type: Number,
      // required: true,
    },
    numberOfKeyPhrase: {
      type: Number,
    },
    numberOfKeyAreas: {
      type: Number,
    },
    cashFlow: {
      type: Number,
      // required: true,
    },
    ddSetUp: {
      type: String,
      enum:{values:["Done","", "N/A"],message:'{VALUE} is not supported'} ,
      default:""
    },
    invoiceSent: {
      type: String,
      // enum:["Done","","N/A"],
    },
    // generalMaster:{

    //     type: String,
    // },
    vatInvoice: {
      type: [String],
    },
    buildingAddress: {
      type: String,
    },
    updates: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Update',
    }],
    
  },
  { timestamps: true }
);

orderSchema.pre("save", async function (next) {
  const order = this;
  if (order.isNew && !order.orderNo) {
    try {
      const lastorder = await mongoose
        .model("Order")
        .findOne()
        .sort({ orderNo: -1 });
        console.log("order",lastorder);
      let newOrderNo = "HOM101";
      if (lastorder && lastorder.orderNo) {
        const lastOrderNo = lastorder.orderNo;
        const lastOrder = lastOrderNo.startsWith("HOM")
          ? parseInt(lastOrderNo.replace("HOM", ""), 10)
          : null;
        if (lastOrder !== null) {
          let found = true;
          let nextOrder = lastOrder + 1;
          while (found) {
            const potentialOrderNo = "HOM" + nextOrder;
            const existingOrderNo = await mongoose
              .model("Order")
              .findOne({ orderNo: potentialOrderNo });
            if (!existingOrderNo) {
              found = false;
              newOrderNo = potentialOrderNo;
            } else {
              nextOrder++;
            }
          }
        }
      }

      order.orderNo = newOrderNo;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});




const Order = mongoose.model("Order", orderSchema);

export default Order;
