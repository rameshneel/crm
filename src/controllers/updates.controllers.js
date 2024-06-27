import mongoose from "mongoose";
import Update from "../models/update.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Customer from "../models/customer.model.js";
import Notification from "../models/notification.model.js";
import sendEmailForMentions from "../utils/sendEmailForMentions.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Order from "../models/order.model.js";
import File from "../models/files.model.js";
import Lead from "../models/lead.model.js";
import Amendment from "../models/amendment.model.js";
import { ApiError } from "../utils/ApiError.js";
import fs from "fs/promises";

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
function getEntityName(entity, entityType) {
  switch (entityType) {
    case "Customer": return entity.companyName;
    case "Order": return entity.orderNo;
    case "Lead": return entity.name;
    case "Amendment": return entity.amendmentNumber;
    case "User": return entity.name;
    default: return "Unknown";
  }
}


const getUpdateById = asyncHandler(async (req, res, next) => {
  const { updateId } = req.params;
  try {
    const update = await Update.findById(updateId);
    if (!update) {
      throw new Error("Update not found");
    }
    res.json(update);
  } catch (error) {
    next(error);
  }
});

const replyToUpdate = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id;
  const { updateId } = req.params;
  try {
    const { content, files, mentions } = req.body;
    console.log("dfhgudfhgudfb");

    const originalUpdate = await Update.findById(updateId);
    if (!originalUpdate) {
      throw new ApiError(404, "Original update not found");
    }

    const reply = new Update({
      content,
      createdBy: userId,
      files: files || [],
      mentions: mentions || [],
      replies: [],
    });

    await reply.save();
    originalUpdate.replies.push(reply._id);
    await originalUpdate.save();

    return res.json(
      new ApiResponse(201, { reply }, "Reply created successfully")
    );
  } catch (error) {
    next(error);
  }
});

const toggleLike = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id;
  const { updateId } = req.params;

  try {
    const update = await Update.findById(updateId);
    if (!update) {
      throw new ApiError(404, "Update not found");
    }

    const userLiked = update.likes.includes(userId);

    if (userLiked) {
      update.likes = update.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
      await update.save();
      return res.json(
        new ApiResponse(200, { liked: false }, "Update unliked successfully")
      );
    } else {
      update.likes.push(userId);
      await update.save();
      return res.json(
        new ApiResponse(200, { liked: true }, "Update liked successfully")
      );
    }
  } catch (error) {
    next(error);
  }
});
const updateUpdate = asyncHandler(async (req, res, next) => {
  const { updateId } = req.params;
  const userId = req.user._id;
  const { content, files, mentions } = req.body;

  try {
    const update = await Update.findById(updateId);

    if (!update) {
      throw new ApiError(404, "Update not found");
    }

    if (!update.createdBy.equals(userId)) {
      throw new ApiError(403, "You are not authorized to update this content");
    }

    const updatedUpdate = await Update.findByIdAndUpdate(
      updateId,
      { content, files, mentions },
      { new: true, runValidators: true } // Return the new document after update
    );

    return res.json(
      new ApiResponse(200, updatedUpdate, "Update modified successfully")
    );
  } catch (error) {
    next(error);
  }
});
const deleteUpdate = asyncHandler(async (req, res, next) => {
  const { updateId } = req.params;
  const userId = req.user._id;

  try {
    const update = await Update.findById(updateId);

    if (!update) {
      throw new ApiError(404, "Update not found");
    }

    if (!update.createdBy.equals(userId)) {
      throw new ApiError(403, "You are not authorized to delete this content");
    }

    await Update.findByIdAndDelete(updateId);

    return res.json(new ApiResponse(200, {}, "Update deleted successfully"));
  } catch (error) {
    next(error);
  }
});
const createEntityUpdate = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id;
  const user = await User.findById(userId);
  const userEmail = user.email;
  let { entityId, entityType } = req.params;

  // Use getCorrectEntityType to handle special cases
  const correctEntityType = getCorrectEntityType(entityType);

  try {
    const { content, mentions: mentionString } = req.body;
    const files = req.files || [];

    if (!mongoose.Types.ObjectId.isValid(entityId)) {
      return next(new ApiError(400, "Invalid entityId format"));
    }

    const mentions = mentionString
      ? mentionString.split(",").map((id) => id.trim())
      : [];

    const update = new Update({
      content,
      createdBy: userId,
      files: [],
      mentions,
      itemType: correctEntityType,
      itemId:entityId,
    });

    await update.save();

    const uploadedFiles = [];

    for (let file of files) {
      console.log(file);
      // const cloudinaryResponse = await uploadOnCloudinary(file.path);

      // if (cloudinaryResponse) {
      //   const newFile = new File({
      //     uploadedBy: userId,
      //     // fileUrl: cloudinaryResponse.url,
      //     fileUrl: file.filename,
      //     itemType: correctEntityType,
      //     itemId: entityId,
      //     source: "UpdateFile",
      //   });

      //   await newFile.save();
      //   // update.files.push(cloudinaryResponse.url);
      //   update.files.push(file.path);
      //   // uploadedFiles.push({ id: newFile._id, localPath: file.path, cloudinaryUrl: cloudinaryResponse.url });
      //   uploadedFiles.push({ id: newFile._id, localPath: file.path });
      // }

     
        const newFile = new File({
          uploadedBy: userId,
          // fileUrl: cloudinaryResponse.url,
          fileUrl: file.filename,
          itemType: correctEntityType,
          itemId: entityId,
          source: "UpdateFile",
        });

        await newFile.save();
        // update.files.push(cloudinaryResponse.url);
        update.files.push(file.path);
        // uploadedFiles.push({ id: newFile._id, localPath: file.path, cloudinaryUrl: cloudinaryResponse.url });
        uploadedFiles.push({ id: newFile._id, localPath: file.path });
      
    }

    await update.save();

    const EntityModel = getEntityModel(correctEntityType);
    if (!EntityModel) {
      throw new ApiError(400, `Invalid entity type: ${correctEntityType}`);
    }

    console.log("EntityModel:", EntityModel.modelName);
    const entity = await EntityModel.findById(entityId);
    console.log("Entity:", entity);

    if (!entity) {
      throw new ApiError(
        404,
        `${correctEntityType} with id ${entityId} not found`
      );
    }

    if (!entity.updates) {
      entity.updates = [];
    }
    entity.updates.push(update._id);
    await entity.save();

    if (mentions.length > 0) {
      const mentionedUsers = await User.find({ _id: { $in: mentions } });

      for (let mentionedUser of mentionedUsers) {
        const notification = new Notification({
          title: `Mentioned in ${correctEntityType} Update`,
          message: `You were mentioned in an update for ${correctEntityType} ${getEntityName(
            entity,
            correctEntityType
          )}.`,
          category: "i_was_mentioned",
          isRead: false,
          assignedTo: mentionedUser._id,
          assignedBy: userId,
          mentionedUsers: [mentionedUser._id],
          item: update._id,
          itemType: correctEntityType,
          linkUrl: `https://high-oaks-media-crm.vercel.app/${correctEntityType.toLowerCase()}s/update/${
            update._id
          }`,
        });

        await notification.save();
      }

      const entityName = getEntityName(entity, correctEntityType);
      console.log("EntityName:", entityName);
      // await sendEmailForMentions(
      //   userEmail,
      //   mentionedUsers,
      //   correctEntityType,
      //   entityName,
      //   update._id,
      //   content
      // );
    }

    // Delete local files after everything is done
    for (const file of uploadedFiles) {
      try {
        await fs.unlink(file.localPath);
        console.log(`Successfully deleted local file: ${file.localPath}`);
      } catch (unlinkError) {
        console.error(
          `Error deleting local file ${file.localPath}:`,
          unlinkError
        );
      }
    }

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { update },
          "Update created successfully with files and notifications"
        )
      );
  } catch (error) {
    console.error("Error in createEntityUpdate:", error);
    next(error);
  }
});
const getAllUpdatesForEntity = asyncHandler(async (req, res, next) => {
  try {
    const { entityId, entityType } = req.params;
    const correctEntityType = getCorrectEntityType(entityType);
    console.log("thhth");

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

    const files = await Update.find({
      itemType: correctEntityType,
      itemId: entityId,
    }).sort({ createdAt: -1 }).populate({
      path: "mentions",
      select: "name email",
    }).populate({
      path: "likes",
      select: "name email",
    }).populate({
      path: "replies",
     populate: {
      path: "mentions",
      select: "name email",
     }
    }) ;
    console.log(files);
   
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
          `Update retrieved for ${correctEntityType}`
        )
      );
  } catch (error) {
    console.error("Error in getAllFilesForEntity:", error);
    next(error);
  }
});

export {
  getUpdateById,
  updateUpdate,
  deleteUpdate,
  toggleLike,
  createEntityUpdate,
  getAllUpdatesForEntity,
  replyToUpdate
};
















//   const createEntityUpdate = asyncHandler(async (req, res, next) => {
//     const userId = req.user?._id;
//     const user = await User.findById(userId);
//     const userEmail = user.email;
//     const { entityId, entityType } = req.params;

//     try {
//       const { content, mentions: mentionString } = req.body;
//       const files = req.files || [];

//       if (!mongoose.Types.ObjectId.isValid(entityId)) {
//         return next(new ApiError(400, "Invalid entityId format"));
//       }

//       const mentions = mentionString ? mentionString.split(",").map(id => id.trim()) : [];

//       const update = new Update({
//         content,
//         createdBy: userId,
//         files: [],
//         mentions,
//         entityType,
//         entityId,
//       });

//       await update.save();

//       for (let file of files) {
//         console.log(file);
//         const newFile = new File({
//           uploadedBy: userId,
//           fileUrl: file.filename,
//           itemType: entityType,
//           itemId: entityId,
//           source: "UpdateFile",
//         });

//         await newFile.save();
//         update.files.push(file.filename);
//       }

//       await update.save();
//        console.log("entitymodel",getEntityModel(entityType));
//       const EntityModel = getEntityModel(entityType);
//       const entity = await EntityModel.findById(entityId);
//       console.log("customet",entity);
//       if (!entity) {
//         throw new ApiError(404, `${entityType} not found`);
//       }

//       if (!entity.updates) {
//         entity.updates = [];
//       }
//       entity.updates.push(update._id);
//       await entity.save();

//       if (mentions.length > 0) {
//         const mentionedUsers = await User.find({ _id: { $in: mentions } });

//         for (let mentionedUser of mentionedUsers) {
//           const notification = new Notification({
//             title: `Mentioned in ${entityType} Update`,
//             message: `You were mentioned in an update for ${entityType} ${getEntityName(entity, entityType)}.`,
//             category: "i_was_mentioned",
//             isRead: false,
//             assignedTo: mentionedUser._id,
//             assignedBy: userId,
//             mentionedUsers: [mentionedUser._id],
//             item: update._id,
//             itemType: entityType,
//             linkUrl: `https://high-oaks-media-crm.vercel.app/${entityType.toLowerCase()}s/update/${update._id}`,
//           });

//           await notification.save();
//         }
//        const etity= getEntityName(entity, entityType)
//        console.log("etity",etity);
//         // await sendEmailForMentions(userEmail, mentionedUsers, entityType, getEntityName(entity, entityType), update._id, content);
//       }

//       return res.status(201).json(new ApiResponse(201, { update }, "Update created successfully with files and notifications"));
//     } catch (error) {
//       next(error);
//     }
//   });

//   function getEntityModel(entityType) {
//     switch (entityType) {
//       case "Customer": return Customer;
//       case "Order": return Order;
//       case "Lead": return Lead;
//       case "Amendment": return Amendment;
//       case "User": return User;
//       default: throw new Error(`Invalid entity type: ${entityType}`);
//     }
//   }

  // function getEntityName(entity, entityType) {
  //   switch (entityType) {
  //     case "Customer": return entity.companyName;
  //     case "Order": return entity._id;
  //     case "Lead": return entity.name;
  //     case "Amendment": return entity.amendmentNumber;
  //     case "User": return entity.name;
  //     default: return "Unknown";
  //   }
  // }
