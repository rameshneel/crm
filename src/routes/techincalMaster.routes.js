import express from 'express';
import {
  createTechnicalMaster,
  getTechnicalMasterById,
  updateTechnicalMaster,
  deleteTechnicalMaster,
  getAllTechnicalMasters,
} from '../controllers/techincalMaster.controllers.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';


const router = express.Router();
router.use(verifyJWT); 

router.post('/add/:customer_id' , createTechnicalMaster);
router.get('/:id' , getTechnicalMasterById);
router.patch('/:id' , updateTechnicalMaster);
router.delete('/:id', deleteTechnicalMaster);
router.get('/', getAllTechnicalMasters);

export default router;
