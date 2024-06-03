import TechincalMaster from "../models/techincalMaster.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";

const createTechnicalMaster = asyncHandler(async (req, res, next) => {
  const { customer_id } = req.params;
  if (!isValidObjectId(customer_id)) {
    throw new ApiError(400, "Invalid Customer ID");
  }
  const {
    url,
    registerar,
    managedBy,
    domainExpiryDate,
    websiteHostedBy,
    whoHostsEmail,
    notes,
  } = req.body;
  const createdBy = req.user._id;
  try {
    const techMaster = new TechincalMaster({
      customer: customer_id,
      createdBy,
      url,
      registerar,
      managedBy,
      domainExpiryDate,
      websiteHostedBy,
      whoHostsEmail,
      notes,
    });

    await techMaster.save();
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          techMaster,
          "Technical Master created successfully"
        )
      );
  } catch (error) {
    next(error);
  }
});

const getTechnicalMasterById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return next(new ApiError(400, "Invalid ID"));
  }

  try {
    const techMaster = await TechincalMaster.findById(id)
      .populate("createdBy").populate({
        path: "createdBy",
        select: "fullName avatar",
      });

    if (!techMaster) {
      return next(new ApiError(404, "Technical Master not found"));
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          techMaster,
          "Technical Master retrieved successfully"
        )
      );
  } catch (error) {
    next(error);
  }
});

const updateTechnicalMaster = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(id)) {
    return next(new ApiError(400, "Invalid ID"));
  }

  try {
    const techMaster = await TechincalMaster.findById(id);

    if (!techMaster) {
      return next(new ApiError(404, "Technical Master not found"));
    }

    if (
      req.user.role !== "admin" &&
      techMaster.createdBy.toString() !== userId.toString()
    ) {
      return next(new ApiError(401, "Unauthorized request"));
    }

    const updates = {
      customer: req.body.customer,
      url: req.body.url,
      registerar: req.body.registerar,
      managedBy: req.body.managedBy,
      domainExpiryDate: req.body.domainExpiryDate,
      websiteHostedBy: req.body.websiteHostedBy,
      whoHostsEmail: req.body.whoHostsEmail,
      notes: req.body.notes,
      updatedBy: userId,
    };

    Object.assign(techMaster, updates);
    await techMaster.save();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          techMaster,
          "Technical Master updated successfully"
        )
      );
  } catch (error) {
    next(error);
  }
});

const deleteTechnicalMaster = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(id)) {
    return next(new ApiError(400, "Invalid ID"));
  }

  try {
    const techMaster = await TechincalMaster.findById(id);

    if (!techMaster) {
      return next(new ApiError(404, "Technical Master not found"));
    }

    if (
      req.user.role !== "admin" &&
      techMaster.createdBy.toString() !== userId.toString()
    ) {
      return next(new ApiError(401, "Unauthorized request"));
    }
    await TechincalMaster.findByIdAndDelete(id)

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Technical Master deleted successfully"));
  } catch (error) {
    next(error);
  }
});

const getAllTechnicalMasters = asyncHandler(async (req, res, next) => {
  try {
    const user_id = req.user?._id;
    const user = await User.findById(user_id);
    if (!user) {
      return next(new ApiError(404, "User not found"));
    }
    let techincalMasters;
    if (user.role === "admin") {
      techincalMasters = await TechincalMaster.find().populate("customer").populate({
        path: "createdBy",
        select: "fullName avatar",
      });
    } else if (user.role === "salesman") {
      techincalMasters = await TechincalMaster.find({ createdBy: user_id })
        .populate("customer")
        .populate({
          path: "createdBy",
          select: "fullName avatar",
        });
    } else {
      return next(new ApiError(403, "Unauthorized access"));
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          techincalMasters,
          "Technical Masters retrieved successfully"
        )
      );
  } catch (error) {
    next(error);
  }
});

export {
  createTechnicalMaster,
  getAllTechnicalMasters,
  updateTechnicalMaster,
  getTechnicalMasterById,
  deleteTechnicalMaster,
};
