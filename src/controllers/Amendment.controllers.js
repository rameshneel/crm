import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { isValidObjectId } from "mongoose";
import Appointment from "../models/appointement.model.js";
import Amendment from "../models/amendment.model.js";
import { User } from "../models/user.model.js";

const addAmendment = asyncHandler(async (req, res) => {
  const { customer_id } = req.params;
  const userId = req.user?._id;

  if (!isValidObjectId(customer_id)) {
    throw new ApiError(400, "Invalid customer_id");
  }
  if (!customer) {
    throw new ApiError(404, "Customers does not exist");
  }
  try {
    const { date_current, customer_status, priority, status } = req.body;

    const existingAppointment = await Amendment.findOne({ date });

    if (existingAppointment) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            null,
            "An amendment already exists for this date"
          )
        );
    }
    const appointment = await Appointment.create({
      date_current,
      customer_status,
      priority,
      status,
      customer: customer_id,
      generated_by: userId,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(200, appointment, "Appointment Added Successfully")
      );
    } catch (err) {
      let message = "Internal Server Error";
      
      if (err.name === "ValidationError") {
        const missingFields = Object.keys(err.errors).join(", ");
        message = `Validation Error: ${missingFields} are required`;
        statusCode = 400;
      }
    
      next(new ApiError( message));
    }
});

const amendmentList = asyncHandler(async (req, res) => {
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
    throw error;
  }
});

const amendmentDetails = asyncHandler(async (req, res) => {
  const { amendmentId } = req.params;

  if (!isValidObjectId(amendmentId)) {
    throw new ApiError(400, "Invalid amendmentId");
  }
  try {
    const user = await User.findById(amendmentId).populate({
      path:"customer",
      // select:"contactName "
    }).populate({
      path:"generated_by"
    });
    if (!user) {
      throw new ApiError(404, "Amendment Not Found!");
    }

    res
      .status(200)
      .json(new ApiResponse(200, user, "Amendment fetech Successfully"));
  } catch (error) {
    throw error;
  }
});

const updateAmendment = asyncHandler(async (req, res) => {
  const { amendmentId } = req.params;

  if (!isValidObjectId(amendmentId)) {
    throw new ApiError(400, "Invalid AmendmentId");
  }
  if (!addAmendment) {
    throw new ApiError(404, "Amendment does not exist");
  }
  const { date_current, customer_status, date_complete, priority, status } =
    req.body;

  if (!customer || !date_current || !customer_status || !priority || !status) {
    throw new ApiError(400, "All required fields must be provided");
  }

  const updateObj = {
    customer: customer_id,
    date_current,
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

export { addAmendment, amendmentList, amendmentDetails, updateAmendment };
