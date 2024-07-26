import express from "express";
import {
  createProductFlow,
  getProductFlows,
  getProductFlowById,
  updateProductFlow,
  deleteProductFlow,
} from "../controllers/productFlow.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = express.Router();
router.use(verifyJWT);
router.post("/:", createProductFlow);
router.get("/", getProductFlows);
router.get("/:id", getProductFlowById);
router.patch("/:id", updateProductFlow);
router.delete("/:id", deleteProductFlow);

export default router;
