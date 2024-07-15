import { isValidObjectId } from "mongoose";
import Customer from "../models/customer.model.js";
import NewWebsiteContent from "../models/newWebsiteContent.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const createNewWebsiteContent = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id;
  const { customerId } = req.params;

  if (!isValidObjectId(customerId)) {
    return next(new ApiError(400, "Invalid customer_id"));
  }

  const customer = await Customer.findById(customerId);
  if (!customer) {
    return next(new ApiError(404, "Customer does not exist"));
  }

  const {
    typeOfCustomer,
    currentDomain,
    newDomain,
    domainInfo,
    domainTransferred,
    registrarName,
    customerEmails,
    emailsToBeCreated,
    existingEmailsAttached,
    theme,
    colours,
    companyLogo,
    images,
    notesForDesign,
    pageName,
    isCopywriterRequired,
    contentRequired,
    socialMedia,
    keyPhrasesAgreed,
    keyAreasAgreed,
    blogToBeAdded,
    preferredPageNamesForBlog,
    googleReviews,
    linkToCurrentGoogleReviews,
    contactInformation,
    newContactInformation,
    notesForCopywriter,
  } = req.body;

  // Conditional checks
  if (domainTransferred === "No" && !registrarName) {
    return next(new ApiError(400, "Registrar name is required if domain is not transferred"));
  }

  if (customerEmails === "Create New Company Emails" && !emailsToBeCreated) {
    return next(new ApiError(400, "Emails to be created are required if creating new company emails"));
  }

  if (customerEmails === "Existing Emails Attached to Domain" && !existingEmailsAttached) {
    return next(new ApiError(400, "Existing emails attached are required if using existing emails"));
  }

  if (blogToBeAdded === "Yes" && !preferredPageNamesForBlog) {
    return next(new ApiError(400, "Preferred page names for blog are required if blog is to be added"));
  }

  if (googleReviews === "Currently Live" && !linkToCurrentGoogleReviews) {
    return next(new ApiError(400, "Link to current Google reviews is required if Google reviews are currently live"));
  }

  if (contactInformation === "New Contact Information" && !newContactInformation) {
    return next(new ApiError(400, "New contact information is required if using new contact information"));
  }

  if (isCopywriterRequired === "Yes" && !contentRequired) {
    return next(new ApiError(400, "Content required is needed if a copywriter is required"));
  }

  try {
    const newCustomer = await NewWebsiteContent.create({
      customer: customerId,
      typeOfCustomer,
      currentDomain,
      newDomain,
      domainInfo,
      domainTransferred,
      registrarName,
      customerEmails,
      emailsToBeCreated,
      existingEmailsAttached,
      theme,
      colours,
      companyLogo,
      images,
      notesForDesign,
      pageName,
      isCopywriterRequired,
      contentRequired,
      socialMedia,
      keyPhrasesAgreed,
      keyAreasAgreed,
      blogToBeAdded,
      preferredPageNamesForBlog,
      googleReviews,
      linkToCurrentGoogleReviews,
      contactInformation,
      newContactInformation,
      notesForCopywriter,
      createdBy: userId,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          newCustomer,
          "Website Content created successfully"
        )
      );
  } catch (error) {
    return next(error);
  }
});

const getAllNewWebsiteContent = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    let query = {};

    if (user.role === "salesman") {
      query = { createdBy: userId };
    } else if (user.role !== "admin") {
      return next(new ApiError(403, "You are not authorized to access this content"));
    }

    const newWebsiteContent = await NewWebsiteContent.find(query).populate({
      path: "createdBy",
      // select: user.role === "admin" ? "" : "fullName email avatar",
      select:"fullName email avatar",
    }).populate({
      path: "customer"
    }).sort({ createdAt: -1 });

    return res.status(200).json(
      new ApiResponse(200, { newWebsiteContent }, "New website content fetched successfully")
    );
    
  } catch (error) {
    console.error("Error in fetching website content:", error);
    return next(error);
  }
});

const getNewWebsiteContentById =asyncHandler( async (req, res,next) => {
  try {
    const customer = await NewWebsiteContent.findById(req.params.id);
    if (customer) {
      res
        .status(200)
        .json(new ApiResponse(200, customer, "Customer fetched successfully"));
    } else {
      res.status(404).json(new ApiResponse(404, null, "Customer not found"));
    }
  } catch (error) {
    console.error("Error in fetching customer by ID:", error);
    next(error)
    // if (error.kind === "ObjectId") {
    //   res.status(400).json(new ApiResponse(400, null, "Invalid customer ID"));
    // } else {
    //   res.status(500).json(new ApiResponse(500, null, "Internal Server Error"));
    // }
  }
});

const updateNewWebsiteContent = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return next(new ApiError(400, "Invalid ID"));
  }

  const newWebsiteContent = await NewWebsiteContent.findById(id);
  if (!newWebsiteContent) {
    return next(new ApiError(404, "New Website Content not found"));
  }

  // Ensure only the creator or an admin can update the content
  if (newWebsiteContent.createdBy.toString() !== userId && req.user.role !== 'admin') {
    return next(new ApiError(403, "You do not have permission to update this content"));
  }

  const updates = req.body;

  // Conditional checks
  if (updates.domainTransferred === "No" && !updates.registrarName) {
    return next(new ApiError(400, "Registrar name is required if domain is not transferred"));
  }

  if (updates.customerEmails === "Create New Company Emails" && !updates.emailsToBeCreated) {
    return next(new ApiError(400, "Emails to be created are required if creating new company emails"));
  }

  if (updates.customerEmails === "Existing Emails Attached to Domain" && !updates.existingEmailsAttached) {
    return next(new ApiError(400, "Existing emails attached are required if using existing emails"));
  }

  if (updates.blogToBeAdded === "Yes" && !updates.preferredPageNamesForBlog) {
    return next(new ApiError(400, "Preferred page names for blog are required if blog is to be added"));
  }

  if (updates.googleReviews === "Currently Live" && !updates.linkToCurrentGoogleReviews) {
    return next(new ApiError(400, "Link to current Google reviews is required if Google reviews are currently live"));
  }

  if (updates.contactInformation === "New Contact Information" && !updates.newContactInformation) {
    return next(new ApiError(400, "New contact information is required if using new contact information"));
  }

  if (updates.isCopywriterRequired === "Yes" && !updates.contentRequired) {
    return next(new ApiError(400, "Content required is needed if a copywriter is required"));
  }

  try {
    Object.keys(updates).forEach((key) => {
      newWebsiteContent[key] = updates[key];
    });

    newWebsiteContent.updated_by = userId;

    await newWebsiteContent.save();

    return res.status(200).json(new ApiResponse(200, newWebsiteContent, "Website Content updated successfully"));
  } catch (error) {
    return next(error);
  }
});

const deleteWebsiteContent = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id;
  const { customer_id } = req.params;

  if (!customer_id || !isValidObjectId(customer_id)) {
    return next(new ApiError(400, "Invalid or missing Customer ID"));
  }

  try {
    const customerContent = await NewWebsiteContent.findById(customer_id);

    if (!customerContent) {
      return next(new ApiError(404, "Customer content does not exist"));
    }

    // Check if the user is either the creator or an admin
    if (
      customerContent.createdBy.toString() !== userId.toString() &&
      !req.user.isAdmin
    ) {
      return next(
        new ApiError(403, "You are not authorized to delete this content")
      );
    }

    await customerContent.remove();

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Customer content deleted successfully"));
  } catch (error) {
    return next(error);
  }
});
 
export {
  createNewWebsiteContent,
  getAllNewWebsiteContent,
  getNewWebsiteContentById,
  updateNewWebsiteContent,
  deleteWebsiteContent,
};



// testing 

// const createNewWebsiteContent = asyncHandler(async (req, res, next) => {
//   const userId = req.user?._id;
//   const { customerId } = req.params;
 
//   if (!isValidObjectId(customerId)) {
//     return next(new ApiError(400, "Invalid customer_id"));
//   }
//   const customerI = await Customer.findById(customerId);
//   if (!customerI) {
//     return next(new ApiError(404, "customer does not exist"));
//   }

//   const {
//     typeOfCustomer,
//     currentDomain,
//     newDomain,
//     domainInfo,
//     domainTransferred,
//     registrarName,
//     customerEmails,
//     theme,
//     colours,
//     companyLogo,
//     images,
//     notesForDesign,
//     pageName,
//     contentRequired,
//     customerPostcode,
//     customerPhoneNumber,
//     socialMedia,
//     keyPhrasesAgreed,
//     keyAreasAgreed,
//     blogToBeAdded,
//     preferredPageNamesForBlog,
//     googleReviews,
//     contactInformation,
//     notesForCopywriter,
//     createdBy,
//   } = req.body;

//   try {
//     const newCustomer = await NewWebsiteContent.create({
//       customer: customerId,
//       typeOfCustomer,
//       currentDomain,
//       newDomain,
//       domainInfo,
//       domainTransferred,
//       registrarName,
//       customerEmails,
//       theme,
//       colours,
//       companyLogo,
//       images,
//       notesForDesign,
//       pageName,
//       // emailCurrent,
//       // productFlowStatus,
//       // productFlow,
//       // techincalMaster,
//       // copywriterTracker,
//       // copywriterRequired,
//       contentRequired,
//       customerPostcode,
//       customerPhoneNumber,
//       socialMedia,
//       keyPhrasesAgreed,
//       keyAreasAgreed,
//       blogToBeAdded,
//       preferredPageNamesForBlog,
//       googleReviews,
//       contactInformation,
//       notesForCopywriter,
//       createdBy: createdBy || userId,
//     });

//     return res
//       .status(201)
//       .json(
//         new ApiResponse(
//           201,
//           newCustomer,
//           "Website Content created successfully"
//         )
//       );
//   } catch (error) {
//     return next(error);
//   }
// });



// const getAllNewWebsiteConten = async (req, res,next) => {
//   const userId = req.user._id;
//   const user = await User.findById(userId);
//   try {
//     if (!user) {
//       throw new ApiError(404, "User not found");
//     }
//     let newWebsiteContent
//     if (
//       user.role=="admin"
//     ) {
//       newWebsiteContent = await NewWebsiteContent.find().populate({
//         path: "createdBy",
//       });
//     } else if (user.role === "salesman") {
//       newWebsiteContent = await NewWebsiteContent.find({ createdBy: activeUser }).populate({
//         path: "createdBy",
//         select: "name email",
//       });
//     }

//     return res.json(
//       new ApiResponse(200, { newWebsiteContent}, "newWebsiteContent fetched successfully")
//     );
    
//   } catch (error) {
//     console.error("Error in fetching customers:", error);
//     next(error);
//   }
// };




// const updateNewWebsiteContent = asyncHandler(async (req, res, next) => {
//   const userId = req.user._id;
//   const { id } = req.params;

//   if (!isValidObjectId(id)) {
//     return next(new ApiError(400, "Invalid ID"));
//   }

//   const newWebsiteContent = await NewWebsiteContent.findById(id);
//   if (!newWebsiteContent) {
//     return next(new ApiError(404, "New Website Content not found"));
//   }

//   // Ensure only the creator or an admin can update the content
//   if (newWebsiteContent.createdBy.toString() !== userId && req.user.role !== 'admin') {
//     return next(new ApiError(403, "You do not have permission to update this content"));
//   }

//   const {
//     typeOfCustomer,
//     currentDomain,
//     newDomain,
//     domainInfo,
//     domainTransferred,
//     registrarName,
//     customerEmails,
//     emailsToBeCreated,
//     existingEmailsAttached,
//     theme,
//     colours,
//     companyLogo,
//     images,
//     notesForDesign,
//     pageName,
//     contentRequired,
//     socialMedia,
//     keyPhrasesAgreed,
//     keyAreasAgreed,
//     blogToBeAdded,
//     preferredPageNamesForBlog,
//     googleReviews,
//     linkToCurrentGoogleReviews,
//     contactInformation,
//     newContactInformation,
//     notesForCopywriter,
//   } = req.body;

//   // Conditional checks
//   if (domainTransferred === "No" && !registrarName) {
//     return next(new ApiError(400, "Registrar name is required if domain is not transferred"));
//   }

//   if (customerEmails === "Create New Company Emails" && !emailsToBeCreated) {
//     return next(new ApiError(400, "Emails to be created are required if creating new company emails"));
//   }

//   if (customerEmails === "Existing Emails Attached to Domain" && !existingEmailsAttached) {
//     return next(new ApiError(400, "Existing emails attached are required if using existing emails"));
//   }

//   if (blogToBeAdded === "Yes" && !preferredPageNamesForBlog) {
//     return next(new ApiError(400, "Preferred page names for blog are required if blog is to be added"));
//   }

//   if (googleReviews === "Currently Live" && !linkToCurrentGoogleReviews) {
//     return next(new ApiError(400, "Link to current Google reviews is required if Google reviews are currently live"));
//   }

//   if (contactInformation === "New Contact Information" && !newContactInformation) {
//     return next(new ApiError(400, "New contact information is required if using new contact information"));
//   }

//   if (isCopywriterRequired === "Yes" && !contentRequired) {
//     return next(new ApiError(400, "Content required is needed if a copywriter is required"));
//   }

//   try {
//     newWebsiteContent.typeOfCustomer = typeOfCustomer || newWebsiteContent.typeOfCustomer;
//     newWebsiteContent.currentDomain = currentDomain || newWebsiteContent.currentDomain;
//     newWebsiteContent.newDomain = newDomain || newWebsiteContent.newDomain;
//     newWebsiteContent.domainInfo = domainInfo || newWebsiteContent.domainInfo;
//     newWebsiteContent.domainTransferred = domainTransferred || newWebsiteContent.domainTransferred;
//     newWebsiteContent.registrarName = registrarName || newWebsiteContent.registrarName;
//     newWebsiteContent.customerEmails = customerEmails || newWebsiteContent.customerEmails;
//     newWebsiteContent.emailsToBeCreated = emailsToBeCreated || newWebsiteContent.emailsToBeCreated;
//     newWebsiteContent.existingEmailsAttached = existingEmailsAttached || newWebsiteContent.existingEmailsAttached;
//     newWebsiteContent.theme = theme || newWebsiteContent.theme;
//     newWebsiteContent.colours = colours || newWebsiteContent.colours;
//     newWebsiteContent.companyLogo = companyLogo || newWebsiteContent.companyLogo;
//     newWebsiteContent.images = images || newWebsiteContent.images;
//     newWebsiteContent.notesForDesign = notesForDesign || newWebsiteContent.notesForDesign;
//     newWebsiteContent.pageName = pageName || newWebsiteContent.pageName;
//     newWebsiteContent.contentRequired = contentRequired || newWebsiteContent.contentRequired;
//     newWebsiteContent.socialMedia = socialMedia || newWebsiteContent.socialMedia;
//     newWebsiteContent.keyPhrasesAgreed = keyPhrasesAgreed || newWebsiteContent.keyPhrasesAgreed;
//     newWebsiteContent.keyAreasAgreed = keyAreasAgreed || newWebsiteContent.keyAreasAgreed;
//     newWebsiteContent.blogToBeAdded = blogToBeAdded || newWebsiteContent.blogToBeAdded;
//     newWebsiteContent.preferredPageNamesForBlog = preferredPageNamesForBlog || newWebsiteContent.preferredPageNamesForBlog;
//     newWebsiteContent.googleReviews = googleReviews || newWebsiteContent.googleReviews;
//     newWebsiteContent.linkToCurrentGoogleReviews = linkToCurrentGoogleReviews || newWebsiteContent.linkToCurrentGoogleReviews;
//     newWebsiteContent.contactInformation = contactInformation || newWebsiteContent.contactInformation;
//     newWebsiteContent.newContactInformation = newContactInformation || newWebsiteContent.newContactInformation;
//     newWebsiteContent.notesForCopywriter = notesForCopywriter || newWebsiteContent.notesForCopywriter;
//     newWebsiteContent.updated_by = userId;

//     await newWebsiteContent.save();

//     return res.status(200).json(new ApiResponse(200, newWebsiteContent, "Website Content updated successfully"));
//   } catch (error) {
//     return next(error);
//   }
// });






// const updateWebsiteContent = asyncHandler(async (req, res, next) => {
//   const userId = req.user?._id;
//   const { customer_id } = req.params;

//   if (!customer_id || !isValidObjectId(customer_id)) {
//     return next(new ApiError(400, "Invalid or missing Customer ID"));
//   }

//   const customerI = await Customer.findById(customer_id);
//   if (!customerI) {
//     return next(new ApiError(404, "Customer does not exist"));
//   }

//   const {
//     typeOfCustomer,
//     currentDomain,
//     newDomain,
//     domainInfo,
//     domainTransferred,
//     registrarName,
//     customerEmails,
//     theme,
//     colours,
//     companyLogo,
//     images,
//     notesForDesign,
//     pageName,
//     contentRequired,
//     customerPostcode,
//     customerPhoneNumber,
//     socialMedia,
//     keyPhrasesAgreed,
//     keyAreasAgreed,
//     blogToBeAdded,
//     preferredPageNamesForBlog,
//     googleReviews,
//     contactInformation,
//     notesForCopywriter,
//     updatedBy,
//   } = req.body;

//   try {
//     const updatedCustomer = await NewWebsiteContent.findByIdAndUpdate(
//       customer_id,
//       {
//         typeOfCustomer,
//         currentDomain,
//         newDomain,
//         domainInfo,
//         domainTransferred,
//         registrarName,
//         customerEmails,
//         theme,
//         colours,
//         companyLogo,
//         images,
//         notesForDesign,
//         pageName,
//         contentRequired,
//         customerPostcode,
//         customerPhoneNumber,
//         socialMedia,
//         keyPhrasesAgreed,
//         keyAreasAgreed,
//         blogToBeAdded,
//         preferredPageNamesForBlog,
//         googleReviews,
//         contactInformation,
//         notesForCopywriter,
//         updatedBy: updatedBy || userId,
//       },
//       { new: true, runValidators: true }
//     );

//     if (!updatedCustomer) {
//       return next(new ApiError(404, "Customer content not found"));
//     }

//     return res
//       .status(200)
//       .json(
//         new ApiResponse(
//           200,
//           updatedCustomer,
//           "Customer content updated successfully"
//         )
//       );
//   } catch (error) {
//     return next(error);
//   }
// });