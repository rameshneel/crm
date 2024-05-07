import express from "express";
import { createCustomer, customerList, getCustomerById } from "../controllers/customers.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(verifyJWT); 

router.post("/addcustomer",createCustomer);
router.get("/customer/:customerId",getCustomerById);
router.get("/customerlist",customerList);
export default router;

