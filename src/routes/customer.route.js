import express from "express";
import { createCustomer, createCustomerUpdate, customerList, deleteCustomer, deleteUpdate, getAllUpdates, getCustomerById, replyToUpdate, toggleLike, updateCustomer, updateUpdate } from "../controllers/customers.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {  uploadFile1 } from "../helper/multererror.js";

const router = express.Router();
router.use(verifyJWT); 

router.post("/",uploadFile1, createCustomer);
router.get("/:customerId",getCustomerById);
router.delete("/:customerId",deleteCustomer);
router.get("/",customerList);
router.patch("/update/:customer_id",uploadFile1,updateCustomer);

//update routes

router.get('/updates/all/:customerId', getAllUpdates);
router.post('/:customerId/updates', createCustomerUpdate);
router.post('/updates/:updateId/reply', replyToUpdate)
router.post('/updates/:updateId/like', toggleLike)
router.patch('/:updateId',updateUpdate)
router.delete('/:updateId',deleteUpdate)
//    .patch(updateUpdate) 
//   .delete(deleteUpdate)

export default router;


