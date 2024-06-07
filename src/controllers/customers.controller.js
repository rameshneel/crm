import Customer from "../models/customer.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidObjectId } from "mongoose";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";

const createCustomer = asyncHandler(async (req, res, next) => {
  try {
    const {
      companyName,
      contactName,
      mobileNo,
      landlineNo,
      streetNoName,
      town,
      county,
      customerEmail,
      postcode,
      url,
      status,
      liveDate,
      ssl,
      sitemap,
      htAccess,
      gaCode,
      newGACode,
      ordersRenewals,
    } = req.body;
   const newlivedate= new Date(liveDate)
    const existedUser = await Customer.findOne({
      $or: [{ customerEmail }],
    });

    let avatarurl = "";
    console.log(avatarurl);

    if (req.file && req.file.path) {
      const avatarLocalPath = req.file.path;
      console.log(avatarLocalPath);

      if (existedUser) {
        fs.unlinkSync(avatarLocalPath);
        throw new ApiError(409, "Email already exists");
      }
      try {
        const formData = new FormData();
        formData.append("file", fs.createReadStream(avatarLocalPath));
        const apiURL =
          "https://crm.neelnetworks.org/public/file_upload/api.php";
        const apiResponse = await axios.post(apiURL, formData, {
          headers: {
            ...formData.getHeaders(),
          },
        });
        console.log(apiResponse.data);
        avatarurl = apiResponse.data?.img_upload_path;
        if (!avatarurl) {
          throw new Error("img_upload_path not found in API response");
        }

        fs.unlink(avatarLocalPath, (err) => {
          if (err) {
            console.error("Error removing avatar file:", err.message);
          } else {
            console.log("Avatar file removed successfully");
          }
        });
      } catch (error) {
        console.error("Error uploading avatar:", error.message);
      }
    }

    if (!companyName || !mobileNo || !customerEmail) {
      throw new ApiError(400, "All fields are required");
    }

    const existedCustomer = await Customer.findOne({ customerEmail });

    if (existedCustomer) {
      throw new ApiError(409, "Email already exists");
    }

    const activeUser = req.user?._id;
    const newCustomer = new Customer({
      companyName,
      contactName,
      mobileNo,
      customerEmail,
      landlineNo,
      streetNoName,
      town,
      county,
      postcode,
      url,
      status,
      liveDate:newlivedate,
      ssl,
      sitemap,
      htAccess,
      gaCode,
      newGACode,
      logo: avatarurl,
      ordersRenewals,
      createdBy: activeUser,
      vatInvoice:
        "https://ocw.mit.edu/courses/6-096-introduction-to-c-january-iap-2011/ccef8a1ec946adb5179925311e276a7b_MIT6_096IAP11_lec02.pdf",
    });

    const customer = await newCustomer.save();
    const createdCustomer = await Customer.findById(customer._id);

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { createdCustomer },
          "Customer registered successfully"
        )
      );
  } catch (error) {
    return next(error);
  }
});

const customerList = asyncHandler(async (req, res, next) => {
  try {
    const activeUser = req.user?._id;
    const user = await User.findById(activeUser);
    let customers;

    if (user.role === "admin") {
      customers = await Customer.find().populate({
        path: "createdBy",
      });
    } else if (user.role === "salesman") {
      customers = await Customer.find({ createdBy: activeUser });
    }

    return res.json(
      new ApiResponse(200, { customers }, "Customers fetched successfully")
    );
  } catch (error) {
    return next(error);
  }
});

const updateCustomer = asyncHandler(async (req, res, next) => {
  console.log(req.file);
  const { customer_id } = req.params;
  const userId = req.user?._id;
  if (!isValidObjectId(customer_id)) {
    return next(new ApiError(400, "Invalid customer_id"));
  }

  try {
    const {
      companyName,
      contactName,
      mobileNo,
      landlineNo,
      streetNoName,
      town,
      county,
      customerEmail,
      postcode,
      url,
      address,
      status,
      liveDate,
      ssl,
      sitemap,
      htAccess,
      gaCode,
      newGACode,
      ordersRenewals,
    } = req.body;

    const newlivedate= new Date(liveDate)

    if (
      ![customerEmail,].some((field) => {
        if (field === undefined) return false;
        if (typeof field === "string") return field.trim() !== "";
      })
    ) {
      throw new ApiError(400, "At least one field is required for update");
    }

    let avatarurl = "";
    console.log(avatarurl);

    if (req.file && req.file.path) {
      const avatarLocalPath = req.file.path;
      console.log(avatarLocalPath);

      // if (existedUser) {
      //   fs.unlinkSync(avatarLocalPath);
      //   throw new ApiError(409, "Email already exists");
      // }
      try {
        const formData = new FormData();
        formData.append("file", fs.createReadStream(avatarLocalPath));
        const apiURL =
          "https://crm.neelnetworks.org/public/file_upload/api.php";
        const apiResponse = await axios.post(apiURL, formData, {
          headers: {
            ...formData.getHeaders(),
          },
        });
        console.log(apiResponse.data);
        avatarurl = apiResponse.data?.img_upload_path;
        if (!avatarurl) {
          throw new Error("img_upload_path not found in API response");
        }

        fs.unlink(avatarLocalPath, (err) => {
          if (err) {
            console.error("Error removing avatar file:", err.message);
          } else {
            console.log("Avatar file removed successfully");
          }
        });
      } catch (error) {
        console.error("Error uploading avatar:", error.message);
      }
    }

    // const atemail = await Customer.findOne(email)
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User does not exist");
    }
    const customer = await Customer.findById(customer_id);

    if (!customer) {
      throw new ApiError(404, "Customer not found");
    }

    if (user.role !== "admin" && customer.createdBy.toString() !== userId) {
      throw new ApiError(401, "Unauthorized request");
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      customer_id,
      {
        companyName,
        contactName,
        mobileNo,
        landlineNo,
        streetNoName,
        town,
        county,
        customerEmail,
        postcode,
        url,
        address,
        status,
        liveDate:newlivedate,
        ssl,
        sitemap,
        htAccess,
        gaCode,
        newGACode,
        ordersRenewals,
        logo: avatarurl,
        updatedBy: userId,
      },
      { new: true }
    );

    if (!updatedCustomer) {
      throw new ApiError(404, "Customer not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedCustomer, "Customer updated successfully")
      );
  } catch (error) {
    return next(error);
  }
});

// const updateCustomer = asyncHandler(async (req, res, next) => {
//   const { customer_id } = req.params;
//   const userId = req.user?._id;

//   if (!isValidObjectId(customer_id)) {
//     return next(new ApiError(400, "Invalid customer_id"));
//   }
  
//   try {
//     const {
//       companyName,
//       contactName,
//       mobileNo,
//       landlineNo,
//       streetNoName,
//       town,
//       county,
//       customerEmail,
//       postcode,
//       url,
//       address,
//       status,
//       liveDate,
//       ssl,
//       sitemap,
//       htAccess,
//       gaCode,
//       newGACode,
//       ordersRenewals,
//     } = req.body;
      
// if (
//   ![customerEmail, status].some((field) => {
//     if (field === undefined) return false;
//     if (typeof field === "string") return field.trim() !== "";
//   })
// ) {
//   throw new ApiError(400, "At least one field is required for update");
// }

//     let avatarurl = "";

//     // Check if file is uploaded
//     if (req.file && req.file.path) {
//       const avatarLocalPath = req.file.path;

//       // Handle file upload
//       try {
//         const formData = new FormData();
//         formData.append("file", fs.createReadStream(avatarLocalPath));
//         const apiURL = "https://crm.neelnetworks.org/public/file_upload/api.php";
//         const apiResponse = await axios.post(apiURL, formData, {
//           headers: {
//             ...formData.getHeaders(),
//           },
//         });
        
//         avatarurl = apiResponse.data?.img_upload_path;
//         if (!avatarurl) {
//           throw new Error("img_upload_path not found in API response");
//         }

//         // Remove local avatar file after upload
//         fs.unlink(avatarLocalPath, (err) => {
//           if (err) {
//             console.error("Error removing avatar file:", err.message);
//           } else {
//             console.log("Avatar file removed successfully");
//           }
//         });
//       } catch (error) {
//         // Handle avatar upload error
//         console.error("Error uploading avatar:", error.message);
//         fs.unlinkSync(avatarLocalPath); // Delete local file on error
//         throw new ApiError(500, "Avatar upload failed");
//       }
//     }

//     // Find user by userId
//     const user = await User.findById(userId);
//     if (!user) {
//       throw new ApiError(404, "User does not exist");
//     }

//     // Find customer by customer_id
//     const customer = await Customer.findById(customer_id);
//     if (!customer) {
//       throw new ApiError(404, "Customer not found");
//     }

//     // Check user authorization
//     if (user.role !== "admin" && customer.createdBy.toString() !== userId) {
//       throw new ApiError(401, "Unauthorized request");
//     }

//     // Update customer properties
//     customer.companyName = companyName;
//     customer.contactName = contactName;
//     customer.mobileNo = mobileNo;
//     customer.landlineNo = landlineNo;
//     customer.streetNoName = streetNoName;
//     customer.town = town;
//     customer.county = county;
//     customer.customerEmail = customerEmail;
//     customer.postcode = postcode;
//     customer.url = url;
//     customer.address = address;
//     customer.status = status;
//     customer.liveDate = liveDate;
//     customer.ssl = ssl;
//     customer.sitemap = sitemap;
//     customer.htAccess = htAccess;
//     customer.gaCode = gaCode;
//     customer.newGACode = newGACode;
//     customer.ordersRenewals = ordersRenewals;
//     customer.logo = avatarurl;
//     customer.updatedBy = userId;

//     // Save updated customer
//     const updatedCustomer = await customer.save();

//     // Send response
//     return res.status(200).json(new ApiResponse(200, updatedCustomer, "Customer updated successfully"));
//   } catch (error) {
//     return next(error);
//   }
// });


const deleteCustomer = asyncHandler(async (req, res, next) => {
  try {
    const activeUser = req.user?._id;
    const user = await User.findById(activeUser);
    const customerId = req.params.customerId;
    const customer = await Customer.findById(customerId);

    if (!customer) {
      throw new ApiError(404, "Customer not found");
    }

    if (
      user.role === "admin" ||
      (user.role === "salesman" && customer.createdBy.equals(activeUser))
    ) {
      await Customer.findByIdAndDelete(customerId);
      return res.status(204).end();
    } else {
      throw new ApiError(401, "Unauthorized");
    }
  } catch (error) {
    return next(error);
  }
});

const getCustomerById = asyncHandler(async (req, res, next) => {
  try {
    const { customerId } = req.params;

    if (!isValidObjectId(customerId)) {
      throw new ApiError(400, "Invalid Customer ID");
    }

    const customer = await Customer.findById(customerId);

    if (!customer) {
      throw new ApiError(404, "Customer not found");
    }

    return res.json(
      new ApiResponse(200, { customer }, "Customer fetched successfully")
    );
  } catch (error) {
    return next(error);
  }
});

export {
  createCustomer,
  customerList,
  deleteCustomer,
  getCustomerById,
  updateCustomer,
};
