import express from "express";
import { createCustomer, customerList } from "../controllers/customers.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/addcustomer",verifyJWT,createCustomer);
router.get("/customerlist",verifyJWT,customerList);

export default router;
