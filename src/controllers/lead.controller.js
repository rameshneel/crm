import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Lead from "../models/lead.model.js";
import { isValidObjectId } from "mongoose";
import mongoose from 'mongoose';


export const addLead = asyncHandler(async (req, res) => {
  const { customer_id} = req.params;
  const userId = req.user?._id;
   console.log("customer:",customer_id,"userid:",userId);
  if (!isValidObjectId(customer_id)) {
    throw new ApiError(400, "Invalid customer_id");
  }
  try {
    const {
      lead_type,
      existing_website,
      outcome,
      Appointement,
      orderforced,
      notes,
      status,
    } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User does not exist");
    }

    // if (user.role !== "admin" && user.role !== "salesman") {
    //   throw new ApiError(401, "Unauthorized request");
    // }

    const lead = await Lead.create({
      customer_id,
      generated_by:userId,
      lead_type,
      existing_website,
      outcome,
      Appointement,
      orderforced,
      notes,
      status,
    });
    return res
      .status(201)
      .json(new ApiResponse(200, lead, "Lead Add Successfully"));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: " internal Error Server Error" });
  }
});

export const getAllLeads = asyncHandler(async (req, res) => {
  try {
    const user_id = req.user?._id;
    const {customer_id} = req.params;
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let leads;
    if (user.role === "admin") {
      leads = await Lead.find();
    } else if (user.role === "salesman") {
      leads = await Lead.find({ generated_by: user_id });
    }

    return res.status(200).json({ leads });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
});


export const LeadDetailsss = asyncHandler(async (req, res) => {
  const { lead_id } = req.params;
  console.log(lead_id);
  if (!isValidObjectId(lead_id)) {
    throw new ApiError(400, "Invalid lead_id");
  }
  try {
    const lead = await Lead.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(lead_id) } },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' },
      {
        $lookup: {
          from: 'users',
          localField: 'generated_by',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          companyName: '$customer.companyName',
          contactName: '$customer.contactName',
          representativeName: '$user.fullName'
        }
      }
    ]);

    if (!lead.length) {
      throw new ApiError("Lead Not Found!");
    }

    res.status(200).json(lead[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});


export const LeadDetails = asyncHandler(async (req, res) => {
  const { lead_id } = req.params;
  if (!isValidObjectId(lead_id)) {
    throw new ApiError(400, "Invalid lead_id");
  }
  try {
    const lead = await Lead.findById(lead_id)
      .populate({
        path: 'customer_id',
        select: 'companyName contactName'
      })
      .populate({
        path: 'generated_by',
        select: 'fullName'
      });

    if (!lead) {
      throw new ApiError("Lead Not Found!");
    }

    // Extract necessary fields from the populated data
    const { companyName, contactName } = lead.customer_id;
    const { fullName } = lead.generated_by;

    // Now you can use companyName, contactName, and fullName as needed
    res.status(200).json({ companyName, contactName, fullName });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
