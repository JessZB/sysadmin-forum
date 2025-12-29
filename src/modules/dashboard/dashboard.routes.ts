import { Router } from 'express';
import * as controller from './dashboard.controller';

const router = Router();

router.get('/', controller.renderDashboard); // View
router.get('/api/terminals', controller.getTerminalsList); // JSON Sidebar
router.get('/api/terminals/:id/jobs', controller.getJobs); // JSON Table
router.post('/api/terminals/:id/execute', controller.runJob); // Action
router.post('/api/terminals/:id/stop', controller.stopJob); // Action
router.get('/api/terminals/:id/history', controller.getHistory); // JSON History
export default router;