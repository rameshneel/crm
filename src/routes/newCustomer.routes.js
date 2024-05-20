import express from "express";
import {
  createNewCustomer,
  getAllCustomers,
  getCustomerById,
} from "../controllers/newCustomerController.js";

const router = express.Router();

router.route("/").post(createNewCustomer).get(getAllCustomers);

router.route("/:id").get(getCustomerById);

export default router;
