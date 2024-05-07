import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Lead from "../models/lead.model.js";

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
