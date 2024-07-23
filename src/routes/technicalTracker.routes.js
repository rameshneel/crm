import express from 'express';
import {
  createTechnicalTracker,
  deleteTechnicalTracker,
  getAllTechnicalTrackers,
  getTechnicalTrackerById,
  updateTechnicalTracker,
} from '../controllers/technicalTracker.controllers.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';


const router = express.Router();
router.use(verifyJWT); 

router.post('/:customerId',createTechnicalTracker);
router.patch('/:id',updateTechnicalTracker);
router.delete('/:id', deleteTechnicalTracker);
router.get('/:id', getTechnicalTrackerById);
router.get('/', getAllTechnicalTrackers);
// router.put('/:id', updateTechnicalTracker);

// Admin-only route example
export default router;



















// import express from 'express';
// import { authenticate } from '../middlewares/authMiddleware.js';
// import { authorize } from '../middlewares/authorizationMiddleware.js';
// import {
//   createTechnicalTracker,
//   updateTechnicalTracker,
//   deleteTechnicalTracker,
//   getTechnicalTrackerById,
//   getAllTechnicalTrackers
// } from '../controllers/technicalTrackerController.js';

// const router = express.Router();

// // Apply authentication middleware to all routes
// router.use(authenticate);

// // Routes accessible by both admin and salesman
// router.post('/', authorize('admin', 'salesman'), createTechnicalTracker);
// router.put('/:id', authorize('admin', 'salesman'), updateTechnicalTracker);
// router.get('/:id', authorize('admin', 'salesman'), getTechnicalTrackerById);
// router.get('/', authorize('admin', 'salesman'), getAllTechnicalTrackers);

// // Admin-only routes
// router.delete('/:id', authorize('admin'), deleteTechnicalTracker);
// router.get('/admin/all', authorize('admin'), getAllTechnicalTrackers);

// export default router;