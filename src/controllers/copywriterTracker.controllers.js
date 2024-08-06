import CopywriterTracker from "../models/copywriterTracker.model.js";
import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Customer from "../models/customer.model.js";

export const createCopywriterTracker = async (req, res, next) => {
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

  const { status, dateComplete } = req.body;

  // Validate status
  const validStatuses = [
    "Homepage In Process",
    "Rework",
    "Additional Pages in Process",
    "Homepage Complete",
    "Remaining Pages in Process",
    "COMPLETED",
    "In Query",
    "Held for Critical",
    "Waiting on Info",
    "COMPLETED REWORK",
    "Area Pages Remaining",
    "Blog pages",
    "Extra Pages",
  ];

  if (!validStatuses.includes(status)) {
    return next(new ApiError(400, "Invalid status"));
  }

  // Create a new CopywriterTracker entry
  const newCopywriterTracker = new CopywriterTracker({
    customer: customerId,
    createdBy: userId,
    status,
    dateComplete,
  });

  try {
    const savedCopywriterTracker = await newCopywriterTracker.save();
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          savedCopywriterTracker,
          "CopywriterTracker created successfully"
        )
      );
  } catch (error) {
    next(new ApiError(500, error.message));
  }
};
export const updateCopywriterTracker = async (req, res, next) => {
  const { trackerId } = req.params;
  const userId = req.user?._id;
  const userRole = req.user?.role;

  // Validate trackerId
  if (!isValidObjectId(trackerId)) {
    return next(new ApiError(400, "Invalid trackerId"));
  }

  // Find the tracker
  const tracker = await CopywriterTracker.findById(trackerId);
  if (!tracker) {
    return next(new ApiError(404, "CopywriterTracker does not exist"));
  }

  // Check if the user is authorized to update the tracker
  if (
    userRole !== "admin" &&
    tracker.createdBy.toString() !== userId.toString()
  ) {
    return next(
      new ApiError(
        403,
        "You are not authorized to update this CopywriterTracker"
      )
    );
  }

  const { status, dateComplete } = req.body;

  // Validate status if it's being updated
  if (status) {
    const validStatuses = [
      "Homepage In Process",
      "Rework",
      "Additional Pages in Process",
      "Homepage Complete",
      "Remaining Pages in Process",
      "COMPLETED",
      "In Query",
      "Held for Critical",
      "Waiting on Info",
      "COMPLETED REWORK",
      "Area Pages Remaining",
      "Blog pages",
      "Extra Pages",
    ];

    if (!validStatuses.includes(status)) {
      return next(new ApiError(400, "Invalid status"));
    }

    tracker.status = status;
  }

  // Update dateComplete if it's being provided
  if (dateComplete) {
    tracker.dateComplete = dateComplete;
  }

  try {
    const updatedTracker = await tracker.save();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedTracker,
          "CopywriterTracker updated successfully"
        )
      );
  } catch (error) {
    next(new ApiError(500, error.message));
  }
};
export const getCopywriterTrackers = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};
    if (userRole !== "admin") {
      query = { createdBy: userId };
    }

    const total = await CopywriterTracker.countDocuments(query);
    const copywriterTrackers = await CopywriterTracker.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("customer", "companyName contactName")
      .populate("createdBy", "name email avatar")
      .populate("updates");

    const totalPages = Math.ceil(total / limit);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          copywriterTrackers,
          currentPage: page,
          totalPages,
          totalCopywriterTrackers: total,
        },
        "CopywriterTrackers retrieved successfully"
      )
    );
  } catch (error) {
    next(new ApiError(500, error.message));
  }
};
export const deleteCopywriterTracker = async (req, res, next) => {
  const { trackerId } = req.params;
  const userId = req.user?._id;
  const userRole = req.user?.role;

  // Validate trackerId
  if (!isValidObjectId(trackerId)) {
    return next(new ApiError(400, "Invalid trackerId"));
  }

  // Find the tracker
  const tracker = await CopywriterTracker.findById(trackerId);
  if (!tracker) {
    return next(new ApiError(404, "CopywriterTracker does not exist"));
  }

  // Check if the user is authorized to delete the tracker
  if (
    userRole !== "admin" &&
    tracker.createdBy.toString() !== userId.toString()
  ) {
    return next(
      new ApiError(
        403,
        "You are not authorized to delete this CopywriterTracker"
      )
    );
  }

  try {
    await tracker.deleteOne();
    res
      .status(200)
      .json(
        new ApiResponse(200, null, "CopywriterTracker deleted successfully")
      );
  } catch (error) {
    next(new ApiError(500, error.message));
  }
};
export const getCopywriterTrackerById = async (req, res, next) => {
  const { trackerId } = req.params;
  const userId = req.user?._id;
  const userRole = req.user?.role;

  // Validate trackerId
  if (!isValidObjectId(trackerId)) {
    return next(new ApiError(400, "Invalid trackerId"));
  }

  // Find the tracker
  const tracker = await CopywriterTracker.findById(trackerId)
    .populate("customer", "companyName contactName")
    .populate("createdBy", "name email avatar");

  if (!tracker) {
    return next(new ApiError(404, "CopywriterTracker does not exist"));
  }

  // Check if the user is authorized to view the tracker
  if (
    userRole !== "admin" &&
    tracker.createdBy.toString() !== userId.toString()
  ) {
    return next(
      new ApiError(403, "You are not authorized to view this CopywriterTracker")
    );
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, tracker, "CopywriterTracker retrieved successfully")
    );
};
