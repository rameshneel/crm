import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Lead from "../models/lead.model.js";
import { isValidObjectId } from "mongoose";
import mongoose from 'mongoose';
import Customer from "../models/customer.model.js";


export const addLead = asyncHandler(async (req, res) => {
  const { customer_id} = req.params;
  const userId = req.user?._id;
   console.log("customer:",customer_id,"userid:",userId);
  if (!isValidObjectId(customer_id)) {
    throw new ApiError(400, "Invalid customer_id");
  }

  const customer = await Customer.findByIdAndUpdate(
    customer_id,{
    $set:{
      hasLead:true
    }
  },
  { new: true }
);
  if (!customer) {
    throw new ApiError(404, "Customers does not exist");
  }
  
  try {
    const {
      lead_type,
      existing_website,
      outcome,
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
      orderforced,
      notes,
      status,
      
    });
     
    return res
      .status(201)
      .json(new ApiResponse(200, lead, "Lead Add Successfully"));
  } catch (error) {
    throw error;
  }
});

export const getAllLeads = asyncHandler(async (req, res) => {
  try {
    const user_id = req.user?._id;
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let leads;
    if (user.role === "admin") {
      leads = await Lead.find().populate({
                path: 'customer_id',
               }).populate({
                path: 'generated_by',
               });
    } else if (user.role === "salesman") {
      leads = await Lead.find({ generated_by: user_id }).populate({
                path: 'customer_id',
               }).populate({
                path: 'generated_by',
               });
    }

   return res.status(200).json(
      new ApiResponse(
        200,
        leads,
        "lead Retrieved Successfully"
      )
    );
  } catch (error) {
   throw error
  }
});

export const LeadDetails = asyncHandler(async (req, res) => {
  const { lead_id } = req.params;
  console.log(lead_id);
  if (!isValidObjectId(lead_id)) {
    throw new ApiError(400, "Invalid lead_id");
  }
  const leads = await Lead.findById(lead_id)
    console.log(leads);
  try {
    const objectId = new mongoose.Types.ObjectId(lead_id)
    // const le=await Lead.findById(objectId)
    console.log("le");
    const lead = await Lead.aggregate([
      { $match: { _id:objectId }},
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

    console.log("lead",lead);

    if (!lead.length) {
      throw new ApiError("Lead Not Found!");
    }
    return res
    .status(200)
    .json(
      new ApiResponse(200, lead[0], "Lead fetched successfully")
    );
    // res.status(200).json(lead[0]);
  } catch (error) {
   throw error;
  }
});

export const updateLead = asyncHandler(async (req, res) => {
  const { lead_id } = req.params;
  const userId = req.user?._id;
  console.log("xyz");
  if (!isValidObjectId(lead_id)) {
    throw new ApiError(400, "Invalid lead_id");
  }
  
  try {
    const {
      lead_type,
      existing_website,
      outcome,
      orderforced,
      notes,
      status,
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User does not exist");
    }

    const lead = await Lead.findById(lead_id);
    if (!lead) {
      throw new ApiError(404, "Lead not found");
    }

    if (user.role !== "admin" && lead.generated_by.toString() !== userId) {
      throw new ApiError(401, "Unauthorized request");
    }

    lead.lead_type = lead_type;
    lead.existing_website = existing_website;
    lead.outcome = outcome;
    lead.updated_by = user._id;
    lead.orderforced = orderforced;
    lead.notes = notes;
    lead.status = status; 

    await lead.save();

    return res.status(200).json(new ApiResponse(200, lead, "Lead updated successfully"));
  } catch (error) {
   throw error;
  }
});

export const deleteLead = asyncHandler(async (req, res) => {
  const { lead_id } = req.params;
  const userId = req.user?._id;
  
  if (!isValidObjectId(lead_id)) {
    throw new ApiError(400, "Invalid lead_id");
  }
  
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const lead = await Lead.findById(lead_id);
    if (!lead) {
      throw new ApiError(404, "Lead not found");
    }

    // Ensure that only the user who generated the lead or an admin can delete it
    if (user.role !== "admin" && lead.generated_by.toString() !== userId) {
      throw new ApiError(401, "Unauthorized request");
    }

    await lead.remove();

    return res.status(200).json(new ApiResponse(200, null, "Lead deleted successfully"));
  } catch (error) {
    throw error;
  }
});



// export const LeadDetails = asyncHandler(async (req, res) => {
//   const { lead_id } = req.params;
//   if (!isValidObjectId(lead_id)) {
//     throw new ApiError(400, "Invalid lead_id");
//   }
//   try {
//     const leads = await Lead.findById(lead_id)
//     console.log(leads);
//     const lead = await Lead.findById(lead_id)
//       .populate({
//         path: 'customer_id',
//         select: 'companyName contactName'
//       })
//       .populate({
//         path: 'generated_by',
//         select: 'fullName'
//       });
//   console.log("lead",lead);
//     if (!lead) {
//       throw new ApiError("Lead Not Found!");
//     }

//     // Extract necessary fields from the populated data
//     const { companyName, contactName } = lead.customer_id;
//     const { fullName } = lead.generated_by;

//     // Now you can use companyName, contactName, and fullName as needed
//     res.status(200).json({ companyName, contactName, fullName });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// });
