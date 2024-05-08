import express from "express";
import { LeadDetails, addLead,getAllLeads } from "../controllers/lead.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(verifyJWT); 

router.post("/addlead/:customer_id",addLead);
router.get("/leadlist/:lead_id",LeadDetails);

export default router;
