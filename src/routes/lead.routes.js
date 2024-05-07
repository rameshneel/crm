import express from "express";
import { addLead,getAllLeads } from "../controllers/lead.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(verifyJWT); 

router.post("/addlead/:customer_id",addLead);
router.get("/leadlist/:customer_id",getAllLeads);

export default router;
