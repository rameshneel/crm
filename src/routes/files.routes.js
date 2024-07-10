import express from "express";
import {
  uploadFilesToGallery,
  getAllFilesForEntity,
  getFileById,
  deleteFileById,
} from "../controllers/files.controllers.js";
import { fileUploadforupdate } from "../helper/multererror.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(verifyJWT);

router.post("/:entityType/:entityId/gallery", fileUploadforupdate, uploadFilesToGallery);
router.get("/:entityType/:entityId", getAllFilesForEntity);
router.get('/:fileId', getFileById);
router.delete('/:fileId', deleteFileById);


export default router;
