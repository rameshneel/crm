import express from "express";
import {
  createNewWebsiteContent,
  deleteWebsiteContent,
  getAllNewWebsiteContent,
  getNewWebsiteContentById,
  updateNewWebsiteContent,
} from "../controllers/newWebsiteContent.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(verifyJWT);
router.route("/:customerId").post(createNewWebsiteContent)
router.route("/").get(getAllNewWebsiteContent);
router
  .route("/:id")
  .get(getNewWebsiteContentById)
  .patch(updateNewWebsiteContent)
  .delete(deleteWebsiteContent);

export default router;
