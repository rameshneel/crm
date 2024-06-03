import express from 'express';
import { addOrder, deleteOrder, getAllOrders, getOrderById, updateOrder } from '../controllers/order.controllers.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { uploadFile2 } from '../helper/multererror.js';

const router = express.Router();
router.use(verifyJWT); 

router.post('/add/:customer_id',uploadFile2, addOrder);
router.get('/', getAllOrders);
router.get("/:order_id",getOrderById)
router.patch('/update/:order_id',updateOrder)
router.delete('/delete/:order_id',deleteOrder);

export default router;
