import express from "express";
import {
  addOrder,
  createInvoicePDF,
  // createOrderInvoice,
  deleteOrder,
  getAllOrders,
  getOrderById,
  // sendOrderInvoiceEmail,
  // sendVatInvoiceEmail,
  updateOrder,
  // viewAndSendInvoice,
  // viewVatInvoice,
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
// router.post('/:orderId/invoice', createOrderInvoice);
// router.post('/:orderId/send-invoice', sendOrderInvoiceEmail);
// router.post('/orders/:orderId/invoice', createOrderInvoice);
// router.get('/view-invoice/:orderId', viewAndSendInvoice);
// router.get('/vatinvoice/:orderId', viewVatInvoice);
// router.post('/vatinvoice/:orderId/send-email', sendVatInvoiceEmail);

export default router;




