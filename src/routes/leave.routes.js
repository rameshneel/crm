import express from 'express';
import {
  addLeaveRequest,
  getLeaveRequests,
  updateLeaveRequest,
  deleteLeaveRequest,
  getLeaveRequestsById
} from '../controllers/leave.controllers.js'; 
import { verifyJWT } from '../middlewares/auth.middleware.js';


const router = express.Router();
router.use(verifyJWT);
// Route to add a new leave request
router.post('/', addLeaveRequest);

// Route to get leave requests for the authenticated user
router.get('/',  getLeaveRequests);

// Route to update a specific leave request by ID
router.put('/:leaveId', updateLeaveRequest);
router.get('/:id', getLeaveRequestsById);

// Route to soft delete a specific leave request by ID
router.delete('/:leaveId', deleteLeaveRequest);

export default router;
