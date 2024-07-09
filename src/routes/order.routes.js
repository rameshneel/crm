import express from "express";
import {
  addOrder,
  createInvoicePDF,
  deleteOrder,
  getAllOrders,
  getOrderById,
  sendInvoiceForEmail,
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
router.post('/:orderId/invoice', createInvoicePDF);
router.post("/send-invoice/:orderId",sendInvoiceForEmail)


export default router;




