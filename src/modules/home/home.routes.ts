import { Router } from 'express';
import * as controller from './home.controller';

const router = Router();

router.get('/', controller.renderHome);

export default router;
