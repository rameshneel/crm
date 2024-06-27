import express from 'express';
import { addOrder, createOrderUpdate, deleteOrder, deleteUpdateforOrder, getAllOrderUpdates, getAllOrders, getOrderById, replyToUpdateforOrder, toggleLikeforOrder, updateOrder, updateUpdateforOrder } from '../controllers/order.controllers.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { replyToUpdate } from '../controllers/updates.controllers.js';


const router = express.Router();
router.use(verifyJWT); 

router.post('/:customer_id',addOrder);
router.get('/', getAllOrders);
router.get("/:order_id",getOrderById)
router.patch('/update/:order_id', updateOrder)
router.delete('/:order_id',deleteOrder);


//update routes

router.get('/updates/all/:orderId', getAllOrderUpdates);
router.post('/:orderId/updates', createOrderUpdate);
router.post('/:updateId/reply', replyToUpdate)
router.post('/updates/:updateId/like', toggleLikeforOrder)
router.patch('/:updateId',updateUpdateforOrder)
router.delete('/:updateId',deleteUpdateforOrder)

export default router;
