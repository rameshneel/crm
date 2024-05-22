import express from "express";
import {
  addAmendment,
  getAllAmendment,
  getAmendmentById,
  updateAmendment
} from "../controllers/Amendment.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(verifyJWT); 

router.route("/:customerId").post(addAmendment)
router.route("/").get(getAllAmendment);
router.route("/:amendmentId").get(getAmendmentById);
router.route("/:amendmentId").patch(updateAmendment);

export default router;
