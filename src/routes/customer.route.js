import express from "express";
import {
  createCustomer,
  createCustomerUpdate,
  customerList,
  deleteCustomer,
  deleteUpdate,
  getAllCustomerUpdates,
  getCustomerById,
  getUpdateById,
  getallFilesforCustomers,
  replyToUpdate,
  toggleLike,
  updateCustomer,
  updateUpdate,
  uploadFilesToGalleryforCustomers,
} from "../controllers/customers.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { fileUpload, fileUploadGallery, uploadFile1 } from "../helper/multererror.js";


const router = express.Router();
router.use(verifyJWT);

router.post("/", uploadFile1, createCustomer);
router.get("/:customerId", getCustomerById);
router.delete("/:customerId", deleteCustomer);
router.get("/", customerList);
router.patch("/update/:customer_id", uploadFile1, updateCustomer);

//update routes

router.get("/updates/all/:customerId", getAllCustomerUpdates);
router.get("/updates/:updateId", getUpdateById);
router.post("/:customerId/updates", fileUpload, createCustomerUpdate);
router.post("/updates/:updateId/reply", replyToUpdate);
router.post("/updates/:updateId/like", toggleLike);
router.patch("/:updateId", updateUpdate);
router.delete("/:updateId", deleteUpdate);

//for file
router.get("/file/:customerId", getallFilesforCustomers);
router.post("/file/:customerId",fileUploadGallery, uploadFilesToGalleryforCustomers);


export default router;
