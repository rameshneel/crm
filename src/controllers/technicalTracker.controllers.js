import TechnicalTracker from "../models/technicalTracker.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createTechnicalTracker = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { priority, technicalTask, status, timeTakenMinutes } = req.body;

    if (!customerId || !priority || !technicalTask) {
      throw new ApiError(400, "Missing required fields");
    }

    const newTracker = new TechnicalTracker({
      customer: customerId,
      createdBy: req.user._id,
      priority,
      technicalTask,
      status,
      timeTakenMinutes,
    });

    const savedTracker = await newTracker.save();

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { savedTracker },
          "Technical tracker created successfully"
        )
      );
  } catch (error) {
    console.error("Error creating technical tracker:", error);
    next(error);
  }
};

const updateTechnicalTracker = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { priority, technicalTask, status, timeTakenMinutes, dateComplete } =
      req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    const tracker = await TechnicalTracker.findById(id);
    if (!tracker) {
      throw new ApiError(404, "Technical tracker not found");
    }

    // Check permissions
    if (userRole !== "admin" && !tracker.createdBy.equals(userId)) {
      throw new ApiError(403, "Not authorized to update this tracker");
    }

    // Update only provided fields
    const updateData = {
      ...(priority && { priority }),
      ...(technicalTask && { technicalTask }),
      ...(status && { status }),
      ...(timeTakenMinutes && { timeTakenMinutes }),
      ...(dateComplete && { dateComplete }),
      updatedBy: userId,
    };

    const updatedTracker = await TechnicalTracker.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { updatedTracker },
          "Technical tracker updated successfully"
        )
      );
  } catch (error) {
    console.error("Error updating technical tracker:", error);
    next(error);
  }
};

const deleteTechnicalTracker = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const tracker = await TechnicalTracker.findById(id);
    if (!tracker) {
      throw new ApiError(404, "Technical tracker not found");
    }

    if (userRole !== "admin" && !tracker.createdBy.equals(userId)) {
      throw new ApiError(403, "Not authorized to delete this tracker");
    }

    await TechnicalTracker.findByIdAndDelete(id);

    res
      .status(200)
      .json(
        new ApiResponse(200, null, "Technical tracker deleted successfully")
      );
  } catch (error) {
    next(error);
  }
};

const getTechnicalTrackerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const tracker = await TechnicalTracker.findById(id)
      .populate("customer", "companyName contactName")
      .populate("createdBy", "name email avatar");
    if (!tracker) {
      throw new ApiError(404, "Technical tracker not found");
    }

    if (userRole !== "admin" && !tracker.createdBy.equals(userId)) {
      throw new ApiError(403, "Not authorized to view this tracker");
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { tracker },
          "Technical tracker retrieved successfully"
        )
      );
  } catch (error) {
    next(error);
  }
};

const getAllTechnicalTrackers = async (req, res, next) => {
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

    const total = await TechnicalTracker.countDocuments(query);
    const trackers = await TechnicalTracker.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("customer", "companyName contactName")
      .populate("createdBy", "name email avatar");

    const totalPages = Math.ceil(total / limit);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          trackers,
          currentPage: page,
          totalPages,
          totalTrackers: total,
        },
        "Technical trackers retrieved successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

export {
  createTechnicalTracker,
  updateTechnicalTracker,
  getAllTechnicalTrackers,
  getTechnicalTrackerById,
  deleteTechnicalTracker,
};
