import Customer from "../models/customer.model.js";
import NewWebsite from "../models/newWebsite.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// const createNewCustomer = async (req, res) => {
//   try {
//     const newCustomer = new NewCustomer(req.body);
//     const savedCustomer = await newCustomer.save();
//     res
//       .status(201)
//       .json(
//         new ApiResponse(
//           201,
//           savedCustomer,
//           "New customer form created successfully"
//         )
//       );
//   } catch (error) {
//     console.error("Error in creating new customer form:", error);
//     if (error.name === "ValidationError") {
//       const messages = Object.values(error.errors).map((err) => err.message);
//       res.status(400).json(new ApiResponse(400, null, messages.join(", ")));
//     } else {
//       res.status(500).json(new ApiResponse(500, null, "Internal Server Error"));
//     }
//   }
// };

const createNewCustomer = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id;
    const { customer_id } = req.params;
  if (!customer_id || !isValidObjectId(customer_id)) {
    return next(new ApiError(400, 'Invalid or missing Customer ID'));
  }

  if (!isValidObjectId(customer_id)) {
    return next(new ApiError(400, "Invalid customer_id"));
  }
  const customerI = await Customer.findById(customer_id);
  if (!customerI) {
    return next(new ApiError(404, 'customer does not exist'));
  }
  
  const {
    typeOfCustomer,
    currentDomain,
    newDomain,
    domainInfo,
    domainTransferred,
    registrarName,
    customerEmails,
    theme,
    colours,
    companyLogo,
    images,
    notesForDesign,
    pageName,
    emailCurrent,
    productFlowStatus,
    productFlow,
    techincalMaster,
    copywriterTracker,
    copywriterRequired,
    contentRequired,
    customerPostcode,
    customerPhoneNumber,
    socialMedia,
    keyPhrasesAgreed,
    keyAreasAgreed,
    blogToBeAdded,
    preferredPageNamesForBlog,
    googleReviews,
    contactInformation,
    notesForCopywriter,
  } = req.body;

  try {
    const newCustomer = await NewWebsite.create({
      customer:customer_id,
      typeOfCustomer,
      currentDomain,
      newDomain,
      domainInfo,
      domainTransferred,
      registrarName,
      customerEmails,
      theme,
      colours,
      companyLogo,
      images,
      notesForDesign,
      pageName,
      emailCurrent,
      productFlowStatus,
      productFlow,
      techincalMaster,
      copywriterTracker,
      copywriterRequired,
      contentRequired,
      customerPostcode,
      customerPhoneNumber,
      socialMedia,
      keyPhrasesAgreed,
      keyAreasAgreed,
      blogToBeAdded,
      preferredPageNamesForBlog,
      googleReviews,
      contactInformation,
      notesForCopywriter,
      createdBy: userId,
    });

    return res.status(201).json(new ApiResponse(201, newCustomer, 'Customer created successfully'));
  } catch (error) {
    return next(error);
  }
});

const getAllCustomers = async (req, res) => {
  try {
    const customers = await NewCustomer.find();
    res
      .status(200)
      .json(new ApiResponse(200, customers, "Customers fetched successfully"));
  } catch (error) {
    console.error("Error in fetching customers:", error);
    res.status(500).json(new ApiResponse(500, null, "Internal Server Error"));
  }
};

const getCustomerById = async (req, res) => {
  try {
    const customer = await NewWebsite.findById(req.params.id);
    if (customer) {
      res
        .status(200)
        .json(new ApiResponse(200, customer, "Customer fetched successfully"));
    } else {
      res.status(404).json(new ApiResponse(404, null, "Customer not found"));
    }
  } catch (error) {
    console.error("Error in fetching customer by ID:", error);
    if (error.kind === "ObjectId") {
      res.status(400).json(new ApiResponse(400, null, "Invalid customer ID"));
    } else {
      res.status(500).json(new ApiResponse(500, null, "Internal Server Error"));
    }
  }
};

export { createNewCustomer, getAllCustomers, getCustomerById };
