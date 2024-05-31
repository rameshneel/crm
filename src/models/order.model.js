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
    customer:{
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      },
      dateOfOrder:{
       type:Date
      },
    orderType: {
        type:String,
        enum: ["Renewal","New Business"],
        required: true,
    },
    orderNo: {
        type: String,
      
    },
    renewalStatus: {
        type:String,
        enum: ["Meeting Booked","Sold","Dropped","Still to Contact","Hosting Only"],
       
    },
    renewalNotes: {
        type: String,
    },
    renewalValue: {
        type: Number,
    },
    renewalApptDandT: {
        type: String
    },
    dateOfOrder: {
        type:String,
        required: true,
    },
    orderValue: {
        type: Number,
        required: true,
    },
    deposit: {
        type: Number,
        required: true,
    },
    numberOfInstallments: {
        type: Number,
        required: true,
    },
    DdMonthly:{
        type: Number,
       
    },
    DdChange:{
        type: Number,
       
    },
    dateOfFirstDd:{
        type: String,
       
    },
    depositMethod:{
        type: String,
        enum: ["Cash Cheque","Direct","Direct Debit","N/A","Square Card Machine","SumUp"]
    },
    customerAccountName:{
        type: String
    },
    customerAccountNumber:{
        type: String
    },
    customerSortCode:{
        type: String
    },
    customerSortCode:{
        type: String
    },
    googleEmailRenewCampaign:{
        type: String,
        enum: ["N/A","Needs to be set up"]
    },
    customerSignature:{
        type: String
    },
    renewalDate2024:{
        type: String,
        required: true,
    },
    increase:{
        type: String,
       
    },
    expected2024OrderValue:{
        type: String,
       
    },
    numberOfKeyPhrase:{
        type: String,
    },
    numberOfKeyAreas:{
        type: String,
    },
    cashFlow:{
        type:Number
    },
    ddSetUp:{
        type: String,
        enum: ["Done","Blank","N/A"]
    },
    invoiceSent:{
        type: String,
        enum:["Done","N/A","Blank"]
    },
    generalMaster:{
        type: String,
    },
    vatInvoice:{
        type: String,
    },
    buildingAddress:{
      type: String,
    },
     // for customer database

    // contactName: {
    //     type: String,
    //     // required: true , just for testing
    //   },
    //   mobileNo: {
    //     type: String,
    //   },
    //   landlineNo: {
    //     type: String,
    //   },
    //   customerEmail: {
    //     type: String,
    //     required: true,
    //     // // unique: true,
    //     lowercase: true,
    //     trim: true,
    //   },
      // buildingAddress:{
      //   type: String,
      // },
    //   streetNoName: {
    //     type: String,
    //     // required: true,
    //   },
    //   town: {
    //     type: String,
    //   },
    //   county :{
    //     type: String,
    //   },
    //   postcode :{
    //     type: String,
    //   },

  },
  { timestamps: true }
);

orderSchema.pre('save', async function (next) {
    const order = this;
    if (order.isNew && !order.orderNo) { // Ensure customerNo is not already set
      try {
        const lastorder = await mongoose.model('Order').findOne().sort({ orderNo: -1 });
        let newOrderNo = 'HOM101';
        if (lastorder && lastorder.orderNo) {
          const lastOrderNo = lastorder.orderNo;
          const lastOrder = lastOrderNo.startsWith('HOM') ? parseInt(lastOrderNo.replace('HOM', ''), 10) : null;
          if (lastOrder !== null) {
            let found = true;
            let nextOrder = lastOrder + 1;
            while (found) {
              const potentialOrderNo = 'HOM' + nextOrder;
              const existingOrderNo = await mongoose.model('Order').findOne({ orderNo: potentialOrderNo });
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

  // orderSchema.pre('save', async function (next) {
  //   const order = this;
  //   if (order.isNew && !order.orderNo) {
  //     try {
  //       const lastOrder = await mongoose.model('Order').findOne().sort({ orderNo: -1 });
  //       let newOrderNo = 'HOM101';
  //       if (lastOrder && lastOrder.orderNo) {
  //         const lastOrderNo = lastOrder.orderNo;
  //         const lastOrder = lastOrderNo.startsWith('HOM') ? parseInt(lastOrderNo.replace('HOM', ''), 10) : null;
  //         if (lastOrder !== null) {
  //           let found = true;
  //           let nextOrder = lastOrder + 1;
  //           while (found) {
  //             const potentialOrderNo = 'HOM' + nextOrder;
  //             const existingOrderNo = await mongoose.model('Order').findOne({ orderNo: potentialOrderNo });
  //             if (!existingOrderNo) {
  //               found = false;
  //               newOrderNo = potentialOrderNo;
  //             } else {
  //               nextOrder++;
  //             }
  //           }
  //         }
  //       }
  
  //       order.orderNo = newOrderNo;
  //       next();
  //     } catch (error) {
  //       next(error);
  //     }
  //   } else {
  //     next();
  //   }
  // });
  
const Order = mongoose.model("Order", orderSchema);

export default Order;