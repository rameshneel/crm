import express from "express";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getMonthStatus,
  getNewBusinessTotalSales,
  getOrderStatsByCreator,
  getRenewalTotalSales,
  getSalesmanCurrentYearStats,
  getSalesmanMonthlyStats,
  getSalesmanOrderStats,
  getSalesMonthlyStatus,
  getThisMonthTotalSales,
} from "../controllers/sales.controllers.js";

const router = express.Router();
router.use(verifyJWT);
router.get("/",getSalesmanOrderStats);
// router.get("/year", verifyJWT, getSalesmanCurrentYearStats);
// router.get("/month", verifyJWT, getSalesmanMonthlyStats);
// router.get("/status", verifyJWT, getOrderStatsByCreator);
// router.get('/this-month-total-sales', getThisMonthTotalSales);
// router.get('/new-business-total-sales', getNewBusinessTotalSales);
// router.get('/renewal-total-sales', getSalesMonthlyStatus);
router.get('/monthly-status', getMonthStatus)
export default router;
