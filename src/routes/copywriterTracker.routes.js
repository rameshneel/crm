import express from "express";
import {
  getCopywriterTrackers,
  createCopywriterTracker,
  updateCopywriterTracker,
  deleteCopywriterTracker,
  getCopywriterTrackerById,
} from "../controllers/copywriterTracker.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(verifyJWT);
// Get all copywriter trackers with pagination
router.get("/", getCopywriterTrackers);

// Get a single copywriter tracker by ID
router.get("/:trackerId", getCopywriterTrackerById);

// Create a new copywriter tracker
router.post("/:customerId", createCopywriterTracker);

// Update an existing copywriter tracker
router.patch("/:trackerId", updateCopywriterTracker);

// Delete a copywriter tracker
router.delete("/:trackerId", deleteCopywriterTracker);

export default router;
