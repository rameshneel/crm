import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Lead from "../models/lead.model.js";
import { isValidObjectId } from "mongoose";
import mongoose from 'mongoose';
import Customer from "../models/customer.model.js";


// export const addLead = asyncHandler(async (req, res, next) => {
//   const userId = req.user?._id;
//   const { customer_id } = req.params;
//   if (!isValidObjectId(customer_id)) {
//     return next(new ApiError(400, "Invalid customer_id"));
//   }
  
//   try {
//     const { lead_type,outcome,orderForecast,contactPerson,mobileNumber,
//        notes,landlineNumber,currentWebsite,emailAddress,customerName} = req.body;
//     const user = await User.findById(userId);
//     if (!user) {
//       return next(new ApiError(404, "User does not exist"));
//     }

//     const lead = await Lead.create({
//       customer_id,
//       generated_by: userId,
//       lead_type,
//       outcome,
//       orderForecast,
//       contactPerson,
//       mobileNumber,
//       landlineNumber,
//       currentWebsite,
//       emailAddress,
//       customerName,
//       notes,
//     });

//     return res.status(201).json(new ApiResponse(200, lead, "Lead added successfully"));
//   } catch (error) {
//     return next(error);
//   }
// });


export const addLead = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id;
  const { customer_id } = req.params;
  const { customerName } = req.body;

  if (!customer_id && !customerName) {
    return next(new ApiError(400, "Either customer_id or customerName must be provided"));
  }

  if (customer_id && customerName) {
    return next(new ApiError(400, "Only one of customer_id or customerName should be provided"));
  }

  if (customer_id && !isValidObjectId(customer_id)) {
    return next(new ApiError(400, "Invalid customer_id"));
  }

  try {
    const {
      lead_type, outcome, orderForecast, contactPerson, mobileNumber,
      notes, landlineNumber, currentWebsite, emailAddress
    } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return next(new ApiError(404, "User does not exist"));
    }
   
    
    const leadData = {
      generated_by: userId,
      lead_type,
      outcome,
      orderForecast,
      contactPerson,
      mobileNumber,
      landlineNumber,
      currentWebsite,
      emailAddress,
      notes,
    };
   
    if (customer_id) {
       const customer = await Customer.findById(customer_id);
       const contactName= customer.companyName
      leadData.customerName=contactName
      leadData.customer_id = customer_id;
     
    } else {
      const exsitsemailincustomer = await Customer.findOne({customerEmail:emailAddress});
      console.log("CUSTOMER ",exsitsemailincustomer);
      //  if(exsitsemailincustomer){
      //   throw new ApiError(400,"Email already exists in Customer")
      //  }
      leadData.customerName = customerName;
    }
    const lead = await Lead.create(leadData);

    return res.status(201).json(new ApiResponse(200, lead, "Lead added successfully"));
  } catch (error) {
    return next(error);
  }
});

export const getAllLeads = asyncHandler(async (req, res, next) => {
  try {
    const user_id = req.user?._id;
    const user = await User.findById(user_id);
    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    let leads;
    if (user.role === "admin") {
      leads = await Lead.find().populate({
        path: 'customer_id',
      }).populate({
        path: 'generated_by',
        select: 'fullName avatar'
      });
    } else if (user.role === "salesman") {
      leads = await Lead.find({ generated_by: user_id }).populate({
        path: 'customer_id',
      }).populate({
        path: 'generated_by',
        select: 'fullName avatar'
      });
    }

    return res.status(200).json(new ApiResponse(200, leads, "Leads retrieved successfully"));
  } catch (error) {
    return next(error);
  }
});

// export const LeadDetails = asyncHandler(async (req, res, next) => {
//   const { lead_id } = req.params;
//   if (!isValidObjectId(lead_id)) {
//     return next(new ApiError(400, "Invalid lead_id"));
//   }

//   try {
//     const objectId = new mongoose.Types.ObjectId(lead_id);

//     const lead = await Lead.aggregate([
//       { $match: { _id: objectId } },
//       {
//         $lookup: {
//           from: 'customers',
//           localField: 'customer_id',
//           foreignField: '_id',
//           as: 'customer'
//         }
//       },
//       { $unwind: '$customer' },
//       {
//         $lookup: {
//           from: 'users',
//           localField: 'generated_by',
//           foreignField: '_id',
//           as: 'user'
//         }
//       },
//       { $unwind: '$user' },
//       {
//         $project: {
//           _id: 0,
//           companyName: '$customer.companyName',
//           contactName: '$customer.contactName',
//           Address: '$customer.address',
//           representativeName: '$user.fullName'
//         }
//       }
//     ]);

//     if (!lead.length) {
//       return next(new ApiError(404, "Lead not found"));
//     }

//     return res.status(200).json(new ApiResponse(200, lead[0], "Lead fetched successfully"));
//   } catch (error) {
//     return next(error);
//   }
// });


// export const updateLead = asyncHandler(async (req, res, next) => {
//   const { lead_id } = req.params;
//   const userId = req.user?._id;

//   if (!isValidObjectId(lead_id)) {
//     return next(new ApiError(400, "Invalid lead_id"));
//   }

//   const {
//     lead_type,
//     outcome,
//     orderForecast,
//     contactPerson,
//     mobileNumber,
//     notes,
//     landlineNumber,
//     currentWebsite,
//     emailAddress,
//     // for customers
//     // companyName,
//     // contactName,
//     // streetNoName,
//     town,
//     county,
//     postcode,
//     status
//   } = req.body;

//   try {
//     const user = await User.findById(userId);
//     if (!user) {
//       return next(new ApiError(404, "User does not exist"));
//     }
     
//     const lead = await Lead.findById(lead_id);
//     if (!lead) {
//       return next(new ApiError(404, "Lead not found"));
//     }

//     if (user.role !== "admin" && lead.generated_by.toString() !== userId) {
//       return next(new ApiError(401, "Unauthorized request"));
//     }

//     // Update lead details
//     lead.lead_type = lead_type;
//     lead.currentWebsite = currentWebsite;
//     lead.outcome = outcome;
//     lead.updated_by = user._id;
//     lead.orderForecast = orderForecast;
//     lead.notes = notes;
//     lead.contactPerson = contactPerson;
//     lead.mobileNumber = mobileNumber;
//     lead.landlineNumber = landlineNumber;
//     lead.emailAddress = emailAddress;
//     await lead.save();

//     if (outcome === 'SOLD') {
//       if (!town || !county || !postcode) {
//         throw new ApiError(400,"Town,County,Postcode are Required");
//     }
//       try {
//         const customerData = {
//           companyName:lead.customerName,
//           contactName: contactPerson,
//           mobileNo: mobileNumber,
//           landlineNo: landlineNumber,
//           customerEmail: emailAddress,
//           town,
//           county,
//           postcode,
//           url: currentWebsite,
//           createdBy: userId,
//           status
//         };
//         // console.log(customerData);
//         if (lead.customer_id) {
//           const customer = await Customer.findById(lead.customer_id);
//           if (!customer) {
//             return next(new ApiError(404, "Customer not found"));
//           }
//           await Customer.findByIdAndUpdate(lead.customer_id);
//         } else {
//           // const existingCustomer = await Customer.findOne({ customerEmail: customerData.customerEmail });
//           // if (existingCustomer) {
//           //     throw new ApiError(400, "Email already exists in Customer");
//           // }
          
//           const newCustomer = new Customer(customerData);
//           try {
//             await newCustomer.save();
//             console.log("After saving new customer");
//           } catch (saveError) {
//             console.error("Error saving new customer:", saveError);
//             return res.status(500).json({
//               success: false,
//               error: "Failed to save new customer",
//               message: saveError.message 
//             });
//           }
          
//         }
//         await Lead.findByIdAndDelete(lead_id);
//         return res.status(200).json(new ApiResponse(200, null, "Lead updated and customer processed successfully"));
//       } catch (error) {
//         return next(new ApiError(500, "Failed to process customer or delete lead"));
//       }
//     }

//     return res.status(200).json(new ApiResponse(200, lead, "Lead updated successfully"));
//   } catch (error) {
//     return next(error);
//   }
// });

export const updateLead = asyncHandler(async (req, res, next) => {
  const { lead_id } = req.params;
  const userId = req.user?._id;

  if (!isValidObjectId(lead_id)) {
    return next(new ApiError(400, "Invalid lead_id"));
  }

  const {
    lead_type,
    outcome,
    orderForecast,
    contactPerson,
    mobileNumber,
    notes,
    landlineNumber,
    currentWebsite,
    emailAddress,
    town,
    county,
    postcode,
    status
  } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(new ApiError(404, "User does not exist"));
    }

    const lead = await Lead.findById(lead_id);
    if (!lead) {
      return next(new ApiError(404, "Lead not found"));
    }

    if (user.role !== "admin" && lead.generated_by.toString() !== userId) {
      return next(new ApiError(401, "Unauthorized request"));
    }

    // Update lead details
    const updatedLead = await Lead.findByIdAndUpdate(
      lead_id,
      {
        lead_type,
        currentWebsite,
        outcome,
        updated_by: user._id,
        orderForecast,
        notes,
        contactPerson,
        mobileNumber,
        landlineNumber,
        emailAddress
      },
      { new: true } // Return the updated document
    );

    if (outcome === 'SOLD') {
      // if (!town || !county || !postcode) {
      //   return next(new ApiError(400, "Town, County, Postcode are required"));
      // }

      const customerData = {
        companyName: updatedLead.customerName,
        contactName: contactPerson,
        mobileNo: mobileNumber,
        landlineNo: landlineNumber,
        customerEmail: emailAddress,
        town,
        county,
        postcode,
        url: currentWebsite,
        createdBy: userId,
        status
      };

      if (updatedLead.customer_id) {
        const customer = await Customer.findByIdAndUpdate(updatedLead.customer_id, customerData, { new: true });
        if (!customer) {
          return next(new ApiError(404, "Customer not found"));
        }
      } else {
        const newCustomer = new Customer(customerData);
        try {
          await newCustomer.save();
        } catch (saveError) {
          return res.status(500).json({
            success: false,
            message: "Failed to save new customer",
            error:saveError.message
          });
          
        }
      }
    
      await Lead.findByIdAndDelete(lead_id);
      return res.status(200).json(new ApiResponse(200, null, "Lead updated and customer processed successfully"));
    }

    return res.status(200).json(new ApiResponse(200, updatedLead, "Lead updated successfully"));
  } catch (error) {
    return next(error);
  }
});

export const deleteLead = asyncHandler(async (req, res, next) => {
  const { lead_id } = req.params;
  const userId = req.user?._id;
  // if (!isValidObjectId(lead_id)) {
  //   return next(new ApiError(400, "Invalid lead_id"));
  // }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    const lead = await Lead.findById(lead_id);
    if (!lead) {
      return next(new ApiError(404, "Lead not found"));
    }

    if (user.role !== "admin" && lead.generated_by.toString() !== userId) {
      return next(new ApiError(401, "Unauthorized request"));
    }
    await Lead.findByIdAndDelete(lead_id);
    // await lead.remove();

    return res.status(200).json(new ApiResponse(200, null, "Lead deleted successfully"));
  } catch (error) {
    return next(error);
  }
});

export const LeadDetails = asyncHandler(async (req, res,next) => {
  const { lead_id } = req.params;
  if (!isValidObjectId(lead_id)) {
    throw new ApiError(400, "Invalid lead_id");
  }
  try {
    const leads = await Lead.findById(lead_id)
    console.log(leads);
    const lead = await Lead.findById(lead_id)
      .populate({
        path: 'customer_id',
      })
      .populate({
        path: 'generated_by',
      });

    if (!lead) {
      throw new ApiError("Lead Not Found!");
    }

    
    // const { companyName, contactName } = lead.customer_id;
    // const { fullName } = lead.generated_by;

    return res.status(200).json(new ApiResponse(200, lead, "Leads retrieved successfully"));
  } catch (error) {
   next(error)
  }
});
