import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(requireRole([Role.ADMIN]));

router.get('/teams', AdminController.getTeams);
router.post('/teams', AdminController.createTeam);
router.delete('/teams/:id', AdminController.deleteTeam);

router.get('/users', AdminController.getUsers);
router.patch('/users/:id', AdminController.updateUser);

router.get('/work-views/:category', AdminController.getWorkView);

export default router;
