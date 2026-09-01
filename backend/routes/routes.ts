import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  getRouteRisk,
  explainRoute,
  reoptimizeRoute
} from '../controllers/routesController';

const router = Router();

// Allow route creation without auth blocks during intake confirmation
router.post('/', createRoute);

// All routes below this line will enforce authentication
router.use(requireAuth);

router.get('/', getRoutes);
router.get('/:id', getRouteById);
router.patch('/:id', updateRoute);
router.get('/:id/risk', getRouteRisk);
router.post('/:id/explain', explainRoute);
router.post('/:id/reoptimize', reoptimizeRoute);


export default router;