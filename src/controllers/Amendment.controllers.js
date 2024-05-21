import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { isValidObjectId } from "mongoose";
import Appointment from "../models/appointement.model.js";
import Amendment from "../models/amendment.model.js";
import { User } from "../models/user.model.js";
import Customer from "../models/customer.model.js";

const addAmendment = asyncHandler(async (req, res, next) => {
  const { customerId } = req.params;
  const userId = req.user?._id;

  if (!isValidObjectId(customerId)) {
    throw new ApiError(400, "Invalid customer_id");
  }
  const activeCustomer = await Customer.findById(customerId)

    if (!activeCustomer) {
      throw new ApiError(404, "Customer not found");
    }

  try {
    const { date_current, customer_status, priority, status } = req.body;
    const date=new Date(date_current)
    console.log(req.body);

    const existingAppointment = await Amendment.findOne({date});

    if (existingAppointment) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            existingAppointment,
            "An amendment already exists for this date"
          )
        );
    }

    const appointment = await Amendment.create({
      date_current:date,
      customer_status,
      priority,
      status,
      customer: customerId,
      generated_by: userId,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(201, appointment, "Appointment Added Successfully")
      );
  } catch (err) {
    // let message = "Internal Server Error";

    // if (err.name === "ValidationError") {
    //   const missingFields = Object.keys(err.errors).join(", ");
    //   message = `Validation Error: ${missingFields} are required`;
    // }

    // next(new ApiError(500, message));
    next(err)
  }
});

const getAllAmendment = asyncHandler(async (req, res,next) => {
  try {
    const activeUser = req.user?._id;
    const user = await User.findById(activeUser);

    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let skip = (page - 1) * limit;

    let amendments;
    let totalCount;

    if (user.role === "admin") {
      amendments = await Amendment.find().skip(skip).limit(limit);
      totalCount = await Amendment.countDocuments();
    } else if (user.role === "salesman") {
      amendments = await Amendment.find({ generated_by: activeUser })
        .skip(skip)
        .limit(limit);
      totalCount = await Amendment.countDocuments({ generated_by: activeUser });
    }

    return res.json(
      new ApiResponse(
        200,
        { amendments, totalCount },
        "Amendment fetched successfully"
      )
    );
  } catch (error) {
    next(error);
  }
});

const getAmendmentById = asyncHandler(async (req, res,next) => {
  const { amendmentId } = req.params;
  console.log(amendmentId);

  if (!isValidObjectId(amendmentId)) {
    throw new ApiError(400, "Invalid amendmentId");
  }
  
  try {
    const amendment = await Amendment.findById(amendmentId).populate({
      path:"customer",
      // select:"contactName "
    }).populate({
      path:"generated_by",
      select: 'fullName avatar'
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
  // if (!addAmendment) {
  //   throw new ApiError(404, "Amendment does not exist");
  // }
  const { customer_status, date_complete, priority, status }=req.body;
    // const dateComplete=new Date(date_complete) 
    //  console.log(dateComplete);
    //    console.log(dateComplete);

    if (![customer_status,date_complete,priority,status ].some(field => {
      if (field === undefined) return false;
      if (typeof field === 'string') return field.trim() !== '';
      if (typeof field === 'object') return field !== null;
    })) {
      throw new ApiError(400, "At least one field is required for update");
    }

  const updateObj = {
    customer_status,
    date_complete,
    priority,
    status,
    updated_by: req.user._id,
  };

  const amendment = await Amendment.findByIdAndUpdate(
    req.params.id,
    { $set: updateObj },
    { new: true }
  );

  if (!amendment) {
    throw new ApiError(404, "Amendment not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, amendment, "Amendment updated successfully"));
});

export { addAmendment, getAllAmendment, getAmendmentById, updateAmendment };







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
