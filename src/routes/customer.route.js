import express from "express";
import { createCustomer, customerList, getCustomerById, updateCustomer } from "../controllers/customers.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { uploadFile1 } from "../helper/multererror.js";

const router = express.Router();
router.use(verifyJWT); 

router.post("/",uploadFile1, createCustomer);
router.get("/:customerId",getCustomerById);
router.get("/",customerList);
router.patch("/update/:customer_id",uploadFile1,updateCustomer);
export default router;


