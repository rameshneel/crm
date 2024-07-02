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
      required: true,
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
      // required: true,
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
      enum:{values:["","IN PROCESS","LIVE","SITE TAKEN DOWN","SUSPENDED","UPLOAD","WILL GET CANCELLED"],message:'{VALUE} is not supported'} ,
      default:""
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
    updates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Update',
  }],
  },
  {
    timestamps: true,
  }
);

customerSchema.pre('save', async function (next) {
  const customer = this;
  if (customer.isNew && !customer.customerNo) { 
    try {
      const lastCustomer = await mongoose.model('Customer').findOne().sort({ customerNo: +1 });
      let newCustomerNo = 'HOM:101';
      if (lastCustomer && lastCustomer.customerNo) {
        const lastCustomerNo = lastCustomer.customerNo;
        const lastNumber = lastCustomerNo.startsWith('HOM:') ? parseInt(lastCustomerNo.replace('HOM:', ''), 10) : null;
        if (lastNumber !== null) {
          let found = true;
          let nextNumber = lastNumber + 1;
          while (found) {
            const potentialCustomerNo = 'HOM:' + nextNumber;
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
      next(error); 
    }
  } else {
    next();
  }
});


const Customer = mongoose.model("Customer", customerSchema);

export default Customer;


