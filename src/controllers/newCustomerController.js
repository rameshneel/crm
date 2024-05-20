import NewCustomer from "../models/newCustomer.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createNewCustomer = async (req, res) => {
  try {
    const newCustomer = new NewCustomer(req.body);
    const savedCustomer = await newCustomer.save();
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          savedCustomer,
          "New customer form created successfully"
        )
      );
  } catch (error) {
    console.error("Error in creating new customer form:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      res.status(400).json(new ApiResponse(400, null, messages.join(", ")));
    } else {
      res.status(500).json(new ApiResponse(500, null, "Internal Server Error"));
    }
  }
};

const getAllCustomers = async (req, res) => {
  try {
    const customers = await NewCustomer.find();
    res
      .status(200)
      .json(new ApiResponse(200, customers, "Customers fetched successfully"));
  } catch (error) {
    console.error("Error in fetching customers:", error);
    res.status(500).json(new ApiResponse(500, null, "Internal Server Error"));
  }
};

const getCustomerById = async (req, res) => {
  try {
    const customer = await NewCustomer.findById(req.params.id);
    if (customer) {
      res
        .status(200)
        .json(new ApiResponse(200, customer, "Customer fetched successfully"));
    } else {
      res.status(404).json(new ApiResponse(404, null, "Customer not found"));
    }
  } catch (error) {
    console.error("Error in fetching customer by ID:", error);
    if (error.kind === "ObjectId") {
      res.status(400).json(new ApiResponse(400, null, "Invalid customer ID"));
    } else {
      res.status(500).json(new ApiResponse(500, null, "Internal Server Error"));
    }
  }
};

export { createNewCustomer, getAllCustomers, getCustomerById };
