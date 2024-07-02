import express from "express";
import {
  addOrder,
  deleteOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
} from "../controllers/order.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(verifyJWT);

router.post("/:customer_id", addOrder);
router.get("/", getAllOrders);
router.get("/:order_id", getOrderById);
router.patch("/update/:order_id", updateOrder);
router.delete("/:order_id", deleteOrder);

export default router;
