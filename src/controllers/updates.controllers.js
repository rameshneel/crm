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
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


function getCorrectEntityType(entityType) {
  console.log("entity function", entityType);
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
    update:"Update"
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
    Update,
    // NewWebsite,
    // TechnicalMaster,
    // CopywriterTracker,
    // TechnicalTracker
  };
  return models[entityType];
}
function getEntityName(entity, entityType) {
  switch (entityType) {
    case "Customer":
      return entity.companyName;
    case "Order":
      return entity.orderNo;
    case "Lead":
      return entity.name;
      case "Update":
      return entity.name;
    case "Amendment":
      return entity.amendmentNumber;
    case "User":
      return entity.name;
    default:
      return "Unknown";
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
  const { content, mentions } = req.body;

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
const createEntityUpdat = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id;
  const user = await User.findById(userId);
  let { entityId, entityType } = req.params;

  // Use getCorrectEntityType to handle special cases
  const correctEntityType = getCorrectEntityType(entityType);

  try {
    const { content, mentions: mentionString } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(entityId)) {
      return next(new ApiError(400, "Invalid entityId format"));
    }
    let fileUrl;
    if (req.file && req.file.path) {
      fileUrl = `${req.protocol}://${req.get('host')}/files/${req.file.filename}`;
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
      itemId: entityId,
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
      await sendEmailForMentions(
        userEmail,
        mentionedUsers,
        correctEntityType,
        entityName,
        update._id,
        content
      );
    }

    // // Delete local files after everything is done
    // for (const file of uploadedFiles) {
    //   try {
    //     await fs.unlink(file.localPath);
    //     console.log(`Successfully deleted local file: ${file.localPath}`);
    //   } catch (unlinkError) {
    //     console.error(
    //       `Error deleting local file ${file.localPath}:`,
    //       unlinkError
    //     );
    //   }
    // }

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
const updatePinnedStatus = asyncHandler(async (req, res, next) => {
  try {
    const { updateId } = req.params;
    const { isPinned } = req.body;

    if (!mongoose.Types.ObjectId.isValid(updateId)) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid update ID"));
    }

    const update = await Update.findById(updateId);

    if (!update) {
      return res.status(404).json(new ApiResponse(404, {}, "Update not found"));
    }
    const correctEntityType = getCorrectEntityType(update.itemType);
    const EntityModel = getEntityModel(correctEntityType);
    if (!EntityModel) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, {}, `Invalid entity type: ${correctEntityType}`)
        );
    }
    const entity = await EntityModel.findById(update.itemId);
    if (!entity) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, `${correctEntityType} not found`));
    }

    update.isPinned = isPinned;
    await update.save();

    // If pinning, ensure this update is at the top of the entity's updates array
    if (isPinned) {
      entity.updates = entity.updates.filter((id) => !id.equals(update._id));
      entity.updates.unshift(update._id);
    } else {
      // If unpinning, move it to its original position (we'll put it at the end for simplicity)
      entity.updates = entity.updates.filter((id) => !id.equals(update._id));
      entity.updates.push(update._id);
    }

    await entity.save();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { update },
          `Update ${isPinned ? "pinned" : "unpinned"} successfully`
        )
      );
  } catch (error) {
    console.error("Error in updatePinnedStatus:", error);
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

    const updates = await Update.find({
      itemType: correctEntityType,
      itemId: entityId,
    })
      .sort({ isPinned: -1, createdAt: -1 })
      .populate({
        path: "mentions",
        model: "User",
        select: "fullName email avatar",
      }).populate({
        path: "createdBy",
        model: "User",
        select: "fullName email avatar",
      })
      .populate({
        path: "likes",
        model: "User",
        select: "name email",
      })
      .populate({
        path: "replies",
        model: "Update",
        populate: [
          {
            path: "mentions",
            model: "User",
            select: "fullname avatar",
          },
          {
            path: "createdBy",
            model: "User",
            select: "fullName avatar",
          },
          {
            path: "replies",
            model: "Update",
          },
          {
            path: "likes",
            model: "User",
            select: "fullname avatar",
          },
        ],
      });

    console.log(updates);
    const formattedUpdates = updates.map((update) => ({
      ...update.toObject(),
      isPinned: update.isPinned || false,
    }));

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { updates: formattedUpdates },
          `Updates retrieved for ${correctEntityType}`
        )
      );
  } catch (error) {
    console.error("Error in getAllUpdatesForEntity:", error);
    next(error);
  }
});
const logUpdateView = asyncHandler(async (req, res, next) => {
  try {
    const { updateId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(updateId)) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Invalid update ID"));
    }

    const update = await Update.findById(updateId);
    if (!update) {
      return res.status(404).json(new ApiResponse(404, {}, "Update not found"));
    }

    const existingViewIndex = update.views.findIndex(
      (view) => view.user.toString() === userId.toString()
    );

    if (existingViewIndex !== -1) {
      update.views[existingViewIndex].viewedAt = new Date();
    } else {
      update.views.push({
        user: userId,
        viewedAt: new Date(),
      });
    }

    await update.save();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { viewCount: update.views.length },
          "Update view logged successfully"
        )
      );
  } catch (error) {
    console.error("Error in logUpdateView:", error);
    next(error);
  }
});
//delete from files and update
 const deleteUpdate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const update = await Update.findById(id);

  if (!update) {
    throw new ApiError(404, "Update not found");
  }

  if (update.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json(new ApiResponse(403, null, "You don't have permission to delete this update"));
  }

  const itemType = await getEntityModel(update.itemType);
  console.log("item type", itemType);

  if (!itemType) {
    return res.status(400).json(new ApiResponse(400, null, "Invalid item type"));
  }

  // Remove the update reference from the associated item
  await itemType.findByIdAndUpdate(
    update.itemId,
    { $pull: { updates: id } },
    { new: true }
  );

  // Delete associated files and File documents
  if (update.files && update.files.length > 0) {
    for (const fileUrl of update.files) {
      try {
        // Delete File document
        const file = await File.findOneAndDelete({ fileUrl: fileUrl });
        if (file) {
          console.log(`File document deleted: ${file._id}`);
        }

        // Delete physical file
        const fileName = path.basename(fileUrl);
        const filePath = path.join(__dirname, '..','..', 'public', 'files', fileName);
        await fs.unlink(filePath);
        console.log(`Physical file deleted: ${filePath}`);
      } catch (error) {
        console.error(`Error deleting file: ${fileUrl}`, error);
      }
    }
  }

  // Delete the update
  await Update.findByIdAndDelete(id);

  res.status(200).json(new ApiResponse(200, null, "Update, associated files, and file records deleted successfully"));
});

//delte for server
const deleteUpd = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const update = await Update.findById(id);

  if (!update) {
    throw new ApiError(404, "Update not found");
  }

  if (update.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json(new ApiResponse(403, null, "You don't have permission to delete this update"));
  }

  const itemType = await getEntityModel(update.itemType);
  console.log("item type", itemType);

  if (!itemType) {
    return res.status(400).json(new ApiResponse(400, null, "Invalid item type"));
  }

  // Remove the update reference from the associated item
  await itemType.findByIdAndUpdate(
    update.itemId,
    { $pull: { updates: id } },
    { new: true }
  );

  // Delete associated files from the server
  if (update.files && update.files.length > 0) {
    for (const fileUrl of update.files) {
      try {
        const fileName = path.basename(fileUrl);
        const filePath = path.join(__dirname, '..','..', 'public', 'files', fileName);
        await fs.unlink(filePath);
        console.log(`File deleted: ${filePath}`);
      } catch (error) {
        console.error(`Error deleting file: ${fileUrl}`, error);
      }
    }
  }

  // Delete the update
  await Update.findByIdAndDelete(id);

  res.status(200).json(new ApiResponse(200, null, "Update and associated files deleted successfully"));
});

//form only delete
 const deleteUpdate1 = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const update = await Update.findById(id);

  if (!update) {
    throw new ApiError(404, "Update not found");
  }

  if (update.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json(new ApiResponse(403, null, "You don't have permission to delete this update"));
  }

  const itemType = await getEntityModel(update.itemType);
  console.log("item type", itemType);

  if (!itemType) {
    return res.status(400).json(new ApiResponse(400, null, "Invalid item type"));
  }

  // Remove the update reference from the associated item
  await itemType.findByIdAndUpdate(
    update.itemId,
    { $pull: { updates: id } },
    { new: true }
  );

  // Delete associated files from the server
  if (update.files && update.files.length > 0) {
    for (const fileUrl of update.files) {
      try {
        const fileName = path.basename(fileUrl);
        const filePath = path.join(__dirname, '..','..', 'public', 'files', fileName);
        await fs.unlink(filePath);
        console.log(`File deleted: ${filePath}`);
      } catch (error) {
        console.error(`Error deleting file: ${fileUrl}`, error);
        throw error
      }
    }
  }

  // Delete the update
  await Update.findByIdAndDelete(id);

  res.status(200).json(new ApiResponse(200, null, "Update and associated files deleted successfully"));
});

//reply for all entiety

const replyToUpdate = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id;
  const { updateId } = req.params;
  try {
    const { content, files, mentions } = req.body;
    
    const originalUpdate = await Update.findById(updateId);
    if (!originalUpdate) {
      throw new ApiError(404, "Original update not found");
    }

    const reply = new Update({
      content,
      createdBy: userId,
      files: files || [],
      mentions: mentions || [],
      // replies: [],
      itemType:"Reply",
      itemId: updateId
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
const deleteReply = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id;
  const { replyId } = req.params;
  try {
    const reply = await Update.findById(replyId);
    if (!reply) {
      throw new ApiError(404, "Reply not found");
    }
    if (!reply.createdBy.equals(userId) && req.user.role !== 'admin') {
      throw new ApiError(403, "You don't have permission to delete this reply");
    }
    await Update.findByIdAndUpdate(reply.itemId, {
      $pull: { replies: replyId }
    });
    await Update.findByIdAndDelete(replyId);
    return res.json(
      new ApiResponse(200, null, "Reply deleted successfully")
    );
  } catch (error) {
    next(error);
  }
});
//testing 
const createEntityUpdate = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id;
  const user = await User.findById(userId);
  let { entityId, entityType } = req.params;

  const correctEntityType = getCorrectEntityType(entityType);

  try {
    const { content, mentions: mentionString } = req.body;
    
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
      itemId: entityId,
    });

    // Handle file uploads
    console.log("file",req.files);
    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        const fileUrl = `${req.protocol}://${req.get('host')}/files/${file.filename}`;
        update.files.push(fileUrl);

        const newFile = new File({
          uploadedBy: userId,
          fileUrl: fileUrl,
          itemType: correctEntityType,
          itemId: entityId,
          source: "UpdateFile",
        });

        await newFile.save();
      }
    }

    await update.save();

    const EntityModel = getEntityModel(correctEntityType);
    if (!EntityModel) {
      throw new ApiError(400, `Invalid entity type: ${correctEntityType}`);
    }

    const entity = await EntityModel.findById(entityId);
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

    // Handle mentions and notifications
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
      await sendEmailForMentions(
        user.email,
        mentionedUsers,
        correctEntityType,
        entityName,
        update._id,
        content
      );
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
 

export {
  getUpdateById,
  updateUpdate,
  deleteUpdate,
  toggleLike,
  createEntityUpdate,
  getAllUpdatesForEntity,
  replyToUpdate,
  updatePinnedStatus,
  logUpdateView,
  deleteReply
};






