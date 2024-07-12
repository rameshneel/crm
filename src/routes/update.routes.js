import express from "express";
import {
  createEntityUpdate,
  getAllUpdatesForEntity,
  getUpdateById,
  logUpdateView,
  replyToUpdate,
  toggleLike,
  updatePinnedStatus,
  deleteUpdate,
  deleteReply,
  updatedUpdate
} from "../controllers/updates.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { fileUploadforupdate } from "../helper/multererror.js";

const router = express.Router();
router.use(verifyJWT);

router.post("/:entityType/:entityId", fileUploadforupdate, createEntityUpdate);
router.get("/:updateId", getUpdateById);
router.get("/:entityType/:entityId", getAllUpdatesForEntity);
router.post("/toggle/:updateId/like", toggleLike);
router.post("/update/reply/:updateId", replyToUpdate);
router.patch("/:updateId/pin", updatePinnedStatus);
router.patch("/log/:updateId/view", logUpdateView);
router.delete("/:id",deleteUpdate)
router.delete('/replies/:replyId',  deleteReply);
router.patch('/:id', fileUploadforupdate, updatedUpdate);
export default router;
