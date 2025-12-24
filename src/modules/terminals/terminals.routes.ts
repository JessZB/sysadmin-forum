import { Router } from 'express';
import * as controller from './terminals.controller';

const router = Router();

router.get('/', controller.renderList);      // Vista
router.get('/data', controller.getListJson); // Data JSON
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

export default router;