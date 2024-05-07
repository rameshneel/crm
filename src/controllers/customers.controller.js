import Customer from "../models/customer.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createCustomer = asyncHandler(async (req, res) => {
  try {
    const { companyName, contactName, mobileNo, phoneNo, email, address } =
      req.body;

    if (!companyName  || !mobileNo || !email || !address) {
      throw new ApiError(400, "All fields are required")
    }

    const existedCustomer = await Customer.findOne({
      $or: [{ email }],
    });

    if (existedCustomer) {
      throw new ApiError(409, "email already exists");
    }

    const activeuser = req.user?._id;
    const newCustomer = new Customer({
      companyName,
      contactName,
      mobileNo,
      phoneNo,
      email,
      address,
      createdBy: activeuser,
    });
    console.log(newCustomer);
    // Save the customer to the database
    const customer = await newCustomer.save();
    const createCustomer = await Customer.findById(customer._id);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          createCustomer,
        },
        "Customer registered Successfully"
      )
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: " internal error Server Error" });
  }
});

const customerList = asyncHandler(async (req, res) => {
  try {
    const activeUser = req.user?._id;
    const user = await User.findById(activeUser);

    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let skip = (page - 1) * limit;

    let customers;
    let totalCount;
    
    if (user.role === "admin") {
      customers = await Customer.find().skip(skip).limit(limit);
      totalCount = await Customer.countDocuments();
    } else if (user.role === "salesman") {
      customers = await Customer.find({ createdBy: activeUser }).skip(skip).limit(limit);
      totalCount = await Customer.countDocuments({ createdBy: activeUser });
    }

    return res.json(new ApiResponse(200, { customers, totalCount }, "Customers fetched successfully"));
  } catch (error) {
    throw new ApiError(400, "Customer List Error");
  }
});

const deleteCustomer = asyncHandler(async (req, res) => {
  try {
    const activeUser = req.user?._id;
    const user = await User.findById(activeUser);
    const customerId = req.params.customerId;
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json(new ApiResponse(404, {}, "Customer not found"));
    }

    // Check if the user has permission to delete the customer
    if (user.role === "admin" || (user.role === "salesman" && customer.createdBy.equals(activeUser))) {
      await Customer.findByIdAndDelete(customerId);
      return res.status(204).end();
    } else {
      return res.status(401).json(new ApiResponse(401, {}, "Unauthorized"));
    }
  } catch (error) {
    throw new ApiError(400, "Delete Customer Error");
  }
});

const getAllCustomers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, userId } = req.query;


  try {
    let aggregationPipeline = [];

    //filters videos based on a case-insensitive regular expression match in the title field
    if (query) {
      aggregationPipeline.push({
        $match: {
          title: {
            $regex: query,
            $options: "i",
          },
        },
      });
    }

    if (userId) {
      aggregationPipeline.push({
        $match: { userId: userId },
      });
    }

    // arranges videos in a specified order based on a given field and direction.


    const videos = await Customer.aggregatePaginate({
      pipeline: aggregationPipeline,
      page,
      limit,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, videos, "videos fetched successfully"));
  } catch (error) {
    throw new ApiError(500, "Error while fetching videos");
  }
});

const getCustomerById = asyncHandler(async (req, res) => {
  try {
    const { customerId } = req.params;
    console.log(customerId);
    const customer = await Customer.findById(customerId);

    if (!customer) {
      throw new ApiError(404, "Customer not found");
    }

    return res.json(new ApiResponse(200, { customer }, "Customer fetched successfully"));
  } catch (error) {
    throw new ApiError(400, "Error fetching customer data");
  }
});





export { createCustomer, customerList, deleteCustomer,getCustomerById};
