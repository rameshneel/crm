import Customer from "../models/customer.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";
import Notification from "../models/notification.model.js";
import sendEmailForMentions from "../utils/sendEmailForMentions.js";
import Update from "../models/update.model.js";
import { createNotifications } from "./notification.controllers.js";

const createCustomer = asyncHandler(async (req, res, next) => {
  const activeUser = req.user?._id;
  try {
    const {
      companyName,
      contactName,
      mobileNo,
      landlineNo,
      streetNoName,
      town,
      county,
      customerEmail,
      postcode,
      url,
      status,
      liveDate,
      ssl,
      sitemap,
      htAccess,
      gaCode,
      newGACode,
      createdBy,
      ordersRenewals,
    } = req.body;

    if (!companyName) {
      throw new ApiError(400, "CompanyName is required");
    }
    let logoUrl;
    if (req.file && req.file.path) {
      logoUrl = `https://${req.get("host")}/images/${req.file.filename}`;
    }
    const newCustomer = new Customer({
      companyName,
      contactName,
      mobileNo,
      customerEmail,
      landlineNo,
      streetNoName,
      town,
      county,
      postcode,
      url,
      status,
      liveDate: new Date(liveDate),
      ssl,
      sitemap,
      htAccess,
      gaCode,
      newGACode,
      logo: logoUrl,
      ordersRenewals,
      createdBy: createdBy || activeUser,
    });
    const createdCustomer = await newCustomer.save();
    if (createdBy) {
      const notificationData = {
        title: `New Customer Created: ${newCustomer.companyName}`,
        message: `A new customer has been registered: ${newCustomer.companyName}. Please check the details and take necessary actions!`,
        category: "assigned_to_me",
        assignedTo: createdBy,
        assignedBy: activeUser,
        mentionedUsers: [],
        item: createdCustomer._id, // Update to use the created customer ID
        itemType: "Customer", // Change to reflect the correct item type
        linkUrl: `https://high-oaks-media-crm.vercel.app/customers/customerDetails/${newCustomer._id}`,
        createdBy: activeUser,
      };
    
      await createNotifications(notificationData); 
    }
    
    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { createdCustomer },
          "Customer registered successfully"
        )
      );
  } catch (error) {
    next(error);
  }
});

//for pagination

// const customerList = asyncHandler(async (req, res, next) => {
//   try {
//     const activeUser = req.user?._id;
//     const user = await User.findById(activeUser);

//     let page = parseInt(req.query.page, 10) || 1; // Default page is 1 if not provided or invalid
//     let limit = parseInt(req.query.limit, 10) || 10; // Default limit is 10 if not provided or invalid

//     let skip = (page - 1) * limit;

//     let customers;
//     let totalCount;

//     if (user.role === "admin") {
//       totalCount = await Customer.countDocuments();
//       customers = await Customer.find()
//         .populate({
//           path: "createdBy",
//           select: "name email",
//         })
//         .skip(skip)
//         .limit(limit)
//         .sort({ createdAt: -1 });
//     } else if (user.role === "salesman") {
//       totalCount = await Customer.countDocuments({ createdBy: activeUser });
//       customers = await Customer.find({ createdBy: activeUser })
//         .skip(skip)
//         .limit(limit)
//         .sort({ createdAt: -1 });
//     } else {
//       return res.status(403).json(new ApiResponse(403, null, "Access denied"));
//     }

//     const totalPages = Math.ceil(totalCount / limit);

//     return res.json(
//       new ApiResponse(
//         200,
//         {
//           customers,
//           totalPages,
//           totalCount,
//           currentPage: page,
//           pageSize: limit,
//         },
//         "Customers fetched successfully"
//       )
//     );
//   } catch (error) {
//     return next(error);
//   }
// });

// const customerList = asyncHandler(async (req, res, next) => {
//   try {
//     const activeUser = req.user?._id;
//     const user = await User.findById(activeUser);

//     let page = parseInt(req.query.page, 10) || 1;
//     let limit = parseInt(req.query.limit, 10) || 10;
//     let skip = (page - 1) * limit;

//     let filter = {};

//     if (req.query.name) {
//       filter.companyName = { $regex: req.query.name, $options: 'i' };
//     }
//     if (req.query.email) {
//       filter.email = { $regex: req.query.email, $options: 'i' };
//     }

//     let customers;
//     let totalCount;

//     if (user.role === "admin") {
//       totalCount = await Customer.countDocuments(filter);
//       customers = await Customer.find(filter)
//         .populate({
//           path: "createdBy",
//           select: "name email",
//         })
//         .skip(skip)
//         .limit(limit)
//         .sort({ createdAt: -1 });
//     } else if (user.role === "salesman") {
//       filter.createdBy = activeUser;
//       totalCount = await Customer.countDocuments(filter);
//       customers = await Customer.find(filter)
//         .skip(skip)
//         .limit(limit)
//         .sort({ createdAt: -1 });
//     } else {
//       return res.status(403).json(new ApiResponse(403, null, "Access denied"));
//     }

//     const totalPages = Math.ceil(totalCount / limit);

//     return res.json(
//       new ApiResponse(
//         200,
//         {
//           customers,
//           totalPages,
//           totalCount,
//           currentPage: page,
//           pageSize: limit,
//         },
//         "Customers fetched successfully"
//       )
//     );
//   } catch (error) {
//     return next(error);
//   }
// });

//without pagination

const customerList = asyncHandler(async (req, res, next) => {
  try {
    const activeUser = req.user?._id;
    const user = await User.findById(activeUser);
    let customers;

    if (user.role === "admin") {
      customers = await Customer.find().populate({
        path: "createdBy",
      }).sort({ customerNo: 1 }) ;
    } else if (user.role === "salesman") {
      customers = await Customer.find({ createdBy: activeUser }).populate({
        path: "createdBy",
        select: "name email",
      }).sort({ customerNo: 1 }) ;
    }

    return res.json(
      new ApiResponse(200, { customers }, "Customers fetched successfully")
    );
  } catch (error) {
    return next(error);
  }
});

const updateCustomer = asyncHandler(async (req, res, next) => {
  console.log(req.file);
  const { customer_id } = req.params;
  const userId = req.user?._id;
  if (!isValidObjectId(customer_id)) {
    return next(new ApiError(400, "Invalid customer_id"));
  }

  try {
    const {
      companyName,
      contactName,
      mobileNo,
      landlineNo,
      streetNoName,
      town,
      county,
      customerEmail,
      postcode,
      url,
      address,
      status,
      liveDate,
      ssl,
      sitemap,
      htAccess,
      gaCode,
      newGACode,
      ordersRenewals,
      createdBy,
    } = req.body;

    const newlivedate = new Date(liveDate);
    // if (
    //   ![customerEmail,].some((field) => {
    //     if (field === undefined) return false;
    //     if (typeof field === "string") return field.trim() !== "";
    //   })
    // ) {
    //   throw new ApiError(400, "At least one field is required for update");
    // }
    let logoUrl;
    if (req.file && req.file.path) {
      logoUrl = `${req.protocol}://${req.get("host")}/images/${
        req.file.filename
      }`;
    }

    // if (existedUser) {
    //   fs.unlinkSync(avatarLocalPath);
    //   throw new ApiError(409, "Email already exists");
    // }

    // const atemail = await Customer.findOne(email)
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User does not exist");
    }
    const customer = await Customer.findById(customer_id);

    if (!customer) {
      throw new ApiError(404, "Customer not found");
    }

    if (user.role !== "admin" && customer.createdBy.toString() !== userId) {
      throw new ApiError(401, "Unauthorized request");
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      customer_id,
      {
        companyName,
        contactName,
        mobileNo,
        landlineNo,
        streetNoName,
        town,
        county,
        customerEmail,
        postcode,
        url,
        address,
        status,
        liveDate: newlivedate,
        ssl,
        sitemap,
        htAccess,
        gaCode,
        newGACode,
        ordersRenewals,
        logo: logoUrl,
        createdBy,
        updatedBy: userId,
      },
      { new: true }
    );

    if (!updatedCustomer) {
      throw new ApiError(404, "Customer not found");
    }
    if (createdBy) {
      const notificationData = {
        title: `Customer Details Updated: ${updatedCustomer.companyName}`,
        message: `The details for the customer ${updatedCustomer.companyName} have been successfully updated. Please review the changes!`,
        category: "assigned_to_me",
        assignedTo: createdBy,
        assignedBy: activeUser,
        mentionedUsers: [],
        item: updatedCustomer._id,
        itemType: "Customer", 
        linkUrl: `https://high-oaks-media-crm.vercel.app/customers/customerDetails/${updatedCustomer._id}`,
        createdBy: activeUser,
      };
    
      await createNotifications(notificationData); 
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedCustomer, "Customer updated successfully")
      );
  } catch (error) {
    return next(error);
  }
});

const deleteCustomer = asyncHandler(async (req, res, next) => {
  try {
    const activeUserId = req.user?._id;
    const user = await User.findById(activeUserId);

    const { customerId } = req.params;

    const customer = await Customer.findById(customerId);

    if (!customer) {
      throw new ApiError(404, "Customer not found");
    }

    if (
      user.role === "admin" ||
      (user.role === "salesman" && customer.createdBy.equals(activeUserId))
    ) {
      await Update.deleteMany({ _id: { $in: customer.updates } });
      await Customer.findByIdAndDelete(customerId);
      return res
        .status(200)
        .json(new ApiResponse(204, {}, "Customer deleted successfully"));
    } else {
      throw new ApiError(401, "Unauthorized");
    }
  } catch (error) {
    return next(error);
  }
});

const getCustomerById = asyncHandler(async (req, res, next) => {
  try {
    const { customerId } = req.params;

    if (!isValidObjectId(customerId)) {
      throw new ApiError(400, "Invalid Customer ID");
    }

    const customer = await Customer.findById(customerId);

    if (!customer) {
      throw new ApiError(404, "Customer not found");
    }

    return res.json(
      new ApiResponse(200, { customer }, "Customer fetched successfully")
    );
  } catch (error) {
    return next(error);
  }
});

export {
  createCustomer,
  customerList,
  deleteCustomer,
  getCustomerById,
  updateCustomer,
};
