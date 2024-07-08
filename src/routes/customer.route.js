import express from "express";
import {
  createCustomer,
  customerList,
  deleteCustomer,
  getCustomerById,
  updateCustomer,
} from "../controllers/customers.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { uploadLogoForCustomers } from "../helper/multererror.js";
const router = express.Router();
router.use(verifyJWT);

router.post("/", uploadLogoForCustomers, createCustomer);
router.get("/:customerId", getCustomerById);
router.delete("/:customerId", deleteCustomer);
router.get("/", customerList);
router.patch("/update/:customer_id", uploadLogoForCustomers, updateCustomer);


export default router;
