import { Router } from 'express';
import { WorkItemController } from '../controllers/workItem.controller';
import { authenticate } from '../middleware/auth.middleware';
import { handleIdempotency } from '../middleware/idempotency.middleware';

const router = Router();

router.use(authenticate);

// Work items listing with filters & pagination
router.get('/', WorkItemController.list);

// Single work item details & timeline
router.get('/:id', WorkItemController.getById);

// Create task or incident (with duplicate prevention via idempotency key)
router.post('/', handleIdempotency, WorkItemController.create);

// Update details with Optimistic Concurrency Control (OCC)
router.patch('/:id', WorkItemController.update);

// Atomic Claim action
router.post('/:id/claim', WorkItemController.claim);

// Workflow state transition with Lead approval
router.post('/:id/transition', WorkItemController.transitionStatus);

// Add comment
router.post('/:id/comments', WorkItemController.addComment);

// Delete work item (creator or admin only)
router.delete('/:id', WorkItemController.delete);

export default router;
