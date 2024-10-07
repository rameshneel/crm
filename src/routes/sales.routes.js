import express from "express";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getOrderStatsByCreator,
  getSalesmanCurrentYearStats,
  getSalesmanMonthlyStats,
  getSalesmanOrderStats,
} from "../controllers/sales.controllers.js";

const router = express.Router();
router.use(verifyJWT);
router.get("/", verifyJWT, getSalesmanOrderStats);
router.get("/year", verifyJWT, getSalesmanCurrentYearStats);
router.get("/month", verifyJWT, getSalesmanMonthlyStats);
router.get("/status", verifyJWT, getOrderStatsByCreator);

export default router;
