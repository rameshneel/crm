import express from "express";
import { addLead,getAllLeads } from "../controllers/lead.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/addlead",verifyJWT,addLead);
router.get("/leadlist",verifyJWT,getAllLeads);

export default router;
