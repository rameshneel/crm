import Customer from "../models/customer.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidObjectId } from "mongoose";

const createCustomer = asyncHandler(async (req, res, next) => {
  try {
    const { companyName, contactName, mobileNo, phoneNo, email, address } = req.body;

    if (!companyName || !mobileNo || !email || !address) {
      throw new ApiError(400, "All fields are required");
    }

    const existedCustomer = await Customer.findOne({ email });

    if (existedCustomer) {
      throw new ApiError(409, "Email already exists");
    }

    const activeUser = req.user?._id;
    const newCustomer = new Customer({
      companyName,
      contactName,
      mobileNo,
      phoneNo,
      email,
      address,
      createdBy: activeUser,
    });

    const customer = await newCustomer.save();
    const createdCustomer = await Customer.findById(customer._id);

    return res.status(201).json(
      new ApiResponse(201, { createdCustomer }, "Customer registered successfully")
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
      customers = await Customer.find();
    } else if (user.role === "salesman") {
      customers = await Customer.find({ createdBy: activeUser });
    }

    return res.json(new ApiResponse(200, { customers }, "Customers fetched successfully"));
  } catch (error) {
    return next(error);
  }
});

const updateCustomer = asyncHandler(async (req, res, next) => {
  console.log("thhgtht");
  const { customer_id } = req.params;
  const userId = req.user?._id;

  if (!isValidObjectId(customer_id)) {
    return next(new ApiError(400, "Invalid customer_id"));
  }

  try {
    const { companyName, contactName, mobileNo, phoneNo, email, address } = req.body;
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
      { companyName, contactName, mobileNo, phoneNo, email, address },
      { new: true }
    );

    if (!updatedCustomer) {
      throw new ApiError(404, "Customer not found");
    }

    return res.status(200).json(new ApiResponse(200, updatedCustomer, "Customer updated successfully"));
  } catch (error) {
    return next(error);
  }
});

const deleteCustomer = asyncHandler(async (req, res, next) => {
  try {
    const activeUser = req.user?._id;
    const user = await User.findById(activeUser);
    const customerId = req.params.customerId;
    const customer = await Customer.findById(customerId);

    if (!customer) {
      throw new ApiError(404, "Customer not found");
    }

    if (user.role === "admin" || (user.role === "salesman" && customer.createdBy.equals(activeUser))) {
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

    return res.json(new ApiResponse(200, { customer }, "Customer fetched successfully"));
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
