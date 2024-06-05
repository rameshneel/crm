import express from "express";
import { LeadDetails, addLead,getAllLeads, updateLead } from "../controllers/lead.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addAppointment, deleteAppointment, getAllAppointments, getAppointmentsByDate, updateAppointment } from "../controllers/appointment.controllers.js";

const router = express.Router();
router.use(verifyJWT); 
//for params
router.post("/:customer_id",addLead);
//for req.body
router.post("/", addLead);
//all route
router.get("/:lead_id",LeadDetails);
router.patch("/update/:lead_id",updateLead);
router.get("/",getAllLeads); 

//for Appointement Routes

router.post("/appointments/:lead_id", addAppointment);
router.delete("/appointments/:appointment_id", deleteAppointment);
router.patch("/appointments/update/:appointment_id", updateAppointment);
router.get("/lead/appointments/:lead_id", getAppointmentsByDate);
router.get("/",getAllAppointments);

export default router;
