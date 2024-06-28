import express from "express";
import {
  createEntityUpdate,
  getAllUpdatesForEntity,
  getUpdateById,
  logUpdateView,
  replyToUpdate,
  toggleLike,
  updatePinnedStatus,
} from "../controllers/updates.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { fileUpload } from "../helper/multererror.js";

const router = express.Router();
router.use(verifyJWT);

router.post("/:entityType/:entityId", fileUpload, createEntityUpdate);
router.get("/", getUpdateById);
router.get("/:entityType/:entityId", getAllUpdatesForEntity);
router.post("/:updateId/like", toggleLike);
router.post("/update/reply/:updateId", replyToUpdate);
router.patch("/:updateId/pin", updatePinnedStatus);
router.patch("/:updateId/view", logUpdateView);
export default router;
