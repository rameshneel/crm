import mongoose, { Schema } from "mongoose";

const techincalMasterSchema = new Schema({
  customer: {
     type: Schema.Types.ObjectId, 
     ref: "Customer", 
    },
    createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
    url: {
      type: String,
     
    },
  registerar:{ 
    type: String, 
   
  },
  managedBy:{
    type: String,
    enum: [
      "Client",
      "High Oaks Media",
      "The Directory Guys",
      "Darker IT Solutions",
      "Yell.com",
      "Easyspace",
      "PUK"
    ],
   
  },
  domainExpiryDate: { 
    type: Date, 
   
  },
  websiteHostedBy:{
    type: String,
    enum: [
      "High Oaks Media",
      "Client",
      "Not Known",
      "Promote",
      "PUK Old Server",
      "ThunderCloud",
      "The Directory Guys",
    ],
   
  },
  whoHostsEmail: {
    type: String,
    enum: [
      "HOM/Webmail",
      "Promote",
      "HOM/Gmail",
      "HOM/Ox App Suite",
      "Client",
      "HOM/Microsoft",
      "N/A",
    ],
   
  },
  notes: { 
    type: String, 
  },
  updates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Update',
  }],
});

const TechincalMaster = mongoose.model(
  "TechincalMaster",
  techincalMasterSchema
);

export default TechincalMaster;
