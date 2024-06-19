import express from 'express';
import { addOrder, createOrderUpdate, deleteOrder, getAllOrderUpdates, getAllOrders, getOrderById, updateOrder } from '../controllers/order.controllers.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';


const router = express.Router();
router.use(verifyJWT); 

router.post('/add/:customer_id',addOrder);
router.get('/', getAllOrders);
router.get("/:order_id",getOrderById)
router.patch('/update/:order_id', updateOrder)
router.delete('/:order_id',deleteOrder);


//update routes

router.get('/updates/all/:orderId', getAllOrderUpdates);
router.post('/:orderId/updates', createOrderUpdate);
// router.post('/updates/:updateId/reply', replyToUpdate)
// router.post('/updates/:updateId/like', toggleLike)
// router.patch('/:updateId',updateUpdate)
// router.delete('/:updateId',deleteUpdate)
//    .patch(updateUpdate) 
//   .delete(deleteUpdate)

export default router;
