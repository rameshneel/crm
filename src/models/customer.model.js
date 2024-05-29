import mongoose from "mongoose";

const { Schema } = mongoose;

const customerSchema = new Schema(
  {
    customerNo: {
      type: String,
      unique: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
     
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
   
    },
    companyName: {
      type: String,
      // required: true, just fo
    },
    contactName: {
      type: String,
      // required: true , just for testing
    },
    mobileNo: {
      type: String,
    },
    landlineNo: {
      type: String,
    },
    customerEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    streetNoName: {
      type: String,
      // required: true,
    },
    town: {
      type: String,
    },
    county :{
      type: String,
    },
    postcode :{
      type: String,
    },
    url :{
      type: String,
      // required: true,
    },
    status :{
      type: String,
      enum: ["In Process","Live","Site Taken Down","Suspended","Upload","Will Get Cancelled"],
    },
    liveDate :{
      type: Date,
    },
    ssl :{
      type: String,
    },
    sitemap :{
      type: String,
    },
    htAccess :{
      type: String,
    },
    gaCode :{
      type: String,
    },
    newGACode :{
      type: String,
    },
    logo :{
      type: String,
    },
    vatInvoice :{
      type: String,
    },
    ordersRenewals:{
      type: String,
    },
  },
  {
    timestamps: true,
  }
);


// customerSchema.pre('save', async function (next) {
//   const customer = this;
//   if (customer.isNew) {
//     const lastCustomer = await mongoose.model('Customer').findOne().sort({ CustomerNo: -1 });
//     let newCustomerNo = 'HOM101';
//     if (lastCustomer && lastCustomer.customerNo) {
//       const lastCustomerNo = lastCustomer.customerNo;
//       const lastNumber = lastCustomerNo.startsWith('HOM') ? parseInt(lastCustomerNo.replace('HOM', ''), 10) : null;
//       if (lastNumber !== null) {
//         let found = true;
//         let nextNumber = lastNumber + 1;
//         while (found) {
//           const potentialCustomerNo = 'HOM' + nextNumber;
//           const existingCustomer = await mongoose.model('Customer').findOne({ customerNo: potentialCustomerNo });
//           if (!existingCustomer) {
//             found = false;
//             newCustomerNo = potentialCustomerNo;
//           } else {
//             nextNumber++;
//           }
//         }
//       }
//     }

//     customer.customerNo = newCustomerNo;
//   }
//   next();
// });


customerSchema.pre('save', async function (next) {
  const customer = this;
  if (customer.isNew && !customer.customerNo) { // Ensure customerNo is not already set
    try {
      const lastCustomer = await mongoose.model('Customer').findOne().sort({ customerNo: -1 });
      let newCustomerNo = 'HOM101';
      if (lastCustomer && lastCustomer.customerNo) {
        const lastCustomerNo = lastCustomer.customerNo;
        const lastNumber = lastCustomerNo.startsWith('HOM') ? parseInt(lastCustomerNo.replace('HOM', ''), 10) : null;
        if (lastNumber !== null) {
          let found = true;
          let nextNumber = lastNumber + 1;
          while (found) {
            const potentialCustomerNo = 'HOM' + nextNumber;
            const existingCustomer = await mongoose.model('Customer').findOne({ customerNo: potentialCustomerNo });
            if (!existingCustomer) {
              found = false;
              newCustomerNo = potentialCustomerNo;
            } else {
              nextNumber++;
            }
          }
        }
      }

      customer.customerNo = newCustomerNo;
      next();
    } catch (error) {
      next(error); // Pass any errors to the next middleware
    }
  } else {
    next(); // If customerNo is already set or isNew is false, proceed to the next middleware
  }
});


const Customer = mongoose.model("Customer", customerSchema);

export default Customer;








// import mongoose from "mongoose";

// const { Schema } = mongoose;

// const customerSchema = new Schema(
//   {
//     // customerNo: {
//     //   type: String,
//     //   required: true,
//     //   unique: true
//     // },
     
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required:true
//     },
//     companyName: {
//       type: String,
//       required: true,
//     },
//     contactName: {
//       type: String,
//       required: true,
//     },
//     mobileNo: {
//       type: String,
//       required: true,
//     },
//     phoneNo: {
//       type: String,
//     },
  
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//       trim: true,
//     },
//     address: {
//       type: String,
//     },
//     hasLead: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// const Customer = mongoose.model("Customer", customerSchema);

// export default Customer;
