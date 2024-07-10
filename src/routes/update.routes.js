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
  deleteReply
} from "../controllers/updates.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { fileUploadforupdate } from "../helper/multererror.js";

const router = express.Router();
router.use(verifyJWT);

router.post("/:entityType/:entityId", fileUploadforupdate, createEntityUpdate);
router.get("/", getUpdateById);
router.get("/:entityType/:entityId", getAllUpdatesForEntity);
router.post("/:updateId/like", toggleLike);
router.post("/update/reply/:updateId", replyToUpdate);
router.patch("/:updateId/pin", updatePinnedStatus);
router.patch("/:updateId/view", logUpdateView);
router.delete("/:id",deleteUpdate)
router.delete('/replies/:replyId',  deleteReply);
export default router;
