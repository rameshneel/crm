import { asyncHandler } from "../utils/asyncHandler.js";
import Order from "../models/order.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";


 const addOrder = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id;
  const { customer_id } = req.params;
  if (!isValidObjectId(customer_id)) {
    throw new ApiError(400, "Invalid Customer ID");
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

  } = req.body;
  console.log("order",orderType);

  // if (
  //   !customer_id ||
  //   !orderType ||
  //   !dateOfOrder ||
  //   !orderValue ||
  //   !deposit ||
  //   !numberOfInstallments ||
  //   !renewalDate2024 
  // ) {
  //   return next(new ApiError(400, "Required fields are missing"));
  // }
  
  if (
    orderType === "New Business" &&
    (!req.body.numberOfKeyPhrase || !req.body.numberOfKeyAreas)
  ) {
    return next(
      new ApiError(
        400,
        "Number of Key Phrases and Number of Key Areas are required for New Business orders"
      )
    );
  }

  const DdMonthly = orderValue -deposit/ numberOfInstallments; 
  console.log(DdMonthly);
  const increase = 0.05 * orderValue; 
  console.log(increase);
  const expected2024OrderValue = orderValue + increase; 
  console.log(expected2024OrderValue);
  const cashFlow = (deposit / orderValue) * 100; 
  console.log(cashFlow);


  try {
    const order = new Order({
      createdBy: userId,
      customer: customer_id,
      orderType,
      dateOfOrder,
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
      buildingAddress,
      DdMonthly,
      increase,
      expected2024OrderValue,
      cashFlow,
      numberOfKeyPhrase:
      
        orderType === "New Business" ? req.body.numberOfKeyPhrase : undefined,
      numberOfKeyAreas:
        orderType === "New Business" ? req.body.numberOfKeyAreas : undefined,
    });
    await order.save();
    res
      .status(201)
      .json(new ApiResponse(201, order, "Order created successfully"));
  } catch (error) {
    next(error);
  }
});

 const getAllOrders = asyncHandler(async (req, res, next) => {
    try {
      const user_id = req.user?._id;
      const user = await User.findById(user_id);
  
      if (!user) {
        return next(new ApiError(404, "User not found"));
      }
  
      let orders;
      if (user.role === "admin") {
        orders = await Order.find().populate({
          path: 'customer',
        }).populate({
          path: 'createdBy',
          select: 'fullName avatar',
        });
      } else if (user.role === "salesman") {
        orders = await Order.find({ createdBy: user_id }).populate({
          path: 'customer',
        }).populate({
          path: 'createdBy',
          select: 'fullName avatar',
        });
      } else {
        return next(new ApiError(403, "Unauthorized access"));
      }
  
      return res.status(200).json(new ApiResponse(200, orders, "Orders retrieved successfully"));
    } catch (error) {
      return next(error);
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

// const updateOrder = asyncHandler(async (req, res, next) => {
//     const { order_id } = req.params;
//     const userId = req.user?._id;
  
//     if (!isValidObjectId(order_id)) {
//       return next(new ApiError(400, "Invalid order ID"));
//     }
  
//     try {
//       const user = await User.findById(userId);
//       if (!user) {
//         return next(new ApiError(404, "User not found"));
//       }
  
//       const order = await Order.findById(order_id);
//       if (!order) {
//         return next(new ApiError(404, "Order not found"));
//       }
  
     
//       if (user.role !== 'admin' && order.createdBy.toString() !== userId.toString()) {
//         return next(new ApiError(401, "Unauthorized request"));
//       }
  
//       const {
//         orderType,
//         renewalStatus,
//         renewalNotes,
//         renewalValue,
//         renewalApptDandT,
//         dateOfOrder,
//         orderValue,
//         deposit,
//         numberOfInstallments,
//         DdMonthly,
//         DdChange,
//         dateOfFirstDd,
//         depositMethod,
//         customerAccountName,
//         customerAccountNumber,
//         customerSortCode,
//         googleEmailRenewCampaign,
//         customerSignature,
//         renewalDate2024,
//         increase,
//         expected2024OrderValue,
//         numberOfKeyPhrase,
//         numberOfKeyAreas,
//         cashFlow,
//         ddSetUp,
//         invoiceSent,
//         vatInvoice,
//         // contactName,
//         // mobileNo,
//         // landlineNo,
//         // customerEmail,
//         buildingAddress,
//         // streetNoName,
//         // town,
//         // county,
//         // postcode
//       } = req.body;
  
//       order.orderType = orderType;
//       order.renewalStatus = renewalStatus;
//       order.renewalNotes = renewalNotes;
//       order.renewalValue = renewalValue;
//       order.renewalApptDandT = renewalApptDandT;
//       order.dateOfOrder = dateOfOrder;
//       order.orderValue = orderValue;
//       order.deposit = deposit;
//       order.numberOfInstallments = numberOfInstallments;
//       order.DdMonthly = DdMonthly;
//       order.DdChange = DdChange;
//       order.dateOfFirstDd = dateOfFirstDd;
//       order.depositMethod = depositMethod;
//       order.customerAccountName = customerAccountName;
//       order.customerAccountNumber = customerAccountNumber;
//       order.customerSortCode = customerSortCode;
//       order.googleEmailRenewCampaign = googleEmailRenewCampaign;
//       order.customerSignature = customerSignature;
//       order.renewalDate2024 = renewalDate2024;
//       order.increase = increase;
//       order.expected2024OrderValue = expected2024OrderValue;
//       order.numberOfKeyPhrase = numberOfKeyPhrase;
//       order.numberOfKeyAreas = numberOfKeyAreas;
//       order.cashFlow = cashFlow;
//       order.ddSetUp = ddSetUp;
//       order.invoiceSent = invoiceSent;
//       // order.generalMaster = generalMaster;
//       order.vatInvoice = vatInvoice;
//     //   order.contactName = contactName;
//     //   order.mobileNo = mobileNo;
//     //   order.landlineNo = landlineNo;
//     //   order.customerEmail = customerEmail;
//       order.buildingAddress = buildingAddress;
//     //   order.streetNoName = streetNoName;
//     //   order.town = town;
//     //   order.county = county;
//     //   order.postcode = postcode;
//       order.updatedBy=userId;
  
//       await order.save();
  
//       return res.status(200).json(new ApiResponse(200, order, "Order updated successfully"));
//     } catch (error) {
//       return next(error);
//     }
//   });

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
    } = req.body;

    

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

export{addOrder,getAllOrders,updateOrder,getOrderById,deleteOrder}
