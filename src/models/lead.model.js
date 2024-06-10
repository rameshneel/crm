import mongoose from "mongoose";

const { Schema } = mongoose;

const LeadSchema = new Schema(
  {
    customer_id: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: function() {
        return !this.customerName;
      },
     
    },
    customerName :{
      type: String,
      required: function() {
        return !this.customer_id;
      },
    },
    generated_by: 
    { 
      type: Schema.Types.ObjectId,
       ref: "User",
       
      },
      updated_by: 
    { 
      type: Schema.Types.ObjectId,
       ref: "User",
      },
    lead_type: {
      type:String,
      enum: ["","Referal","Cold call","Contact Metting","Old Client","Promate Client","Renewal"],
       default: ""
    },
    // existing_website: {
    //   type: String,
    // },
    outcome:{
       type :String,
       enum: ["","Appointement Made","Callback","Not Interseted","SOLD","Arrange an Appointment"],
        default: ""
    },
    Appointement:{
      type: Schema.Types.ObjectId,
      ref: "Appointment",
    },
    orderForecast :{
      type:Number
    },
    notes: {
      type: String,
    },
    contactPerson :{
      type: String,
     
    },
    mobileNumber :{
      type: String,
    },
    landlineNumber :{
      type: String,
    },
    currentWebsite :{
      type: String,

    },
    emailAddress :{
      type: String,
     
    },
   
    // status: {
    //   type: String,
    //   enum: ["Sell", "Not_Sell"],
    //   default: "Not_Sell",
    // },
  },
  { timestamps: true }
);

const Lead = mongoose.model("Lead", LeadSchema);

export default Lead;







// import mongoose from "mongoose";

// const { Schema } = mongoose;

// const LeadSchema = new Schema(
//   {
//     customer_id: {
//       type: Schema.Types.ObjectId,
//       ref: "Customer",
//       required: true,
//     },
//     generated_by: 
//     { 
//       type: Schema.Types.ObjectId,
//        ref: "User",
//         required: true 
//       },
//       updated_by: 
//     { 
//       type: Schema.Types.ObjectId,
//        ref: "User",
//       },
//     lead_type: {
//       type:String,
//       enum: ["Referal","Cold call","Contact Metting","Old Client","Promate Client","Renewal"],
//       required: true,
//     },
//     existing_website: {
//       type: String,
//     },
//     outcome:{
//        type :String,
//        enum: ["Appointement Made","Callback","Not Interseted","Sold"],
//        required: true,
//     },
//     Appointement:{
//       type: Schema.Types.ObjectId,
//       ref: "Appointment",
//     },
//     orderforced :{
//       type:Number
//     },
//     notes: {
//       type: String, 
//     },
//     status: {
//       type: String,
//       enum: ["Sell", "Not_Sell"],
//       default: "Not_Sell",
//     },
//   },
//   { timestamps: true }
// );

// const Lead = mongoose.model("Lead", LeadSchema);

// export default Lead;
