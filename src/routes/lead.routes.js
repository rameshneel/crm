import express from "express";
import { addLead,getAllLeads } from "../controllers/lead.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(verifyJWT); 

router.post("/addlead",addLead);
router.get("/lead/:id",addLead);
router.get("/leadlist",getAllLeads);

export default router;
