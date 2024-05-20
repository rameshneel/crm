import mongoose from "mongoose";

const newCustomerSchema = new mongoose.Schema(
  {
    customer: {
      type: String,
      required: true,
    },
    typeOfCustomer: {
      type: String,
      enum: ["Renewal", "New Customer", "Existing HOM Customer"],
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
      enum: ["N/A", "No", "Yes"],
      required: true,
    },
    registrarName: {
      type: String,
      required: function () {
        return this.domainTransferred === "No";
      },
    },
    // username: {
    //   type: String,
    //   required: function () {
    //     return this.domainTransferred === "No";
    //   },
    // },
    // password: {
    //   type: String,
    //   required: function () {
    //     return this.domainTransferred === "No";
    //   },
    // },
    customerEmails: {
      type: {
        type: String,
        enum: [
          "Create New Company Emails",
          "Existing Emails Attached to Domain",
          "N/A - Customer Has Their Own",
        ],
        required: true,
      },
      emailsToBeCreated: {
        type: String,
        required: function () {
          return this.customerEmails.type === "Create New Company Emails";
        },
      },
      existingEmailsAttached: {
        type: String,
        required: function () {
          return (
            this.customerEmails.type === "Existing Emails Attached to Domain"
          );
        },
      },
    },
    theme: {
      type: String,
    },
    colours: {
      type: String,
    },
    companyLogo: {
      type: String,
      enum: [
        "create new company logo",
        "logo file attached in monday",
        "take from current website",
        "added logo to general master",
      ],
    },
    images: {
      type: String,
      enum: [
        "client to send",
        "images attached in Monday.com",
        "photographer to be booked",
        "take from current website",
      ],
    },
    notesForDesign: {
      type: String,
    },
    copywriterRequired: {
      type: String,
      enum: ["Yes", "No"],
    },
    contentRequired: {
      type: String,
      required: function () {
        return this.copywriterRequired === "Yes";
      },
    },
    customerPostcode: {
      type: String,
      required: true,
    },
    customerPhoneNumber: {
      type: String,
      required: true,
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
    blogToBeAdded: {
      type: String,
      enum: ["Yes", "No"],
      required: true,
    },
    preferredPageNamesForBlog: {
      type: String,
      required: function () {
        return this.blogToBeAdded === "Yes";
      },
    },
    googleReviews: {
      type: {
        type: String,
        enum: ["Currently Live", "New Set-Up Required", "Yes"],
        required: true,
      },
      linkToCurrentGoogleReviews: {
        type: String,
        required: function () {
          return this.googleReviews.type === "Currently Live";
        },
      },
    },
    contactInformation: {
      type: {
        type: String,
        enum: ["New Contact Information", "Use From Current Website"],
        required: true,
      },
      newContactInformation: {
        type: String,
        required: function () {
          return this.contactInformation.type === "New Contact Information";
        },
      },
    },
    notesForCopywriter: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const NewCustomer = mongoose.model("NewCustomer", newCustomerSchema);

export default NewCustomer;

// import mongoose from "mongoose";

// const formSchema = new mongoose.Schema(
//   {
//     customer: {
//       type: String,
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
//       // required: true,
//     },
//     companyLogo: {
//       type: [String],
//       enum: [
//         "create new company logo",
//         "logo file attached in monday",
//         "take from current website",
//         "added logo to general master",
//       ],
//     },
//     images: {
//       type: [String],
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
//   },
//   { timestamps: true }
// );

// const NewCustomer = mongoose.model("NewCustomer", formSchema);

// export default NewCustomer;
