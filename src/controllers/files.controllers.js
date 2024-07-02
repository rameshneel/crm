import mongoose from "mongoose";
// import { getEntityModel } from "../helper/getEntityModel.js";
import File from "../models/files.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Customer from "../models/customer.model.js";
import Order from "../models/order.model.js";
import { User } from "../models/user.model.js";
import Amendment from "../models/amendment.model.js";
import Lead from "../models/lead.model.js";
import fs from "fs/promises";
import path from "path"; 


function getCorrectEntityType(entityType) {
  const specialCases = {
    // 'newwebsite': 'NewWebsite',
    // 'technicalmaster': 'TechnicalMaster',
    // 'copywritertracker': 'CopywriterTracker',
    // 'technicaltracker': 'TechnicalTracker',
    customer: "Customer",
    order: "Order",
    user: "User",
    amendment: "Amendment",
    lead: "Lead",
  };

  const lowerCaseType = entityType.toLowerCase();

  if (lowerCaseType in specialCases) {
    return specialCases[lowerCaseType];
  }

  // Default case: capitalize first letter
  return entityType.charAt(0).toUpperCase() + entityType.slice(1).toLowerCase();
}
function getEntityModel(entityType) {
  const models = {
    Customer,
    Order,
    User,
    Amendment,
    Lead,
    // NewWebsite,
    // TechnicalMaster,
    // CopywriterTracker,
    // TechnicalTracker
  };
  return models[entityType];
}
const getAllFilesForEntity = asyncHandler(async (req, res, next) => {
  try {
    const { entityId, entityType } = req.params;
    const correctEntityType = getCorrectEntityType(entityType);

    const validEntityTypes = [
      "Customer",
      "Order",
      "User",
      "Amendment",
      "Lead",
      "NewWebsite",
      "TechnicalMaster",
      "CopywriterTracker",
      "TechnicalTracker",
    ];
    if (!validEntityTypes.includes(correctEntityType)) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid entity type"));
    }

    if (!mongoose.Types.ObjectId.isValid(entityId)) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid entity ID"));
    }
    const EntityModel = getEntityModel(correctEntityType);
    const entity = await EntityModel.findById(entityId);
    if (!entity) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, `${correctEntityType} not found`));
    }

    const files = await File.find({
      itemType: correctEntityType,
      itemId: entityId,
      source: "FileGallery",
    }).sort({ createdAt: -1 }); 

    // const fileData = files.map((file) => ({
    //   id: file._id,
    //   fileUrl: file.fileUrl,
    //   uploadedBy: file.uploadedBy,
    //   createdAt: file.createdAt,
    // }));

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { files },
          `Files retrieved for ${correctEntityType}`
        )
      );
  } catch (error) {
    console.error("Error in getAllFilesForEntity:", error);
    next(error);
  }
});
// const uploadFilesToGallery = asyncHandler(async (req, res, next) => {
//   try {
//     const userId = req.user?._id;
//     const { entityId, entityType } = req.params;

//     const correctEntityType = getCorrectEntityType(entityType);

//     if (!req.files || req.files.length === 0) {
//       return res
//         .status(400)
//         .json(new ApiResponse(400, {}, "No files uploaded"));
//     }

//     const validEntityTypes = [
//       "Customer",
//       "Order",
//       "User",
//       "Amendment",
//       "Lead",
//       "NewWebsite",
//       "TechnicalMaster",
//       "CopywriterTracker",
//       "TechnicalTracker",
//     ];
//     if (!validEntityTypes.includes(correctEntityType)) {
//       return res
//         .status(400)
//         .json(new ApiResponse(400, {}, "Invalid entity type"));
//     }


//     if (!mongoose.Types.ObjectId.isValid(entityId)) {
//       return res
//         .status(400)
//         .json(new ApiResponse(400, {}, "Invalid entity ID"));
//     }

//     const EntityModel = getEntityModel(correctEntityType);
//     const entity = await EntityModel.findById(entityId);
//     if (!entity) {
//       return res
//         .status(404)
//         .json(new ApiResponse(404, {}, `${correctEntityType} not found`));
//     }

//     const uploadedFiles = [];

//     for (const file of req.files) {
//       const { path, filename } = file;

//       const newFile = new File({
//         uploadedBy: userId,
//         fileUrl: filename,
//         itemType: correctEntityType,
//         itemId: entityId,
//         source: "FileGallery",
//       });

//       await newFile.save();
//       uploadedFiles.push(path);
//     }
   
//     return res
//       .status(201)
//       .json(
//         new ApiResponse(201, { uploadedFiles }, "Files uploaded to gallery")
//       );
//   } catch (error) {
//     console.error("Error in uploadFilesToGallery:", error);
//     next(error);
//   }
// });

const uploadFilesToGallery = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { entityId, entityType } = req.params;

    const correctEntityType = getCorrectEntityType(entityType);

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "No files uploaded"));
    }

    const validEntityTypes = [
      "Customer",
      "Order",
      "User",
      "Amendment",
      "Lead",
      "NewWebsite",
      "TechnicalMaster",
      "CopywriterTracker",
      "TechnicalTracker",
    ];
    if (!validEntityTypes.includes(correctEntityType)) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid entity type"));
    }
    
    if (!mongoose.Types.ObjectId.isValid(entityId)) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid entity ID"));
    }

    const EntityModel = getEntityModel(correctEntityType);
    const entity = await EntityModel.findById(entityId);
    if (!entity) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, `${correctEntityType} not found`));
    }

    const uploadedFiles = [];
    

    for (const file of req.files) {
      const { path: localPath, filename } = file;

      const newFile = new File({
        uploadedBy: userId,
        fileUrl: filename,
        itemType: correctEntityType,
        itemId: entityId,
        source: "FileGallery",
      });

      await newFile.save();
      uploadedFiles.push({ id: newFile._id, localPath, filename });
    }

    // Send response
    res.status(201).json(
      new ApiResponse(201, { uploadedFiles }, "Files uploaded to gallery")
    );

    for (const file of uploadedFiles) {
      try {
        await fs.unlink(file.localPath);
        console.log(`Successfully deleted local file: ${file.localPath}`);
      } catch (unlinkError) {
        console.error(`Error deleting local file ${file.localPath}:`, unlinkError);
      }
    }

  } catch (error) {
    console.error("Error in uploadFilesToGallery:", error);
    next(error);
  }
});
const getFileById = asyncHandler(async (req, res, next) => {
  try {
    const { fileId } = req.params;
    console.log(fileId);

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json(new ApiResponse(400, {}, "Invalid file ID"));
    }

    const file = await File.findById(fileId);
    console.log(file);

    if (!file) {
      return res.status(404).json(new ApiResponse(404, {}, "File not found"));
    }

    // Prepare the response data
    const fileData = {
      id: file._id,
      fileUrl: file.fileUrl,
      uploadedBy: file.uploadedBy,
      itemType: file.itemType,
      itemId: file.itemId,
      source: file.source,
      createdAt: file.createdAt,
    };

    return res
      .status(200)
      .json(
        new ApiResponse(200, { file: fileData }, "File retrieved successfully")
      );
  } catch (error) {
    console.error("Error in getFileById:", error);
    next(error);
  }
});
const deleteFileById = asyncHandler(async (req, res, next) => {
  try {
    const { fileId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json(new ApiResponse(400, {}, "Invalid file ID"));
    }
    const file = await File.findByIdAndDelete(fileId);

    if (!file) {
      return res.status(404).json(new ApiResponse(404, {}, "File not found"));
    }

    // TODO: Add logic to delete the actual file from your storage (e.g., S3, local filesystem)
    // This depends on how you're storing your files
    // Example: await deleteFileFromStorage(file.fileUrl);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "File deleted successfully"));
  } catch (error) {
    console.error("Error in deleteFileById:", error);
    next(error);
  }
});
 
export {
  uploadFilesToGallery,
  getAllFilesForEntity,
  getFileById,
  deleteFileById,
};
