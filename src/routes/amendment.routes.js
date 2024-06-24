import express from "express";
import {
  addAmendment,
  deleteAmendment,
  getAllAmendment,
  getAmendmentById,
  getAmendmentsByStatus,
  updateAmendment
} from "../controllers/Amendment.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(verifyJWT); 

// router.route("/:customerId").post(addAmendment)
// router.route("/").get(getAllAmendment);
// router.route("/:amendmentId").get(getAmendmentById);
// router.route("/:amendmentId").patch(updateAmendment);
// router.get('/', getAmendmentsByStatus);

router.route('/:amendmentId')
  .get(getAmendmentById)
  .patch(updateAmendment)
  .delete(deleteAmendment)

  router.route('/:customerId')
  .post(addAmendment);

  router.route('/status')
  // .get(getAllAmendment)
  .get(getAmendmentsByStatus);

  router.route('/')
  .get(getAllAmendment)
  // .get(getAmendmentsByStatus);

export default router;
