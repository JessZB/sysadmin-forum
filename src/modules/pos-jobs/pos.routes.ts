import { Router } from 'express';
import * as posController from './pos.controller';

const router = Router();

// Ruta para obtener el listado de cajas
// URL final: http://localhost:4000/api/pos-jobs/terminals
router.get('/terminals', posController.getTerminals);
router.get('/terminals/:id/jobs', posController.getJobsByTerminalId);
router.post('/terminals/:id/execute', posController.executeJob);

export default router;