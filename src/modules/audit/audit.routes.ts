import { Router } from 'express';
import * as controller from './audit.controller';
import { allowRoles } from '../../shared/middlewares/role.middleware';

const router = Router();

// Solo Admins y Analistas (cada uno verá lo suyo por la lógica del controller)
router.get('/', allowRoles(['admin', 'analista']), controller.renderTimeline);

export default router;