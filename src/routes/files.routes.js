import express from "express";
import {
  uploadFilesToGallery,
  getAllFilesForEntity,
  getFileById,
  deleteFileById,
} from "../controllers/files.controllers.js";
import { fileUpload } from "../helper/multererror.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(verifyJWT);

router.post("/:entityType/:entityId/gallery", fileUpload, uploadFilesToGallery);
router.get("/:entityType/:entityId", getAllFilesForEntity);
router.get('/:fileId', getFileById);
router.delete('/:fileId', deleteFileById);


export default router;
