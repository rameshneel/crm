import Customer from "../models/customer.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidObjectId } from "mongoose";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import Update from "../models/update.model.js";


const createCustomer = asyncHandler(async (req, res, next) => {
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
   const newlivedate= new Date(liveDate)
    // const existedUser = await Customer.findOne({
    //   $or: [{ customerEmail }],
    // });

    let avatarurl = "";
    console.log(avatarurl);

    if (req.file && req.file.path) {
      const avatarLocalPath = req.file.path;
      console.log(avatarLocalPath);

      // if (existedUser) {
      //   fs.unlinkSync(avatarLocalPath);
      //   throw new ApiError(409, "Email already exists");
      // }
      try {
        const formData = new FormData();
        formData.append("file", fs.createReadStream(avatarLocalPath));
        const apiURL =
          "https://crm.neelnetworks.org/public/file_upload/api.php";
        const apiResponse = await axios.post(apiURL, formData, {
          headers: {
            ...formData.getHeaders(),
          },
        });
        console.log(apiResponse.data);
        avatarurl = apiResponse.data?.img_upload_path;
        if (!avatarurl) {
          throw new Error("img_upload_path not found in API response");
        }

        fs.unlink(avatarLocalPath, (err) => {
          if (err) {
            console.error("Error removing avatar file:", err.message);
          } else {
            console.log("Avatar file removed successfully");
          }
        });
      } catch (error) {
        console.error("Error uploading avatar:", error.message);
      }
    }

    if (!companyName) {
      throw new ApiError(400, "CompanyName is required");
    }

    // const existedCustomer = await Customer.findOne({ customerEmail });

    // if (existedCustomer) {
    //   throw new ApiError(409, "Email already exists");
    // }

    const activeUser = req.user?._id;
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
      liveDate:newlivedate,
      ssl,
      sitemap,
      htAccess,
      gaCode,
      newGACode,
      logo: avatarurl,
      ordersRenewals,
      createdBy,
      vatInvoice:
        "https://ocw.mit.edu/courses/6-096-introduction-to-c-january-iap-2011/ccef8a1ec946adb5179925311e276a7b_MIT6_096IAP11_lec02.pdf",
    });

    const customer = await newCustomer.save();
    const createdCustomer = await Customer.findById(customer._id);

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
    return next(error);
  }
});

const customerList = asyncHandler(async (req, res, next) => {
  try {
    const activeUser = req.user?._id;
    const user = await User.findById(activeUser);
    let customers;

    if (user.role === "admin") {
      customers = await Customer.find().populate({
        path: "createdBy",
      });
    } else if (user.role === "salesman") {
      customers = await Customer.find({ createdBy: activeUser }).populate({
        path: "createdBy",
      });
    }

    return res.json(
      new ApiResponse(200, { customers }, "Customers fetched successfully")
    );
  } catch (error) {
    return next(error);
  }
});

//for pagination 

// const customerList = asyncHandler(async (req, res, next) => {
//   try {
//     const activeUser = req.user?._id;
//     const user = await User.findById(activeUser);
//     let customers;
//     let page = parseInt(req.query.page) || 3; // Current page number, default is 1
//     let limit = parseInt(req.query.limit) || 2; // Number of items per page, default is 10

//     // Calculate the number of documents to skip
//     let skip = (page - 1) * limit;

//     if (user.role === "admin") {
//       customers = await Customer.find()
//         .populate({
//           path: "createdBy",
//         })
//         .skip(skip)
//         .limit(limit);
//     } else if (user.role === "salesman") {
//       customers = await Customer.find({ createdBy: activeUser })
//         .skip(skip)
//         .limit(limit);
//     }

//     return res.json(
//       new ApiResponse(200, { customers }, "Customers fetched successfully")
//     );
//   } catch (error) {
//     return next(error);
//   }
// });


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
      createdBy
    } = req.body;

    const newlivedate= new Date(liveDate)
    // if (
    //   ![customerEmail,].some((field) => {
    //     if (field === undefined) return false;
    //     if (typeof field === "string") return field.trim() !== "";
    //   })
    // ) {
    //   throw new ApiError(400, "At least one field is required for update");
    // }

    let avatarurl = "";
    console.log(avatarurl);

    if (req.file && req.file.path) {
      const avatarLocalPath = req.file.path;
      console.log(avatarLocalPath);

      // if (existedUser) {
      //   fs.unlinkSync(avatarLocalPath);
      //   throw new ApiError(409, "Email already exists");
      // }
      try {
        const formData = new FormData();
        formData.append("file", fs.createReadStream(avatarLocalPath));
        const apiURL =
          "https://crm.neelnetworks.org/public/file_upload/api.php";
        const apiResponse = await axios.post(apiURL, formData, {
          headers: {
            ...formData.getHeaders(),
          },
        });
        console.log(apiResponse.data);
        avatarurl = apiResponse.data?.img_upload_path;
        if (!avatarurl) {
          throw new Error("img_upload_path not found in API response");
        }

        fs.unlink(avatarLocalPath, (err) => {
          if (err) {
            console.error("Error removing avatar file:", err.message);
          } else {
            console.log("Avatar file removed successfully");
          }
        });
      } catch (error) {
        console.error("Error uploading avatar:", error.message);
      }
    }

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
        liveDate:newlivedate,
        ssl,
        sitemap,
        htAccess,
        gaCode,
        newGACode,
        ordersRenewals,
        logo: avatarurl,
        createdBy,
        updatedBy: userId,
      },
      { new: true }
    );

    if (!updatedCustomer) {
      throw new ApiError(404, "Customer not found");
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
      throw new ApiError(404, 'Customer not found');
    }

    if (user.role === 'admin' || (user.role === 'salesman' && customer.createdBy.equals(activeUserId))) {
      
      await Customer.findByIdAndDelete(customerId);
      return res
      .status(200)
      .json(new ApiResponse(204, {}, "Customer deleted successfully"));
    
    } else {
      throw new ApiError(401, 'Unauthorized');
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

//update for customers

 const createCustomerUpdate = asyncHandler(async (req, res,next) => {
    const userId = req.user?._id;
    const { customerId } = req.params;
  try {
   
    const { content,files, mentions } = req.body;
   
    const update = new Update({
      content,
      createdBy: userId,
      files: files || [],
      mentions: mentions || [],
    });

    await update.save();

    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new ApiError(404, "Customer not found");
    }
    customer.updates.push(update._id);
    await customer.save();
    return res.json(
      new ApiResponse(201, { update }, "Update Created successfully")
    );
  } catch (error) {
     next(error)
  }
});
// const getAllUpdates = asyncHandler(async (req, res, next) => {
//   const { customerId } = req.params;
//   try {
//     const customerUpdates = await Customer.aggregate([
//       { $match: { _id: new mongoose.Types.ObjectId(customerId) } },
//       {
//         $lookup: {
//           from: 'updates', // The collection to join
//           localField: 'updates', // The field from the customer documents
//           foreignField: '_id', // The field from the updates collection
//           as: 'updates'
//         }
//       },
//       { $unwind: '$updates' }, // Unwind the updates array
//       {
//         $lookup: {
//           from: 'users',
//           localField: 'updates.createdBy',
//           foreignField: '_id',
//           as: 'updates.createdBy'
//         }
//       },
//       { $unwind: '$updates.createdBy' }, // Unwind the createdBy array
//       {
//         $lookup: {
//           from: 'users',
//           localField: 'updates.mentions',
//           foreignField: '_id',
//           as: 'updates.mentions'
//         }
//       },
//       { $limit: 10 }, // Limit the number of updates
//       { $sort: { 'updates.createdAt': -1 } }, // Sort updates by creation date
//       {
//         $project: {
//           'updates.content': 1,
//           'updates.files': 1,
//           'updates.createdBy.fullname': 1,
//           'updates.createdBy.avatar': 1,
//           'updates.mentions.fullname': 1,
//           'updates.mentions.avatar': 1
//         }
//       }
//     ]);

//     if (!customerUpdates || customerUpdates.length === 0) {
//       throw new ApiError(404, 'No updates found for this customer');
//     }

//     return res.json(new ApiResponse(200, customerUpdates, 'Updates retrieved successfully'));
//   } catch (error) {
//     next(error);
//   }
// });

const populateRepliesUpToDepth = async (updates, depth) => {
  if (depth === 0) return updates;

  for (const update of updates) {
    // Populate the replies field of the current update
    await update.populate({
      path: 'replies',
      populate: [
        { path: 'createdBy', select: 'fullname avatar' },
        { path: 'mentions', select: 'fullname avatar' }
      ]
    }); // Populate each reply's createdBy and mentions fields

    // If there are replies and we need to go deeper, recursively populate the replies
    if (update.replies && update.replies.length > 0) {
      await populateRepliesUpToDepth(update.replies, depth - 1);
    }
  }

  return updates;
};
const getAllUpdates = asyncHandler(async (req, res, next) => {
  const { customerId } = req.params;

  try {
    // Step 1: Find the customer and initially populate the updates
    const customer = await Customer.findById(customerId)
      .select('contactName')
      .populate({
        path: 'updates',
        populate: [
          { path: 'createdBy', select: 'fullname avatar' },
          { path: 'mentions', select: 'fullname avatar' }
        ],
        options: { limit: 10, sort: { createdAt: -1 } }
      });

    if (!customer) {
      throw new ApiError(404, 'Customer not found');
    }

    // Step 2: Populate nested replies up to three levels deep
    const populatedUpdates = await populateRepliesUpToDepth(customer.updates, 4);

    // Step 3: Return the populated updates
    return res.json(new ApiResponse(200, populatedUpdates, 'Updates retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

const replyToUpdate = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id;
  const { updateId } = req.params;
  try {
    const { content, files, mentions } = req.body;

    // Find the original update to which we want to add a reply
    const originalUpdate = await Update.findById(updateId);
    if (!originalUpdate) {
      throw new ApiError(404, 'Original update not found');
    }

    // Create the reply as a new update document
    const reply = new Update({
      content,
      createdBy: userId,
      files: files || [],
      mentions: mentions || [],
      replies: [], // Replies to a reply can be handled if needed
    });

    // Save the reply document to the database
    await reply.save();

    // Add the reply's ID to the original update's replies array and save
    originalUpdate.replies.push(reply._id);
    await originalUpdate.save();

    // Respond with the created reply
    return res.json(new ApiResponse(201, { reply }, 'Reply created successfully'));
  } catch (error) {
    next(error); // Pass any error to the next middleware
  }
});
const toggleLike = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id; 
  const { updateId } = req.params;

  try {
   
    const update = await Update.findById(updateId);
    if (!update) {
      throw new ApiError(404, 'Update not found');
    }

    const userLiked = update.likes.includes(userId);

    if (userLiked) {
      update.likes = update.likes.filter(id => id.toString() !== userId.toString());
      await update.save();
      return res.json(new ApiResponse(200, { liked: false }, 'Update unliked successfully'));
    } else {
      update.likes.push(userId);
      await update.save();
      return res.json(new ApiResponse(200, { liked: true }, 'Update liked successfully'));
    }
  } catch (error) {
    next(error); 
  }
});
const updateUpdate = asyncHandler(async (req, res, next) => {
  const { updateId } = req.params; 
  const userId = req.user._id; 
  const { content, files, mentions } = req.body; 

  try {
    
    const update = await Update.findById(updateId);

    if (!update) {
      throw new ApiError(404, 'Update not found'); 
    }

    if (!update.createdBy.equals(userId)) {
      throw new ApiError(403, 'You are not authorized to update this content'); 
    }

    const updatedUpdate = await Update.findByIdAndUpdate(
      updateId,
      { content, files, mentions },
      { new: true, runValidators: true } // Return the new document after update
    );

    return res.json(new ApiResponse(200, updatedUpdate, 'Update modified successfully'));
  } catch (error) {
    next(error); 
  }
});
const deleteUpdate = asyncHandler(async (req, res, next) => {
  const { updateId } = req.params; 
  const userId = req.user._id; 

  try {
  
    const update = await Update.findById(updateId);

    if (!update) {
      throw new ApiError(404, 'Update not found'); 
    }

    if (!update.createdBy.equals(userId)) {
      throw new ApiError(403, 'You are not authorized to delete this content'); 
    }
     
    await Update.findByIdAndDelete(updateId);

    return res.json(new ApiResponse(200, {}, 'Update deleted successfully'));
  } catch (error) {
    next(error); 
  }
});

export {
  createCustomer,
  customerList,
  deleteCustomer,
  getCustomerById,
  updateCustomer,
  createCustomerUpdate,
  getAllUpdates,
  replyToUpdate,
  toggleLike,
  updateUpdate,
  deleteUpdate
};
