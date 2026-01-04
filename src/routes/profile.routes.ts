import { Router } from 'express';
import { getProfile, updateProfile, deleteAccount ,changePassword } from '../controllers/profile.controller';
import { authenticate } from '../middlewares/auth.middlewares';

const router = Router();

//GET /api/v1/profile
router.get('/profile', authenticate, getProfile);

//PUT /api/v1/profileUpdate
router.put('/profileUpdate', authenticate, updateProfile);

//DELETE /api/v1/profileDelete
router.delete('/profileDelete', authenticate, deleteAccount);

router.put('/changePassword', authenticate, changePassword);

export default router;