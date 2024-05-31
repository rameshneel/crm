import mongoose, { Schema } from "mongoose";

const techincalMasterSchema = new Schema({
  customer: {
     type: Schema.Types.ObjectId, 
     ref: "Customer", 
     required: true 
    },
    createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
    url: {
      type: String,
      required: true 
    },
  registerar:{ 
    type: String, 
    required: true 
  },
  managedBy:{
    type: String,
    enum: [
      "Client",
      "High Oaks Media",
      "The directory guys",
      "Darker IT Solutions",
      "yell.com",
      "easyspace",
      "PUK",
    ],
    required: true,
  },
  domainExpiryDate: { 
    type: Date, 
    required: true 
  },
  websiteHostedBy:{
    type: String,
    enum: [
      "High Oaks Media",
      "client",
      "not known",
      "promote",
      "PUK old server",
      "thundercloud",
      "the directory guys",
    ],
    required: true,
  },
  whoHostsEmail: {
    type: String,
    enum: [
      "HOM/webmail",
      "promote",
      "HOM/Gmail",
      "HOM/ox app suite",
      "client",
      "HOM/Microsoft",
      "N/A",
    ],
    required: true,
  },
  notes: { 
    type: String, 
  },
});

const TechincalMaster = mongoose.model(
  "TechincalMaster",
  techincalMasterSchema
);

export default TechincalMaster;
