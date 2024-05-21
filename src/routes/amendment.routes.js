import express from "express";
import {
  addAmendment,
  getAllAmendment,
  getAmendmentById
} from "../controllers/Amendment.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(verifyJWT); 

router.route("/:customerId").post(addAmendment)
router.route("/").get(getAllAmendment);
router.route("/:amendmentId").get(getAmendmentById);
router.route("/:amendmentId").patch(getAmendmentById);

export default router;
