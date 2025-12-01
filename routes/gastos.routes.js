import { Router } from 'express';
import { GastosController } from '../controller/gastos.controller.js';
import { GastosRepository } from '../repositories/gastos.repository.js';

const router = Router();

const gastosRepository = new GastosRepository();
const gastosController = new GastosController(gastosRepository);

router.get('/:id', gastosController.getById);
router.put('/:id', gastosController.update);
router.delete('/:id', gastosController.delete);

export default router;
