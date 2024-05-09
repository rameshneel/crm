import express from "express";
import { createCustomer, customerList, getCustomerById, updateCustomer } from "../controllers/customers.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(verifyJWT); 

router.post("/",createCustomer);
router.get("/:customerId",getCustomerById);
router.get("/",customerList);
router.patch("/update/:customer_id",updateCustomer);
export default router;


