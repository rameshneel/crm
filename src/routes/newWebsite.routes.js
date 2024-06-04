import express from "express";
import {
  createNewCustomer,
  getAllCustomers,
  getCustomerById,
} from "../controllers/newWebsite.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(verifyJWT);

router.route("/").post(createNewCustomer).get(getAllCustomers);

router.route("/:id").get(getCustomerById);

export default router;
