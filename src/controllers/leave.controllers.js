import Leave from '../models/leave.model.js';
import {User} from '../models/user.model.js'; 
import mongoose, { isValidObjectId } from 'mongoose';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from "../utils/asyncHandler.js";

const addLeaveRequest = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id;
  const { leaveType, leaveReason, startDate, endDate, returnDate } = req.body;

  if (!leaveType || !leaveReason || !startDate || !endDate || !returnDate) {
    throw new ApiError(400, "All fields are required.");
  }

  // Convert dates to proper Date objects
  const start = new Date(startDate);
  const end = new Date(endDate);
  const returnDateObj = new Date(returnDate);

  if (end <= start) {
    throw new ApiError(400, "End date must be after start date.");
  }

  if (returnDateObj <= end) {
    throw new ApiError(400, "Return date must be after end date.");
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    // Calculate totalWorkingDays and totalDayHoliday
    const totalWorkingDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1; // Include both start and end
    const totalDayHoliday = totalWorkingDays; // Assuming total holidays equals total working days for this request

    const leaveRequest = await Leave.create({
      employeeId: userId,
      leaveType,
      leaveReason,
      startDate: start,
      endDate: end,
      returnDate: returnDateObj,
      totalWorkingDays,
      totalDayHoliday,
      // Set initial response to null or as needed
    });

    // Optionally, send a notification to the manager
    // notifyManager(user.managerId, leaveRequest);

    return res.status(201).json(
      new ApiResponse(201, leaveRequest, "Leave request added successfully.")
    );
  } catch (err) {
    next(err);
  }
});
const getLeaveRequests = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id;
  const isAdmin = req.user?.role === 'admin';
  const { status, startDate, endDate } = req.query;

  try {
    let query = { isDeleted: false };
    if (!isAdmin) {
      query.employeeId = userId;
    }
    if (status) {
      query.managerResponse = status;
    }
    if (startDate && endDate) {
      query.startDate = { $gte: new Date(startDate) };
      query.endDate = { $lte: new Date(endDate) };
    }

    const leaveRequests = await Leave.find(query)
      .populate('employeeId', 'fullName email avatar')
      .populate('approvedBy', 'fullName email avatar')
      .sort({ createdAt: -1 });

    const formattedRequests = leaveRequests.map(request => ({
      ...request.toObject(),
      formattedStartDate: request.startDate.toLocaleDateString(),
      formattedEndDate: request.endDate.toLocaleDateString(),
      formattedReturnDate: request.returnDate.toLocaleDateString(),
    }));

    return res.status(200).json(
      new ApiResponse(200, formattedRequests, "Leave requests retrieved successfully.")
    );
  } catch (err) {
    next(err);
  }
}); 
const updateLeaveRequest = asyncHandler(async (req, res, next) => {
  const { leaveId } = req.params;
  const isAdmin = req.user?.role === 'admin';
  
  if (!isValidObjectId(leaveId)) {
    throw new ApiError(400, "Invalid leave ID.");
  }

  const { managerResponse, managerComments } = req.body;

  if (!isAdmin) {
    throw new ApiError(403, "Only admins can update leave requests.");
  }

  try {
    const leaveRequest = await Leave.findByIdAndUpdate(
      leaveId,
      { 
        managerResponse, 
        managerComments, 
        managerResponded: true, 
        approvalDate: new Date(),
        approvedBy: req.user?._id
      },
      { new: true, runValidators: true }
    ).populate('employeeId', 'name email');

    if (!leaveRequest) {
      throw new ApiError(404, "Leave request not found.");
    }

    // Send notification to employee (you'd implement this)
    // notifyEmployee(leaveRequest.employeeId, leaveRequest);

    return res.status(200).json(
      new ApiResponse(200, leaveRequest, "Leave request updated successfully.")
    );
  } catch (err) {
    next(err);
  }
});
const deleteLeaveRequest = asyncHandler(async (req, res, next) => {
  const { leaveId } = req.params;
  const userId = req.user?._id;
  const isAdmin = req.user?.role === 'admin';

  if (!isValidObjectId(leaveId)) {
    throw new ApiError(400, "Invalid leave ID.");
  }

  try {
    const leaveRequest = await Leave.findById(leaveId);

    if (!leaveRequest) {
      throw new ApiError(404, "Leave request not found.");
    }

    if (!isAdmin && leaveRequest.employeeId.toString() !== userId.toString()) {
      throw new ApiError(403, "You don't have permission to delete this leave request.");
    }

    if (leaveRequest.managerResponded && !isAdmin) {
      throw new ApiError(400, "Cannot delete a leave request that has been responded to by a manager.");
    }

    leaveRequest.isDeleted = true;
    await leaveRequest.save();

    return res.status(200).json(
      new ApiResponse(200, null, "Leave request deleted successfully.")
    );
  } catch (err) {
    next(err);
  }
});
const getLeaveSummary = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id;
  const isAdmin = req.user?.role === 'admin';
  const { year } = req.query;

  const currentYear = year || new Date().getFullYear();

  try {
    let query = {
      startDate: { $gte: new Date(currentYear, 0, 1) },
      endDate: { $lte: new Date(currentYear, 11, 31) },
      isDeleted: false
    };

    if (!isAdmin) {
      query.employeeId = userId;
    }

    const leaveRequests = await Leave.find(query);

    const summary = leaveRequests.reduce((acc, leave) => {
      if (!acc[leave.leaveType]) {
        acc[leave.leaveType] = 0;
      }
      acc[leave.leaveType] += leave.totalWorkingDays;
      return acc;
    }, {});

    const totalLeaves = Object.values(summary).reduce((a, b) => a + b, 0);

    return res.status(200).json(
      new ApiResponse(200, { summary, totalLeaves }, "Leave summary retrieved successfully.")
    );
  } catch (err) {
    next(err);
  }
});
const getLeaveRequestsById = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id;
  const isAdmin = req.user?.role === 'admin';
  const { id } = req.params; // Get the ID from the URL parameters

  try {
    let query = { isDeleted: false };

    if (id) {
      // If an ID is provided, retrieve the specific leave request
      query._id = id;
    } else if (!isAdmin) {
      // If no ID is provided, fetch leave requests based on user role
      query.employeeId = userId;
    }

    const leaveRequests = await Leave.find(query)
      .populate('employeeId', 'fullName email avatar')
      .populate('approvedBy', 'fullName email avatar')
      .sort({ createdAt: -1 });

    // If an ID was provided, return a single request
    if (id) {
      const request = leaveRequests[0];
      if (!request) {
        return res.status(404).json(new ApiResponse(404, null, "Leave request not found."));
      }

      const formattedRequest = {
        ...request.toObject(),
        formattedStartDate: request.startDate.toLocaleDateString(),
        formattedEndDate: request.endDate.toLocaleDateString(),
        formattedReturnDate: request.returnDate.toLocaleDateString(),
      };

      return res.status(200).json(
        new ApiResponse(200, formattedRequest, "Leave request retrieved successfully.")
      );
    }

    // For multiple leave requests, format them
    const formattedRequests = leaveRequests.map(request => ({
      ...request.toObject(),
      formattedStartDate: request.startDate.toLocaleDateString(),
      formattedEndDate: request.endDate.toLocaleDateString(),
      formattedReturnDate: request.returnDate.toLocaleDateString(),
    }));

    return res.status(200).json(
      new ApiResponse(200, formattedRequests, "Leave requests retrieved successfully.")
    );
  } catch (err) {
    next(err);
  }
});


const getLeaveRequestsByEmployeId = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id; // ID of the currently authenticated user
  const { id } = req.params; // Get employeeId from the route parameter

  try {
    const matchStage = {
      isDeleted: false,
      employeeId: new mongoose.Types.ObjectId(id), // Ensure employeeId is an ObjectId
    };

    const aggregationPipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: "$employeeId",
          totalWorkingDays: {
            $sum: {
              $cond: [
                { $eq: ["$managerResponse", "Approved"] }, // Only count if approved
                "$totalWorkingDays", // Use the stored totalWorkingDays
                0 // If not approved, add 0
              ]
            }
          },
          totalHolidays: {
            $sum: {
              $cond: [
                { $eq: ["$managerResponse", "Approved"] }, // Only count if approved
                "$totalDayHoliday", // Use the stored totalDayHoliday
                0 // If not approved, add 0
              ]
            }
          },
          leaveRequests: { $push: "$$ROOT" } // Push all leave requests into an array
        }
      },
      {
        $addFields: {
          warning: {
            $cond: [
              { $gt: ["$totalWorkingDays", 20] }, // Check if totalWorkingDays exceeds 20
              true,
              false
            ]
          }
        }
      },
      {
        $lookup: {
          from: 'users', // Assuming employee details are in the 'users' collection
          localField: '_id',
          foreignField: '_id',
          as: 'employeeDetails'
        }
      },
      {
        $unwind: {
          path: '$employeeDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          employeeId: '$_id',
          fullName: '$employeeDetails.fullName',
          email: '$employeeDetails.email',
          avatar: '$employeeDetails.avatar',
          totalWorkingDays: "$totalWorkingDays",
          totalHolidays: "$totalHolidays",
          warning: "$warning", // Directly use the calculated warning
          toalremaingleave: { $subtract: [20, "$totalWorkingDays"] },

          leaveRequests: {
            $map: {
              input: "$leaveRequests",
              as: "request",
              in: {
                startDate: "$$request.startDate",
                endDate: "$$request.endDate",
                returnDate: "$$request.returnDate",
                managerResponse: "$$request.managerResponse",
              }
            }
          }
        }
      }
    ];

    const result = await Leave.aggregate(aggregationPipeline);

    return res.status(200).json(
      new ApiResponse(200, result, "Leave requests retrieved successfully.")
    );
  } catch (err) {
    next(err);
  }
});

// const getLeaveRequestsById = asyncHandler(async (req, res, next) => {
//   const userId = req.user?._id; 
//   const { id } = req.params;

//   try {
//     const matchStage = {
//       isDeleted: false,
//       employeeId: new mongoose.Types.ObjectId(id), // Ensure employeeId is an ObjectId
//     };

//     const aggregationPipeline = [
//       { $match: matchStage },
//       {
//         $group: {
//           _id: "$employeeId",
//           totalWorkingDays: {
//             $sum: {
//               $cond: [
//                 { $eq: ["$managerResponse", "Approved"] }, // Only count if approved
//                 { $divide: [{ $subtract: ["$endDate", "$startDate"] }, 86400000] }, // Calculate days
//                 0 // If not approved, add 0
//               ]
//             }
//           },
//           totalHolidays: {
//             $sum: {
//               $cond: [
//                 { $eq: ["$managerResponse", "Approved"] }, // Only count if approved
//                 "$totalDayHoliday", // Add totalDayHoliday from the approved request
//                 0 // If not approved, add 0
//               ]
//             }
//           },
//           leaveRequests: { $push: "$$ROOT" } // Push all leave requests into an array
//         }
//       },
//       {
//         $addFields: {
//           warning: {
//             $cond: [
//               { $gt: ["$totalWorkingDays", 20] }, // Check if totalWorkingDays exceeds 20
//               true,
//               false
//             ]
//           }
//         }
//       },
//       {
//         $lookup: {
//           from: 'users', // Assuming employee details are in the 'users' collection
//           localField: '_id',
//           foreignField: '_id',
//           as: 'employeeDetails'
//         }
//       },
//       {
//         $unwind: {
//           path: '$employeeDetails',
//           preserveNullAndEmptyArrays: true
//         }
//       },
//       {
//         $project: {
//           employeeId: '$_id',
//           fullName: '$employeeDetails.fullName',
//           email: '$employeeDetails.email',
//           avatar: '$employeeDetails.avatar',
//           totalWorkingDays: "$totalWorkingDays",
//           totalHolidays: "$totalHolidays",
//           warning: "$warning", // Directly use the calculated warning
//           leaveRequests: {
//             $map: {
//               input: "$leaveRequests",
//               as: "request",
//               in: {
//                 startDate: "$$request.startDate",
//                 endDate: "$$request.endDate",
//                 returnDate: "$$request.returnDate",
//                 managerResponse: "$$request.managerResponse",
//               }
//             }
//           }
//         }
//       }
//     ];

//     const result = await Leave.aggregate(aggregationPipeline);

//     return res.status(200).json(
//       new ApiResponse(200, result, "Leave requests retrieved successfully.")
//     );
//   } catch (err) {
//     next(err);
//   }
// });








export {
  addLeaveRequest,
  getLeaveRequests,
  updateLeaveRequest,
  deleteLeaveRequest,
  getLeaveSummary,
  getLeaveRequestsById,
  getLeaveRequestsByEmployeId
};


// import Leave from '../models/leave.model.js';
// import { isValidObjectId } from 'mongoose';
// import { ApiResponse } from '../utils/ApiResponse.js';
// import { ApiError } from '../utils/ApiError.js';
// import { asyncHandler } from "../utils/asyncHandler.js";

// const addLeaveRequest = asyncHandler(async (req, res, next) => {
//   const userId = req.user?._id;
//   const { leaveType, leaveReason, startDate, endDate, returnDate } = req.body;

//   if (!leaveType || !leaveReason || !startDate || !endDate || !returnDate) {
//     throw new ApiError(400, "All fields are required.");
//   }

//   try {
//     const leaveRequest = await Leave.create({
//       employeeId: userId,
//       leaveType,
//       leaveReason,
//       startDate: new Date(startDate),
//       endDate: new Date(endDate),
//       returnDate: new Date(returnDate),
//     });

//     return res.status(201).json(
//       new ApiResponse(201, leaveRequest, "Leave request added successfully.")
//     );
//   } catch (err) {
//     if (err.message === 'End date must be after start date.' || 
//         err.message === 'Return date must be after end date.') {
//       throw new ApiError(400, err.message);
//     }
//     next(err);
//   }
// });

// const getLeaveRequests = asyncHandler(async (req, res, next) => {
//   const userId = req.user?._id;
//   const isAdmin = req.user?.role === 'admin';

//   try {
//     const leaveRequests = isAdmin
//       ? await Leave.find({ isDeleted: false }).populate('employeeId')
//       : await Leave.find({ employeeId: userId, isDeleted: false }).populate('employeeId');

//     const formattedRequests = leaveRequests.map(request => ({
//       ...request.toObject(),
//       formattedStartDate: request.startDate.toLocaleDateString(),
//       formattedEndDate: request.endDate.toLocaleDateString(),
//       formattedReturnDate: request.returnDate.toLocaleDateString(),
//     }));

//     return res.status(200).json(
//       new ApiResponse(200, formattedRequests, "Leave requests retrieved successfully.")
//     );
//   } catch (err) {
//     next(err);
//   }
// });

// const updateLeaveRequest = asyncHandler(async (req, res, next) => {
//   const { leaveId } = req.params;
//   const isAdmin = req.user?.role === 'admin';
  
//   if (!isValidObjectId(leaveId)) {
//     throw new ApiError(400, "Invalid leave ID.");
//   }

//   const { managerResponse, managerComments } = req.body;

//   if (!isAdmin) {
//     throw new ApiError(403, "Only admins can update leave requests.");
//   }

//   try {
//     const leaveRequest = await Leave.findByIdAndUpdate(
//       leaveId,
//       { 
//         managerResponse, 
//         managerComments, 
//         managerResponded: true, 
//         approvalDate: new Date(),
//         approvedBy: req.user?._id
//       },
//       { new: true, runValidators: true }
//     );

//     if (!leaveRequest) {
//       throw new ApiError(404, "Leave request not found.");
//     }

//     return res.status(200).json(
//       new ApiResponse(200, leaveRequest, "Leave request updated successfully.")
//     );
//   } catch (err) {
//     next(err);
//   }
// });

// const deleteLeaveRequest = asyncHandler(async (req, res, next) => {
//   const { leaveId } = req.params;
//   const userId = req.user?._id;

//   if (!isValidObjectId(leaveId)) {
//     throw new ApiError(400, "Invalid leave ID.");
//   }

//   try {
//     const leaveRequest = await Leave.findOne({ _id: leaveId, employeeId: userId });

//     if (!leaveRequest) {
//       throw new ApiError(404, "Leave request not found or you don't have permission to delete it.");
//     }

//     if (leaveRequest.managerResponded) {
//       throw new ApiError(400, "Cannot delete a leave request that has been responded to by a manager.");
//     }

//     leaveRequest.isDeleted = true;
//     await leaveRequest.save();

//     return res.status(200).json(
//       new ApiResponse(200, null, "Leave request deleted successfully.")
//     );
//   } catch (err) {
//     next(err);
//   }
// });

// export {
//   addLeaveRequest,
//   getLeaveRequests,
//   updateLeaveRequest,
//   deleteLeaveRequest,
// };



// import Leave from '../models/leave.model.js';   
// import { isValidObjectId } from 'mongoose';
// import { ApiResponse } from '../utils/ApiResponse.js';
// import { ApiError } from '../utils/ApiError.js';
// import { asyncHandler } from "../utils/asyncHandler.js";


// const addLeaveRequest = asyncHandler(async (req, res, next) => {
//   const userId = req.user?._id;
//   const { leaveType, leaveReason, startDate, endDate, returnDate } = req.body;

//   if (!leaveType || !leaveReason || !startDate || !endDate || !returnDate) {
//     throw new ApiError(400, "All fields are required.");
//   }
//   try {
//     const leaveRequest = await Leave.create({
//       employeeId: userId,
//       leaveType,
//       leaveReason,
//       startDate,
//       endDate,
//       returnDate,
//     });

//     return res.status(201).json(
//       new ApiResponse(201, leaveRequest, "Leave request added successfully.")
//     );
//   } catch (err) {
//     next(err);
//   }
// });

// // Get leave requests for a specific employee
// const getLeaveRequests = asyncHandler(async (req, res, next) => {
//     const userId = req.user?._id;
//     const isAdmin = req.user?.role === 'admin'; // Check if the user is an admin
  
//     try {
//       const leaveRequests = isAdmin
//         ? await Leave.find({ isDeleted: false }).populate('employeeId') // Admin sees all leave requests
//         : await Leave.find({ employeeId: userId, isDeleted: false }).populate('employeeId'); // User sees only their leave requests
  
//       return res.status(200).json(
//         new ApiResponse(200, leaveRequests, "Leave requests retrieved successfully.")
//       );
//     } catch (err) {
//       next(err);
//     }
//   });
  
// // Update leave request
// const updateLeaveRequest = asyncHandler(async (req, res, next) => {
//   const { leaveId } = req.params;
  
//   if (!isValidObjectId(leaveId)) {
//     throw new ApiError(400, "Invalid leave ID.");
//   }

//   const { managerResponse, managerComments } = req.body;

//   try {
//     const leaveRequest = await Leave.findByIdAndUpdate(
//       leaveId,
//       { managerResponse, managerComments, managerResponded: true, approvalDate: new Date() },
//       { new: true }
//     );

//     if (!leaveRequest) {
//       throw new ApiError(404, "Leave request not found.");
//     }

//     return res.status(200).json(
//       new ApiResponse(200, leaveRequest, "Leave request updated successfully.")
//     );
//   } catch (err) {
//     next(err);
//   }
// });

// // Delete leave request (soft delete)
// const deleteLeaveRequest = asyncHandler(async (req, res, next) => {
//   const { leaveId } = req.params;

//   if (!isValidObjectId(leaveId)) {
//     throw new ApiError(400, "Invalid leave ID.");
//   }

//   try {
//     const leaveRequest = await Leave.findByIdAndUpdate(
//       leaveId,
//       { isDeleted: true },
//       { new: true }
//     );

//     if (!leaveRequest) {
//       throw new ApiError(404, "Leave request not found.");
//     }

//     return res.status(200).json(
//       new ApiResponse(200, null, "Leave request deleted successfully.")
//     );
//   } catch (err) {
//     next(err);
//   }
// });

// // // Get leave requests for a specific employee or all if admin
// // const getLeaveRequests = asyncHandler(async (req, res, next) => {
// //     const userId = req.user?._id;
// //     const isAdmin = req.user?.role === 'admin'; // Check if the user is an admin
  
// //     try {
// //       const leaveRequests = isAdmin 
// //         ? await Leave.find({ isDeleted: false }).populate('employeeId') // All leave requests for admin
// //         : await Leave.find({ employeeId: userId, isDeleted: false }).populate('employeeId'); // Specific employee requests
  
// //       const formattedRequests = leaveRequests.map(request => ({
// //         ...request.toObject(),
// //         formattedStartDate: formatDate(request.startDate),
// //         formattedEndDate: formatDate(request.endDate),
// //         formattedReturnDate: formatDate(request.returnDate),
// //       }));
  
// //       return res.status(200).json(
// //         new ApiResponse(200, formattedRequests, "Leave requests retrieved successfully.")
// //       );
// //     } catch (err) {
// //       next(err);
// //     }
// //   });

// export {
//   addLeaveRequest,
//   getLeaveRequests,
//   updateLeaveRequest,
//   deleteLeaveRequest,
// };
























// import asyncHandler from 'express-async-handler';
// import Leave from '../models/leave.model';
// import ApiError from '../utils/ApiError';
// import ApiResponse from '../utils/ApiResponse';
// import { isValidObjectId } from 'mongoose';

// // Helper function to format dates
// const formatDate = (date) => {
//   const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
//   return new Date(date).toLocaleDateString(undefined, options);
// };

// // Add a new leave request
// const addLeaveRequest = asyncHandler(async (req, res, next) => {
//   const userId = req.user?._id;
//   const { leaveType, leaveReason, startDate, endDate, returnDate } = req.body;

//   // Validate request data
//   if (!leaveType || !leaveReason || !startDate || !endDate || !returnDate) {
//     throw new ApiError(400, "All fields are required.");
//   }

//   // Validate dates
//   if (new Date(startDate) >= new Date(endDate)) {
//     throw new ApiError(400, "End date must be after start date.");
//   }
//   if (new Date(returnDate) <= new Date(endDate)) {
//     throw new ApiError(400, "Return date must be after end date.");
//   }

//   try {
//     const leaveRequest = await Leave.create({
//       employeeId: userId,
//       leaveType,
//       leaveReason,
//       startDate,
//       endDate,
//       returnDate,
//     });

//     return res.status(201).json(
//       new ApiResponse(201, {
//         ...leaveRequest.toObject(),
//         formattedStartDate: formatDate(leaveRequest.startDate),
//         formattedEndDate: formatDate(leaveRequest.endDate),
//         formattedReturnDate: formatDate(leaveRequest.returnDate),
//       }, "Leave request added successfully.")
//     );
//   } catch (err) {
//     next(err);
//   }
// });

// // Get leave requests for a specific employee
// const getLeaveRequests = asyncHandler(async (req, res, next) => {
//   const userId = req.user?._id;

//   try {
//     const leaveRequests = await Leave.find({ employeeId: userId, isDeleted: false })
//       .populate('employeeId');

//     const formattedRequests = leaveRequests.map(request => ({
//       ...request.toObject(),
//       formattedStartDate: formatDate(request.startDate),
//       formattedEndDate: formatDate(request.endDate),
//       formattedReturnDate: formatDate(request.returnDate),
//     }));

//     return res.status(200).json(
//       new ApiResponse(200, formattedRequests, "Leave requests retrieved successfully.")
//     );
//   } catch (err) {
//     next(err);
//   }
// });

// // Update leave request
// const updateLeaveRequest = asyncHandler(async (req, res, next) => {
//   const { leaveId } = req.params;

//   if (!isValidObjectId(leaveId)) {
//     throw new ApiError(400, "Invalid leave ID.");
//   }

//   const { managerResponse, managerComments } = req.body;

//   try {
//     const leaveRequest = await Leave.findByIdAndUpdate(
//       leaveId,
//       { managerResponse, managerComments, managerResponded: true, approvalDate: new Date() },
//       { new: true }
//     );

//     if (!leaveRequest) {
//       throw new ApiError(404, "Leave request not found.");
//     }

//     return res.status(200).json(
//       new ApiResponse(200, {
//         ...leaveRequest.toObject(),
//         formattedStartDate: formatDate(leaveRequest.startDate),
//         formattedEndDate: formatDate(leaveRequest.endDate),
//         formattedReturnDate: formatDate(leaveRequest.returnDate),
//       }, "Leave request updated successfully.")
//     );
//   } catch (err) {
//     next(err);
//   }
// });

// // Soft delete leave request
// const deleteLeaveRequest = asyncHandler(async (req, res, next) => {
//   const { leaveId } = req.params;

//   if (!isValidObjectId(leaveId)) {
//     throw new ApiError(400, "Invalid leave ID.");
//   }

//   try {
//     const leaveRequest = await Leave.findByIdAndUpdate(
//       leaveId,
//       { isDeleted: true },
//       { new: true }
//     );

//     if (!leaveRequest) {
//       throw new ApiError(404, "Leave request not found.");
//     }

//     return res.status(200).json(
//       new ApiResponse(200, null, "Leave request deleted successfully.")
//     );
//   } catch (err) {
//     next(err);
//   }
// });

// export {
//   addLeaveRequest,
//   getLeaveRequests,
//   updateLeaveRequest,
//   deleteLeaveRequest,
// };
