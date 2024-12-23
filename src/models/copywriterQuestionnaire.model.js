import mongoose from "mongoose";
const { Schema, model } = mongoose;

const copywriterQuestionnaireSchema = new Schema({
  customer: { type: String, required: true },
  createdBy: { type: String, required: true },
  companyFormed: {
    type: String,
    enum: [
      "Family-Run Business",
      "2nd Generation Business",
      "3rd Generation Business",
      "4th Generation Business",
      "Other (Please state below)",
    ],
    required: true,
  },
  companySize: {
    type: String,
    enum: [
      "Small (1 to 9 employees)",
      "Medium (10 to 19 employees)",
      "Large (20+ employees)",
      "Other (Please state below)",
    ],
    required: true,
  },
  companyLocation: { type: String, required: true },
  yearsOfExperience: { type: String, required: true },
  serviceRegions: { type: [String], required: true },
  companyDescription: { type: String, required: true },
  customers: { type: [String], required: true },
  contentPerspective: {
    type: String,
    enum: ["I, Me, My, etc.", "We, Us, Our, etc."],
    required: true,
  },
  uniqueSellingPoints: { type: [String], required: true },
  serviceAttributes: { type: String },
  additionalServices: { type: String },
  specialistTools: { type: String },
  problemSolvingCapabilities: { type: [String], required: true },
  emergencyServices: {
    type: String,
    enum: [
      "24-Hour Emergency Service",
      "Emergencies Prioritised in Normal Hours Only",
    ],
  },
  inHouseTrades: {
    type: String,
    enum: ["Yes", "No"],
    required: true,
  },
  usesSubcontractors: {
    type: String,
    enum: ["Yes", "No"],
    required: true,
  },
  mentionSubcontractors: {
    type: String,
    enum: ["Yes", "No"],
    required: true,
  },
  manufacturesProducts: { type: String },
  associatedBrands: { type: String, required: true },
  premisesType: {
    type: String,
    enum: ["New option", "Office", "Others", "Previous jobs", "Showroom"],
  },
  guaranteeDetails: { type: String },
  insuranceLevels: { type: String, required: true },
  tradeAssociations: { type: String, required: true },
  staffQualifications: { type: String, required: true },
  additionalCompanyInfo: { type: String },
  voiceType: { type: String, required: true },
  nationwideCoverage: { type: String, required: true },
  submissionDate: { type: Date, default: Date.now },
});

// Create an index on the customer field for quick lookup
copywriterQuestionnaireSchema.index({ customer: 1 });

const CopywriterQuestionnaire = model(
  "CopywriterQuestionnaire",
  copywriterQuestionnaireSchema
);

export default CopywriterQuestionnaire;



























// import mongoose from "mongoose";
// const { Schema, model } = mongoose;

// // Define the schema for the copywriter questionnaire
// const copywriterQuestionnaireSchema = new Schema({
//   groupTitle: { type: String },
//   name: { type: String, required: true },
//   companyFormed: { type: String },
//   companySize: {
//     type: String,
//     enum: [
//       "Small (1 to 9 employees)",
//       "Medium (10 to 49 employees)",
//       "Large (50+ employees)",
//     ],
//   },
//   companyLocation: { type: String },
//   yearsOfExperience: { type: String },
//   serviceRegions: { type: [String] },
//   companyDescription: { type: String },
//   specialties: { type: [String] },
//   keySellingPoints: { type: [String] },
//   workExamples: { type: String },
//   customerTypes: { type: [String] },
//   warrantyInformation: { type: String },
//   additionalInformation: { type: String },
//   submissionDate: { type: Date, default: Date.now },
//   otherField1: { type: String },
//   otherField2: { type: String },
// });

// // Create an index on the name field for quick lookup
// copywriterQuestionnaireSchema.index({ name: 1 });

// // Compile the schema into a model
// const CopywriterQuestionnaire = model(
//   "CopywriterQuestionnaire",
//   copywriterQuestionnaireSchema
// );

// export default CopywriterQuestionnaire;

// import mongoose from "mongoose";
// const { Schema, model } = mongoose;

// // Define the schema for the copywriter questionnaire
// const copywriterQuestionnaireSchema = new Schema({
//   name: { type: String, required: true },
//   companyFormed: { type: String, required: true },
//   companySize: {
//     type: String,
//     enum: ["Small", "Medium", "Large"],
//     required: true,
//   },
//   companyLocation: { type: String, required: true },
//   yearsOfExperience: { type: String, required: true },
//   serviceRegions: { type: [String], required: true },
//   companyDescription: { type: String, required: true },
//   specialties: { type: [String], required: true },
//   keySellingPoints: { type: [String], required: true },
//   workExamples: { type: String },
//   customerTypes: { type: [String], required: true },
//   warrantyInformation: { type: String },
//   additionalInformation: { type: String },
//   submissionDate: { type: Date, default: Date.now },
// });

// // Create an index on the name field for quick lookup
// copywriterQuestionnaireSchema.index({ name: 1 });

// // Compile the schema into a model
// const CopywriterQuestionnaire = model(
//   "CopywriterQuestionnaire",
//   copywriterQuestionnaireSchema
// );

// export default CopywriterQuestionnaire;
