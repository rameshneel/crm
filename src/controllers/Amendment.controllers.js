import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { isValidObjectId } from "mongoose";
import Amendment from "../models/amendment.model.js";
import { User } from "../models/user.model.js";
import Customer from "../models/customer.model.js";
import { createNotifications } from "./notification.controllers.js";

// const addAmendment = asyncHandler(async (req, res, next) => {
//   const { customerId } = req.params;
//   const userId = req.user?._id;

//   if (!isValidObjectId(customerId)) {
//     throw new ApiError(400, "Invalid customer_id");
//   }
//   const activeCustomer = await Customer.findById(customerId)

//     if (!activeCustomer) {
//       throw new ApiError(404, "Customer not found");
//     }

//   try {
//     const { date_current, customer_status, priority, status } = req.body;
//     const date=new Date(date_current)
//     console.log(req.body);

//     const existingAppointment = await Amendment.findOne({date});

//     if (existingAppointment) {
//       return res
//         .status(400)
//         .json(
//           new ApiResponse(
//             400,
//             existingAppointment,
//             "An amendment already exists for this date"
//           )
//         );
//     }

//     const appointment = await Amendment.create({
//       date_current:date,
//       customer_status,
//       priority,
//       status,
//       customer: customerId,
//       generated_by: userId,
//     });

//     return res
//       .status(201)
//       .json(
//         new ApiResponse(201, appointment, "Appointment Added Successfully")
//       );
//   } catch (err) {
//     next(err)
//   }
// });

const addAmendment = asyncHandler(async (req, res, next) => {
  const { customerId } = req.params;
  const userId = req.user?._id;

  if (!isValidObjectId(customerId)) {
    throw new ApiError(400, "Invalid customerId");
  }

  try {
    const { date_current, customer_status, priority, status,generated_by } = req.body;
    console.log("date current",date_current);
    const existingAmendment = await Amendment.findOne({ customer: customerId });

    if (existingAmendment) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            null,
            "An amendment already exists for this customer."
          )
        );
    } else {
      const appointment = await Amendment.create({
        date_current,
        customer_status,
        priority,
        status,
        date_complete:"",
        customer: customerId,
        generated_by:generated_by|| userId,
      });
      if (generated_by) { // Assuming generated_by is the one who should receive the notification
        const notificationData = {
          title: `New Amendment Created for Customer: ${customerId}`,
          message: `A new amendment has been added for the customer with ID: ${customerId}. Please review the amendment details!`,
          category: "assigned_to_me",
          assignedTo: generated_by, // Use generated_by for assignedTo
          assignedBy: userId,
          mentionedUsers: [],
          item: appointment._id, // Use the created amendment ID
          itemType: "Amendment", // Correct item type
          linkUrl: `https://high-oaks-media-crm.vercel.app/customers/amendmentDetails/${appointment._id}`,
          createdBy: userId,
        };
      
        await createNotifications(notificationData); 
      } 
      return res
        .status(201)
        .json(
          new ApiResponse(200, appointment, "Amendment Added Successfully")
        );
    }
  } catch (err) {
    next(err);
  }
});

const getAllAmendment = asyncHandler(async (req, res, next) => {
  try {
    // Removed user role checks and activeUser retrieval
    // const activeUser = req.user?._id;

    // Fetch all amendments without filtering
    const amendments = await Amendment.find()
      .populate({
        path: "customer",
      })
      .populate({
        path: "generated_by",
        select: "fullName avatar",
      });

    return res.json(
      new ApiResponse(200, amendments, "Amendment fetched successfully")
    );
  } catch (error) {
    next(error);
  }
});

// const getAllAmendment = asyncHandler(async (req, res, next) => {
//   try {
//     const activeUser = req.user?._id;
//     const user = await User.findById(activeUser);

//     // let page = parseInt(req.query.page) || 1;
//     // let limit = parseInt(req.query.limit) || 10;
//     // let skip = (page - 1) * limit;

//     let amendments;
//     // let totalCount;

//     if (user.role === "admin") {
//       amendments = await Amendment.find()
//         .populate({
//           path: "customer",
//         })
//         .populate({
//           path: "generated_by",
//           select: "fullName avatar",
//         });
//       // .skip(skip).limit(limit);
//       // totalCount = await Amendment.countDocuments();
//     } else if (user.role === "salesman") {
//       amendments = await Amendment.find({ generated_by: activeUser })
//         .populate({
//           path: "customer",
//         })
//         .populate({
//           path: "generated_by",
//           select: "fullName avatar",
//         });
//       // .skip(skip)
//       // .limit(limit);
//       // totalCount = await Amendment.countDocuments({ generated_by: activeUser });
//     }

//     return res.json(
//       new ApiResponse(200, amendments, "Amendment fetched successfully")
//     );
//   } catch (error) {
//     next(error);
//   }
// });

const getAmendmentById = asyncHandler(async (req, res, next) => {
  const { amendmentId } = req.params;
  console.log(amendmentId);

  if (!isValidObjectId(amendmentId)) {
    throw new ApiError(400, "Invalid amendmentId");
  }
  try {
    const amendment = await Amendment.findById(amendmentId)
      .populate({
        path: "customer",
        // select:"contactName "
      })
      .populate({
        path: "generated_by",
        select: "fullName avatar",
      });
    if (!amendment) {
      throw new ApiError(404, "Amendment Not Found!");
    }

    const user_id = req.user?._id;
    const user = await User.findById(user_id);
    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, amendment, "Amendment fetech Successfully"));
  } catch (error) {
    next(error);
  }
});

const updateAmendment = asyncHandler(async (req, res) => {
  const { amendmentId } = req.params;

  if (!isValidObjectId(amendmentId)) {
    throw new ApiError(400, "Invalid AmendmentId");
  }
  const { customer_status,date_complete, priority, status,generated_by,date_current } = req.body;

  if (
    ![customer_status, date_complete, priority, status].some((field) => {
      if (field === undefined) return false;
      if (typeof field === "string") return field.trim() !== "";
    }) 
  ) {
    throw new ApiError(400, "At least one field is required for update");
  }

  if (date_complete) {
    const isValidDate = !isNaN(Date.parse(date_complete));
    if (!isValidDate) {
      throw new ApiError(400, "Invalid date format for Date Complete");
    }
  }

  const updateObj = {
    customer_status,
    date_current,
    date_complete,
    priority,
    status,
    generated_by,
    updated_by: req.user._id,
  };

  const amendment = await Amendment.findByIdAndUpdate(
    amendmentId,
    { $set: updateObj },
    { new: true }
  );

  if (!amendment) {
    throw new ApiError(404, "Amendment not found");
  }
// Notification Logic
if (generated_by) {
  const notificationData = {
    title: `Amendment Updated: ${amendmentId}`,
    message: `The amendment with ID: ${amendmentId} has been successfully updated. Please review the changes!`,
    category: "assigned_to_me",
    assignedTo: generated_by,
    assignedBy: req.user._id,
    mentionedUsers: [],
    item: amendment._id, // Use the updated amendment ID
    itemType: "Amendment", // Correct item type
    linkUrl: `https://high-oaks-media-crm.vercel.app/amendments/${amendmentId}`,
    createdBy: req.user._id,
  };
  await createNotifications(notificationData); 
}
  return res
    .status(200)
    .json(new ApiResponse(200, amendment, "Amendment updated successfully"));
});

const getAmendmentsByStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.query;
  const activeUser = req.user?._id;
  const user = await User.findById(activeUser);

  try {
    let amendment;
    if (user.role === "admin") {
      amendment = await Amendment.find({ status: status })
        .populate("customer")
        .populate("generated_by");
      res
        .status(200)
        .json(
          new ApiResponse(200, amendment, "Amendment updated successfully")
        );
    } else if (user.role === "salesman") {
      amendment = await Amendment.find({
        status: status,
        generated_by: activeUser,
      })
        .populate("customer")
        .populate("generated_by");
      res
        .status(200)
        .json(
          new ApiResponse(200, amendment, "Amendment updated successfully")
        );
    }
  } catch (error) {
    next(error);
  }
});

// const deleteAmendment = asyncHandler(async (req, res, next) => {
//   const { amendmentId } = req.params;
//   try {
//     const amendment = await Amendment.findById(amendmentId);
//     if (!amendment) {
//       throw new ApiError(404, "Amendment not found");
//     }
//     if (amendment.generated_by.toString() !== req.user._id.toString()) {
//       throw new ApiError(403, "Unauthorized to delete this amendment");
//     }
//     await Amendment.findByIdAndDelete(amendmentId);
//     // await amendment.remove();
//     res.json(new ApiResponse(200, null, "Amendment deleted successfully"));
//   } catch (error) {
//     next(error);
//   }
// });

const deleteAmendment = asyncHandler(async (req, res, next) => {
  const { amendmentId } = req.params;
  try {
    const amendment = await Amendment.findById(amendmentId);
    if (!amendment) {
      throw new ApiError(404, "Amendment not found");
    }
    if (req.user.role !== "admin" && amendment.generated_by.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Unauthorized to delete this amendment");
    }
    await Amendment.findByIdAndDelete(amendmentId);
    // await amendment.remove();
    res.json(new ApiResponse(200, null, "Amendment deleted successfully"));
  } catch (error) {
    next(error);
  }
});
export {
  addAmendment,
  getAllAmendment,
  getAmendmentById,
  updateAmendment,
  getAmendmentsByStatus,
  deleteAmendment,
};

// let amendment;
// if (user.role === "admin") {
//   amendment = await Amendment.find().populate({
//     path: 'customer',
//   }).populate({
//     path: 'generated_by',
//     select: 'fullName avatar'
//   });
// } else if (user.role === "salesman") {
//   amendment = await Amendment.find({ generated_by: user_id }).populate({
//     path: 'customer',
//   }).populate({
//     path: 'generated_by',
//     select: 'fullName avatar'
//   });
// }
