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

    if (user.role === "admin") {
      const customers = await Customer.find();
      return res.json(new ApiResponse(200, { customers }, "Customers fetched successfully"));
    }

    if (user.role === "salesman") {
      const customers = await Customer.find({ createdBy: activeUser });
      return res.json(new ApiResponse(200, { customers }, "Customers fetched successfully"));
    }

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


export { createCustomer, customerList, deleteCustomer};
