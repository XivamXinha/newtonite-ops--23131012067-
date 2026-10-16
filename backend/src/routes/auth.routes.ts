import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', AuthController.login);
router.get('/demo-users', AuthController.getDemoUsers);
router.get('/me', authenticate, AuthController.getMe);

export default router;
