import mongoose from "mongoose";

const newWebsiteContentSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    typeOfCustomer: {
      type: String,
      enum: ["Renewal", "New Customer", "Existing HOM Customer", ""],
      default: "",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    currentDomain: {
      type: String,
    },
    newDomain: {
      type: String,
    },
    domainTransferred: {
      type: String,
      enum: ["N/A", "No", "Yes", ""],
      default: "",
    },
    registrarName: {
      type: String,
    },
    domainInfo: {
      type: String,
    },
    customerEmails: {
      type: String,
      enum: {
        values: [
          "Create New Company Emails",
          "Existing Emails Attached to Domain",
          "N/A - Customer Has Their Own",
          "",
        ],
        message: "{VALUE} is not supported",
      },
      default: "",
    },
    emailsToBeCreated: {
      type: String,
    },
    existingEmailsAttached: {
      type: String,
    },
    socialMedia: {
      type: [String],
    },
    keyPhrasesAgreed: {
      type: [String],
    },
    keyAreasAgreed: {
      type: [String],
    },
    theme: {
      type: String,
    },
    colours: {
      type: String,
    },
    blogToBeAdded: {
      type: String,
      enum: ["Yes", "No", ""],
      default: "",
    },
    preferredPageNamesForBlog: {
      type: String,
    },
    keywordforblogposts: {
      type: String,
    },
    companyLogo: {
      type: String,
      enum: {
        values: [
          "create new company logo",
          "logo file attached in monday",
          "take from current website",
          "added logo to general master",
          "",
        ],
        message: "{values} is not supported",
      },
      default: "",
    },
    images: {
      type: String,
      enum: [
        "client to send",
        "images attached in Monday.com",
        "photographer to be booked",
        "take from current website",
        "",
      ],
      default: "",
    },
    pageName: {
      type: String,
    },
    googleReviews: {
      type: String,
      enum: ["Currently Live", "New Set-Up Required", "Yes", ""],
      default: "",
    },
    linkToCurrentGoogleReviews: {
      type: String,
    },
    isCopywriterRequired: {
      type: String,
      enum: { values: ["Yes", "No", ""], message: "{values} is not supported" },
      default: "",
    },
    contentRequired: {
      type: String,
    },
    contactInformation: {
      type: String,
      enum: {
        values: ["New Contact Information", "Use From Current Website", ""],
        message: "{values} is not supported",
      },
      default: "",
    },
    newContactInformation: {
      type: String,
    },
    notesForDesign: {
      type: String,
    },
    notesForCopywriter: {
      type: String,
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const NewWebsiteContent = mongoose.model(
  "NewWebsiteContent",
  newWebsiteContentSchema
);

export default NewWebsiteContent;


// import mongoose from "mongoose";

// const newWebsiteContentSchema = new mongoose.Schema(
//   {
//     customer: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     typeOfCustomer: {
//       type: String,
//       enum: ["Renewal", "New Customer", "Existing HOM Customer",""],
//       required: true,
//     },

//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     currentDomain: {
//       type: String,
//     },
//     newDomain: {
//       type: String,
//     },
//     domainTransferred: {
//       type: {
//         type: String,
//         enum: ["N/A", "No", "Yes"],
//       },
//       registrarName: {
//         type: String,
//         function () {
//           return this.domainTransferred === "No";
//         },
//       },
//     },
//     domainInfo: {
//       type: String,
//     },
//     customerEmails: {
//       type: {
//         type: String,
//         enum: [
//           "Create New Company Emails",
//           "Existing Emails Attached to Domain",
//           "N/A - Customer Has Their Own",
//         ],
//       },
//       emailsToBeCreated: {
//         type: String,
//         function () {
//           return this.customerEmails.type === "Create New Company Emails";
//         },
//       },
//       existingEmailsAttached: {
//         type: String,
//         function () {
//           return (
//             this.customerEmails.type === "Existing Emails Attached to Domain"
//           );
//         },
//       },
//     },
//     socialMedia: {
//       type: [String],
//     },
//     keyPhrasesAgreed: {
//       type: [String],
//     },
//     keyAreasAgreed: {
//       type: [String],
//     },
//     theme: {
//       type: String,
//     },
//     colours: {
//       type: String,
//     },
//     blogToBeAdded: {
//       type:{
//         type: String,
//         enum: ["Yes", "No"],
//       },
//       preferredPageNamesForBlog: {
//         type: String,
//         function () {
//           return this.blogToBeAdded === "Yes";
//         },
//       },
//     },
//     keywordforblogposts:{
//       type: String,
//     },
//     companyLogo: {
//       type: String,
//       enum: [
//         "create new company logo",
//         "logo file attached in monday",
//         "take from current website",
//         "added logo to general master",
//       ],
//     },
//     images: {
//       type: String,
//       enum: [
//         "client to send",
//         "images attached in Monday.com",
//         "photographer to be booked",
//         "take from current website",
//       ],
//     },
//     pageName:{
//       type: String,
//     },
//     googleReviews: {
//       type: {
//         type: String,
//         enum: ["Currently Live", "New Set-Up Required", "Yes"],
//       },
//       linkToCurrentGoogleReviews: {
//         type: String,
//         function () {
//           return this.googleReviews.type === "Currently Live";
//         },
//       },
//     },
//     isCopywriterRequired: {
//       type: String,
//       enum: ["Yes", "No",""],
//     },
//     contentRequired: {
//       type: String,
//       function () {
//         return this.copywriterRequired === "Yes";
//       },
//     },
//     contactInformation: {
//       type: {
//         type: String,
//         enum: ["New Contact Information", "Use From Current Website"],
//       },
//       newContactInformation: {
//         type: String,
//         function () {
//           return this.contactInformation.type === "New Contact Information";
//         },
//       },
//     },
//     notesForDesign: {
//       type: String,
//     },
//     notesForCopywriter: {
//       type: String,
//     },

//     updated_by:
//     {
//       type: mongoose.Schema.Types.ObjectId,
//        ref: "User",
//       },

//   },
//   { timestamps: true }
// );

// const NewWebsiteContent = mongoose.model("NewWebsiteContent", newWebsiteContentSchema);

// export default NewWebsiteContent;

// import mongoose from "mongoose";

// const newWebsiteSchema = new mongoose.Schema(
//   {
//     customer: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     typeOfCustomer: {
//       type: String,
//       enum: ["Renewal", "New Customer", "Existing HOM Customer"],
//       required: true,
//     },
//     currentDomain: {
//       type: String,
//     },
//     newDomain: {
//       type: String,
//     },
//     domainInfo: {
//       type: String,
//     },
//     domainTransferred: {
//       type: String,
//       enum: ["N/A", "No", "Yes"],
//       required: true,
//     },
//     registrarName: {
//       type: String,
//       required: function () {
//         return this.domainTransferred === "No";
//       },
//     },

//     // username: {
//     //   type: String,
//     //   required: function () {
//     //     return this.domainTransferred === "No";
//     //   },
//     // },
//     // password: {
//     //   type: String,
//     //   required: function () {
//     //     return this.domainTransferred === "No";
//     //   },
//     // },

//     customerEmails: {
//       type: {
//         type: String,
//         enum: [
//           "Create New Company Emails",
//           "Existing Emails Attached to Domain",
//           "N/A - Customer Has Their Own",
//         ],
//         required: true,
//       },
//       emailsToBeCreated: {
//         type: String,
//         required: function () {
//           return this.customerEmails.type === "Create New Company Emails";
//         },
//       },
//       existingEmailsAttached: {
//         type: String,
//         required: function () {
//           return (
//             this.customerEmails.type === "Existing Emails Attached to Domain"
//           );
//         },
//       },
//     },
//     theme: {
//       type: String,
//     },
//     colours: {
//       type: String,
//     },
//     companyLogo: {
//       type: String,
//       enum: [
//         "create new company logo",
//         "logo file attached in monday",
//         "take from current website",
//         "added logo to general master",
//       ],
//     },
//     images: {
//       type: String,
//       enum: [
//         "client to send",
//         "images attached in Monday.com",
//         "photographer to be booked",
//         "take from current website",
//       ],
//     },
//     notesForDesign: {
//       type: String,
//     },
//     pageName:{
//       type: String,
//     },
//     emailCurrent:{
//      type:String
//     },
//     productFlowStatus:{
//       type:String
//     },
//     productFlow:{
//       type:String
//     },
//     techincalMaster:{
//       type:String
//     },
//     copywriterTracker:{
//       type:String
//     },
//     copywriterRequired: {
//       type: String,
//       enum: ["Yes", "No"],
//     },
//     contentRequired: {
//       type: String,
//       required: function () {
//         return this.copywriterRequired === "Yes";
//       },
//     },
//     customerPostcode: {
//       type: String,
//       required: true,
//     },
//     customerPhoneNumber: {
//       type: String,
//       required: true,
//     },
//     socialMedia: {
//       type: [String],
//     },
//     keyPhrasesAgreed: {
//       type: [String],
//     },
//     keyAreasAgreed: {
//       type: [String],
//     },
//     blogToBeAdded: {
//       type: String,
//       enum: ["Yes", "No"],
//       required: true,
//     },
//     preferredPageNamesForBlog: {
//       type: String,
//       required: function () {
//         return this.blogToBeAdded === "Yes";
//       },
//     },
//     googleReviews: {
//       type: {
//         type: String,
//         enum: ["Currently Live", "New Set-Up Required", "Yes"],
//         required: true,
//       },
//       linkToCurrentGoogleReviews: {
//         type: String,
//         required: function () {
//           return this.googleReviews.type === "Currently Live";
//         },
//       },
//     },
//     contactInformation: {
//       type: {
//         type: String,
//         enum: ["New Contact Information", "Use From Current Website"],
//         required: true,
//       },
//       newContactInformation: {
//         type: String,
//         required: function () {
//           return this.contactInformation.type === "New Contact Information";
//         },
//       },
//     },
//     notesForCopywriter: {
//       type: String,
//     },
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     updated_by:
//     {
//       type: mongoose.Schema.Types.ObjectId,
//        ref: "User",
//       },

//   },
//   { timestamps: true }
// );

// const NewWebsite = mongoose.model("NewWebsite", newWebsiteSchema);

// export default NewWebsite;
