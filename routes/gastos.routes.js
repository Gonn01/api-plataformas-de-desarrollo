import { Router } from 'express';
import { makeGastosController } from '../factories/gastos.factory.js';

const router = Router();

const gastosController = makeGastosController();

router.get('/:id', gastosController.getById);
router.put('/:id', gastosController.update);
router.delete('/:id', gastosController.delete);

export default router;
