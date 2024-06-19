import { asyncHandler } from "../utils/asyncHandler.js";
import Order from "../models/order.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import Update from "../models/update.model.js";

const addOrder = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id;
  const { customer_id } = req.params;

  // Validate customer_id
  if (!isValidObjectId(customer_id)) {
    return next(new ApiError(400, "Invalid Customer ID"));
  }

  const {
    dateOfOrder,
    buildingAddress,
    orderType,
    orderValue,
    deposit,
    depositMethod,
    numberOfInstallments,
    dateOfFirstDd,
    customerAccountName,
    customerAccountNumber,
    customerSortCode,
    googleEmailRenewCampaign,
    customerSignature,
    renewalDate2024,
    numberOfKeyPhrase,
    numberOfKeyAreas,
    createdBy,
  } = req.body;

  
  // if (
  //   !customer_id ||
  //   !orderType ||
  //   !dateOfOrder ||
  //   !renewalDate2024 ||
  //   (orderType === "New Business" && (!numberOfKeyPhrase || !numberOfKeyAreas))
  // ) {
  //   return next(new ApiError(400, "Required fields are missing"));
  // }

  
  const orderValues = orderValue || 0;
  const deposits = deposit || 0;
  const numberOfInstallmentss = numberOfInstallments || 0;
  const safeNumberOfInstallments = numberOfInstallmentss || 1;

  const DdMonthly = safeNumberOfInstallments > 0 ? (orderValues - deposits) / safeNumberOfInstallments : 0;
  const increase = 0.05 * orderValues;
  const expected2024OrderValue = orderValues + increase;
  const cashFlow = orderValues !== 0 ? (deposits / orderValues) * 100 : 0;

  console.log("string");
  console.log("orderValue:", orderValues);
  console.log("deposit:", deposits);
  console.log("numberOfInstallments:", numberOfInstallmentss);
  console.log("dd", DdMonthly);
  console.log("incre", increase);
  console.log("exp", expected2024OrderValue);
  console.log("cashflow", cashFlow);

  try {
    const order = new Order({
      createdBy:createdBy || userId,
      customer: customer_id,
      orderType,
      dateOfOrder,
      orderValue: orderValues,
      deposit: deposits,
      depositMethod,
      numberOfInstallments: numberOfInstallmentss,
      dateOfFirstDd,
      customerAccountName,
      customerAccountNumber,
      customerSortCode,
      googleEmailRenewCampaign,
      customerSignature,
      renewalDate2024,
      buildingAddress,
      DdMonthly,
      increase,
      expected2024OrderValue,
      cashFlow,
      numberOfKeyPhrase: orderType === "New Business" ? numberOfKeyPhrase : undefined,
      numberOfKeyAreas: orderType === "New Business" ? numberOfKeyAreas : undefined,
    });

    await order.save();
    console.log("save");
    res.status(201).json(new ApiResponse(201, order, "Order created successfully"));
  } catch (error) {
    next(error);
  }
});

const getOrderById = asyncHandler(async (req, res, next) => {
    const { order_id } = req.params;
  
    if (!isValidObjectId(order_id)) {
      return next(new ApiError(400, "Invalid order ID"));
    }
  
    try {
      const order = await Order.findById(order_id).populate({
        path: 'customer',
      }).populate({
        path: 'createdBy',
        select: 'fullName avatar',
      });
  
      if (!order) {
        return next(new ApiError(404, "Order not found"));
      }
  
      return res.status(200).json(new ApiResponse(200, order, "Order retrieved successfully"));
    } catch (error) {
      return next(error);
    }
  });

const updateOrder = asyncHandler(async (req, res, next) => {
  const { order_id } = req.params;
  const userId = req.user?._id;

  if (!isValidObjectId(order_id)) {
    return next(new ApiError(400, "Invalid order ID"));
  }

  try {
    
    const user = await User.findById(userId);
    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    const order = await Order.findById(order_id);
    if (!order) {
      return next(new ApiError(404, "Order not found"));
    }

    if (user.role !== 'admin' && order.createdBy.toString() !== userId.toString()) {
      return next(new ApiError(401, "Unauthorized request"));
    }

    const {
      orderType,
      renewalStatus,
      renewalNotes,
      renewalValue,
      renewalApptDandT,
      dateOfOrder,
      orderValue,
      deposit,
      numberOfInstallments,
      DdMonthly,
      DdChange,
      dateOfFirstDd,
      depositMethod,
      customerAccountName,
      customerAccountNumber,
      customerSortCode,
      googleEmailRenewCampaign,
      renewalDate2024,
      increase,
      expected2024OrderValue,
      numberOfKeyPhrase,
      numberOfKeyAreas,
      cashFlow,
      ddSetUp,
      invoiceSent,
      vatInvoice,
      buildingAddress,
      createdBy
    } = req.body;

    if (!isValidObjectId(createdBy)) {
      return next(new ApiError(400, "Invalid assign id "));
    }

    // let avatarurl = "";
    // console.log(avatarurl);
    // const avatarLocalPat = req.file.customerSignature;   
    // console.log("HYHHHYH",avatarLocalPat);

  
    // if (req.file && req.file.path) {
      
    //   console.log(avatarLocalPath);
  
    //   try {
    //     const formData = new FormData();
    //     formData.append("file", fs.createReadStream(avatarLocalPath));
    //     const apiURL =
    //       "https://crm.neelnetworks.org/public/file_upload/api.php";
    //     const apiResponse = await axios.post(apiURL, formData, {
    //       headers: {
    //         ...formData.getHeaders(),
    //       },
    //     });
    //     console.log(apiResponse.data);
    //     avatarurl = apiResponse.data?.img_upload_path;
    //     if (!avatarurl) {
    //       throw new Error("img_upload_path not found in API response");
    //     }
  
    //     fs.unlink(avatarLocalPath, (err) => {
    //       if (err) {
    //         console.error("Error removing avatar file:", err.message);
    //       } else {
    //         console.log("Avatar file removed successfully");
    //       }
    //     });
    //   } catch (error) {
    //     console.error("Error uploading avatar:", error.message);
    //   }
    // } 
  

    const updateData = {
      orderType,
      renewalStatus,
      renewalNotes,
      renewalValue,
      renewalApptDandT,
      dateOfOrder,
      orderValue,
      deposit,
      numberOfInstallments,
      DdMonthly,
      DdChange,
      dateOfFirstDd,
      depositMethod,
      customerAccountName,
      customerAccountNumber,
      customerSortCode,
      googleEmailRenewCampaign,
      renewalDate2024,
      increase,
      expected2024OrderValue,
      numberOfKeyPhrase,
      numberOfKeyAreas,
      cashFlow,
      ddSetUp,
      invoiceSent,
      vatInvoice,
      buildingAddress,
      createdBy,
      updatedBy: userId,
    };

    const updatedOrder = await Order.findByIdAndUpdate(order_id, updateData, { new: true, runValidators: true });

    if (!updatedOrder) {
      return next(new ApiError(404, "Order not found after update"));
    }

    return res.status(200).json(new ApiResponse(200, updatedOrder, "Order updated successfully"));
  } catch (error) {
    return next(error);
  }
});

const deleteOrder = asyncHandler(async (req, res, next) => {
    const { order_id } = req.params;
    const userId = req.user?._id;
  
    if (!isValidObjectId(order_id)) {
      return next(new ApiError(400, "Invalid order ID"));
    }
  
    try {
      const user = await User.findById(userId);
      if (!user) {
        return next(new ApiError(404, "User not found"));
      }
  
      const order = await Order.findById(order_id);
      if (!order) {
        return next(new ApiError(404, "Order not found"));
      }
  
      // Check permissions
      if (user.role !== 'admin' && order.createdBy.toString() !== userId.toString()) {
        return next(new ApiError(401, "Unauthorized request"));
      }
      await Order.findByIdAndDelete(order_id);
     
      return res.status(200).json(new ApiResponse(200, {}, "Order deleted successfully"));
    } catch (error) {
      return next(error);
    }
  });

const getAllOrders = asyncHandler(async (req, res, next) => {
    try {
      const user_id = req.user?._id;
      const user = await User.findById(user_id);
  
      if (!user) {
        return next(new ApiError(404, "User not found"));
      }
  
      let orders, totalSums;
      
      if (user.role === "admin") {
        orders = await Order.find()
          .populate({
            path: 'customer',
          })
          .populate({
            path: 'createdBy',
            select: 'fullName avatar',
          });
        console.log(orders);
        totalSums = await Order.aggregate([
          {
            $group: {
              _id: null,
              totalIncrease: { $sum: '$increase' },
              totalExpected2024OrderValue: { $sum: '$expected2024OrderValue' },
              totalOrderValue: { $sum: '$orderValue' },
              totalDeposit: { $sum: '$deposit' },
              totalDdMonthly: { $sum: '$DdMonthly' },
              totalrenewalValue:{$sum:'$renewalValue'}
            }
          }
        ]);
        console.log('totalsum',totalSums);
      } else if (user.role === "salesman") {
        // Fetch only the orders created by the current user and aggregate totals
        orders = await Order.find({ createdBy: user_id })
          .populate({
            path: 'customer',
          })
          .populate({
            path: 'createdBy',
            select: 'fullName avatar',
          });
  
        totalSums = await Order.aggregate([
          {
            $match: { createdBy: user_id } // Filter by user ID
          },
          {
            $group: {
              _id: null,
              totalIncrease: { $sum: '$increase' },
              totalExpected2024OrderValue: { $sum: '$expected2024OrderValue' },
              totalOrderValue: { $sum: '$orderValue' },
              totalDeposit: { $sum: '$deposit' },
              totalDdMonthly: { $sum: '$DdMonthly' },
              totalrenewalValue:{$sum:'$renewalValue'},
            }
          }
        ]);
        console.log('totalsum',totalSums);
      } else {
        return next(new ApiError(403, "Unauthorized access"));
      }
  
    
      const totals = totalSums[0] || {
        totalIncrease: 0,
        totalExpected2024OrderValue: 0,
        totalOrderValue: 0,
        totalDeposit: 0,
        totalDdMonthly: 0,
        totalrenewalValue:0,
      };
  
      return res.status(200).json(new ApiResponse(200, {
        orders,
        totals,
      }, "Orders and their totals retrieved successfully"));
    } catch (error) {
      return next(error);
    }
  });

  //for pagination

  // const getAllOrders = asyncHandler(async (req, res, next) => {
  //   try {
  //     const user_id = req.user?._id;
  //     const user = await User.findById(user_id);
  
  //     if (!user) {
  //       return next(new ApiError(404, "User not found"));
  //     }
  
  //     let orders, totalSums;
  //     let page = parseInt(req.query.page) || 1; // Current page number, default is 1
  //     let limit = parseInt(req.query.limit) || 10; // Number of items per page, default is 10
  
  //     let skip = (page - 1) * limit; // Calculate the number of documents to skip
  
  //     if (user.role === "admin") {
  //       orders = await Order.find()
  //         .populate({
  //           path: 'customer',
  //         })
  //         .populate({
  //           path: 'createdBy',
  //           select: 'fullName avatar',
  //         })
  //         .skip(skip)
  //         .limit(limit);
  
  //       totalSums = await Order.aggregate([
  //         {
  //           $group: {
  //             _id: null,
  //             totalIncrease: { $sum: '$increase' },
  //             totalExpected2024OrderValue: { $sum: '$expected2024OrderValue' },
  //             totalOrderValue: { $sum: '$orderValue' },
  //             totalDeposit: { $sum: '$deposit' },
  //             totalDdMonthly: { $sum: '$DdMonthly' },
  //             totalrenewalValue: { $sum: '$renewalValue' },
  //           }
  //         }
  //       ]);
  //     } else if (user.role === "salesman") {
  //       orders = await Order.find({ createdBy: user_id })
  //         .populate({
  //           path: 'customer',
  //         })
  //         .populate({
  //           path: 'createdBy',
  //           select: 'fullName avatar',
  //         })
  //         .skip(skip)
  //         .limit(limit);
  
  //       totalSums = await Order.aggregate([
  //         {
  //           $match: { createdBy: user_id } // Filter by user ID
  //         },
  //         {
  //           $group: {
  //             _id: null,
  //             totalIncrease: { $sum: '$increase' },
  //             totalExpected2024OrderValue: { $sum: '$expected2024OrderValue' },
  //             totalOrderValue: { $sum: '$orderValue' },
  //             totalDeposit: { $sum: '$deposit' },
  //             totalDdMonthly: { $sum: '$DdMonthly' },
  //             totalrenewalValue: { $sum: '$renewalValue' },
  //           }
  //         }
  //       ]);
  //     } else {
  //       return next(new ApiError(403, "Unauthorized access"));
  //     }
  
  //     const totals = totalSums[0] || {
  //       totalIncrease: 0,
  //       totalExpected2024OrderValue: 0,
  //       totalOrderValue: 0,
  //       totalDeposit: 0,
  //       totalDdMonthly: 0,
  //       totalrenewalValue: 0,
  //     };
  
  //     return res.status(200).json(new ApiResponse(200, {
  //       orders,
  //       totals,
  //     }, "Orders and their totals retrieved successfully"));
  //   } catch (error) {
  //     return next(error);
  //   }
  // });
  

 //update for oders

  const createOrderUpdate = asyncHandler(async (req, res,next) => {
    
      const userId = req.user?._id;
      const { orderId } = req.params;
    try {
    
      const { content,files, mentions } = req.body;
      const update = new Update({
        content,
        createdBy: userId,
        files: files || [],
        mentions: mentions || [],
      });
  
      await update.save();
  
      const order = await Order.findById(orderId);
      if (!order) {
        throw new ApiError(404, "Order not found");
      }
      
      order.updates.push(update._id);
      await order.save();
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
  
  const getAllOrderUpdates = asyncHandler(async (req, res, next) => {
    const { orderId } = req.params;
    console.log(orderId);
    const upd = await Order.findById(orderId)
    try {
      const updates = await Order.findById(orderId)
      .select("companyName")
        .populate({
          path: 'updates', 
          populate: [
            { 
              path: 'mentions', 
              model: 'User', 
              select: 'fullname avatar' 
            },
            { 
              path: 'createdBy', 
              model: 'User', 
              select: 'fullname avatar' 
            },
            { 
              path: 'replies', 
              model: 'Update', 
            }
          ]
        });
        console.log(updates);
  
      if (!updates) {
        throw new ApiError(404, 'No updates found');
      }
  
      return res.json(new ApiResponse(200, updates, 'Updates retrieved successfully'));
    } catch (error) {
      next(error);
    }
  });
  const replyToUpdateforOrder = asyncHandler(async (req, res, next) => {
    const userId = req.user?._id;
    const {updateId } = req.params;
    try {
      const { content, files, mentions } = req.body;
  
      const originalUpdate = await Update.findById(updateId);
      if (!originalUpdate) {
        throw new ApiError(404, 'Original update not found');
      }
  
      const reply = new Update({
        content,
        createdBy: userId,
        files: files || [],
        mentions: mentions || [],
        replies: [], 
      });
  
      await reply.save();
      originalUpdate.replies.push(reply._id);
      await originalUpdate.save();

      return res.json(new ApiResponse(201, { reply }, 'Reply created successfully'));
    } catch (error) {
      next(error); 
    }
  });
  const toggleLikeforOrder = asyncHandler(async (req, res, next) => {
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
  const updateUpdateforOrder = asyncHandler(async (req, res, next) => {
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
  const deleteUpdateforOrder = asyncHandler(async (req, res, next) => {
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



export{addOrder,getAllOrders,updateOrder,getOrderById,deleteOrder,createOrderUpdate,getAllOrderUpdates,replyToUpdateforOrder,toggleLikeforOrder,updateUpdateforOrder,deleteUpdateforOrder}




//  const getAllOrders = asyncHandler(async (req, res, next) => {
//     try {
//       const user_id = req.user?._id;
//       const user = await User.findById(user_id);
  
//       if (!user) {
//         return next(new ApiError(404, "User not found"));
//       }
  
//       let orders;
//       if (user.role === "admin") {
//         orders = await Order.find().populate({
//           path: 'customer',
//         }).populate({
//           path: 'createdBy',
//           select: 'fullName avatar',
//         });
//       } else if (user.role === "salesman") {
//         orders = await Order.find({ createdBy: user_id }).populate({
//           path: 'customer',
//         }).populate({
//           path: 'createdBy',
//           select: 'fullName avatar',
//         });
//       } else {
//         return next(new ApiError(403, "Unauthorized access"));
//       }
  
//       return res.status(200).json(new ApiResponse(200, orders, "Orders retrieved successfully"));
//     } catch (error) {
//       return next(error);
//     }
//   });
