import { isValidObjectId } from "mongoose";
import ProductFlow from "../models/productFlow.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Customer from "../models/customer.model.js";

export const createProductFlow = async (req, res, next) => {
  const { customerId } = req.params;
  const userId = req.user?._id;

  // Validate customerId
  if (!isValidObjectId(customerId)) {
    return next(new ApiError(400, "Invalid customerId"));
  }
  const customer = await Customer.findById(customerId);
  if (!customer) {
    return next(new ApiError(404, "Customer does not exist"));
  }
  // Extract and validate fields from the request body
  const {
    currentStage = "",
    datePhase1Instructed = null,
    datePhase2Instructed = null,
    demoLink = "",
    demoCompletedDate = null,
    liveDate = "",
    notes = "",
  } = req.body;

  // Validate currentStage
  if (!currentStage) {
    return next(new ApiError(400, "currentStage is required"));
  }

  // Validate currentStage enum values
  // const validStages = [
  //   "Copy Writer",
  //   "Upload",
  //   "awaiting domain",
  //   "in query",
  //   "awr cloud/search console",
  //   "all content added",
  //   "qc changes",
  //   "Qc",
  //   "waiting on area pages",
  //   "upload query",
  //   "complete",
  //   "copywriter",
  //   "copywrite stage 2",
  //   "design stage 1",
  //   "design stage 2",
  // ];

  // if (!validStages.includes(currentStage)) {
  //   return next(new ApiError(400, "Invalid currentStage value"));
  // }

  try {
    // Create and save the new ProductFlow
    const productFlow = new ProductFlow({
      customer: customerId,
      createdBy: userId,
      currentStage,
      datePhase1Instructed,
      datePhase2Instructed,
      demoLink,
      demoCompletedDate,
      liveDate,
      notes,
    });

    await productFlow.save();

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { productFlow },
          "ProductFlow created successfully"
        )
      );
  } catch (error) {
    next(new ApiError(500, error.message));
  }
};
// Get all ProductFlows
export const getProductFlows = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    // const page = parseInt(req.query.page) || 1;
    // const limit = parseInt(req.query.limit) || 10;
    // const skip = (page - 1) * limit;

    let query = {};
    if (userRole !== "admin") {
      query = { createdBy: userId };
    }

    const total = await ProductFlow.countDocuments(query);
    const productFlows = await ProductFlow.find(query)
      .sort({ createdAt: -1 })
      // .skip(skip)
      // .limit(limit)
      .populate("customer", "companyName contactName")
      .populate("createdBy", "name email avatar")
      .populate("updates");

    // const totalPages = Math.ceil(total / limit);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          productFlows,
          // currentPage: page,
          // totalPages,
          // totalProductFlows: total,
        },
        "ProductFlows retrieved successfully"
      )
    );
  } catch (error) {
    next(new ApiError(500, error.message));
  }
};
// Get a single ProductFlow by ID
export const getProductFlowById = async (req, res, next) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return next(new ApiError(400, "Invalid productFlow id"));
  }

  try {
    const productFlow = await ProductFlow.findById(id)
      .populate("customer", "companyName contactName")
      .populate("createdBy", "name email avatar")
      .populate("updates");

    if (!productFlow) {
      return next(new ApiError(404, "ProductFlow not found"));
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { productFlow },
          "ProductFlow retrieved successfully"
        )
      );
  } catch (error) {
    next(new ApiError(500, error.message));
  }
};
//put method
export const updateProductFlo = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user?._id;

  // Validate id
  if (!isValidObjectId(id)) {
    return next(new ApiError(400, "Invalid productFlow id"));
  }

  // Extract and validate fields from the request body
  const {
    currentStage,
    datePhase1Instructed,
    datePhase2Instructed,
    demoLink,
    demoCompletedDate,
    liveDate,
    notes,
    updates,
  } = req.body;

  // Validate currentStage if provided
  if (currentStage) {
    const validStages = [
      "Copy Writer",
      "Upload",
      "awaiting domain",
      "in query",
      "awr cloud/search console",
      "all content added",
      "qc changes",
      "Qc",
      "waiting on area pages",
      "upload query",
      "complete",
      "copywriter",
      "copywrite stage 2",
      "design stage 1",
      "design stage 2",
    ];

    if (!validStages.includes(currentStage)) {
      return next(new ApiError(400, "Invalid currentStage value"));
    }
  }

  try {
    // Find the existing ProductFlow document
    const productFlow = await ProductFlow.findById(id);

    if (!productFlow) {
      return next(new ApiError(404, "ProductFlow not found"));
    }

    // Update fields
    if (currentStage) productFlow.currentStage = currentStage;
    if (datePhase1Instructed)
      productFlow.datePhase1Instructed = datePhase1Instructed;
    if (datePhase2Instructed)
      productFlow.datePhase2Instructed = datePhase2Instructed;
    if (demoLink) productFlow.demoLink = demoLink;
    if (demoCompletedDate) productFlow.demoCompletedDate = demoCompletedDate;
    if (liveDate) productFlow.liveDate = liveDate;
    if (notes) productFlow.notes = notes;
    if (updates) productFlow.updates = updates;

    // Save the updated ProductFlow
    await productFlow.save();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { productFlow },
          "ProductFlow updated successfully"
        )
      );
  } catch (error) {
    next(new ApiError(500, error.message));
  }
};
//patch method
export const updateProductFlow = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user?._id;

  // Validate id
  if (!isValidObjectId(id)) {
    return next(new ApiError(400, "Invalid productFlow id"));
  }

  // Extract fields from the request body
  const {
    currentStage,
    datePhase1Instructed,
    datePhase2Instructed,
    demoLink,
    demoCompletedDate,
    liveDate,
    notes,
  } = req.body;

  // Validate currentStage if provided
  // if (currentStage) {
  //   const validStages = [
  //     "Copy Writer",
  //     "Upload",
  //     "awaiting domain",
  //     "in query",
  //     "awr cloud/search console",
  //     "all content added",
  //     "qc changes",
  //     "Qc",
  //     "waiting on area pages",
  //     "upload query",
  //     "complete",
  //     "copywriter",
  //     "copywrite stage 2",
  //     "design stage 1",
  //     "design stage 2",
  //   ];

  //   if (!validStages.includes(currentStage)) {
  //     return next(new ApiError(400, "Invalid currentStage value"));
  //   }
  // }

  try {
    // Find the existing ProductFlow document
    const productFlow = await ProductFlow.findById(id);

    if (!productFlow) {
      return next(new ApiError(404, "ProductFlow not found"));
    }

    // Update fields if they are provided
    if (currentStage !== undefined) productFlow.currentStage = currentStage;
    if (datePhase1Instructed !== undefined)
      productFlow.datePhase1Instructed = datePhase1Instructed;
    if (datePhase2Instructed !== undefined)
      productFlow.datePhase2Instructed = datePhase2Instructed;
    if (demoLink !== undefined) productFlow.demoLink = demoLink;
    if (demoCompletedDate !== undefined)
      productFlow.demoCompletedDate = demoCompletedDate;
    if (liveDate !== undefined) productFlow.liveDate = liveDate;
    if (notes !== undefined) productFlow.notes = notes;

    // Save the updated ProductFlow
    await productFlow.save();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { productFlow },
          "ProductFlow updated successfully"
        )
      );
  } catch (error) {
    next(new ApiError(500, error.message));
  }
};
// Delete a ProductFlow by ID
export const deleteProductFlow = async (req, res, next) => {
  const { id } = req.params;

  // Validate id
  if (!isValidObjectId(id)) {
    return next(new ApiError(400, "Invalid productFlow id"));
  }

  try {
    const productFlow = await ProductFlow.findByIdAndDelete(id);

    if (!productFlow) {
      return next(new ApiError(404, "ProductFlow not found"));
    }

    res
      .status(200)
      .json(new ApiResponse(200, null, "ProductFlow deleted successfully"));
  } catch (error) {
    next(new ApiError(500, error.message));
  }
};
