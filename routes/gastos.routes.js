import { Router } from 'express';
import { GastosController } from '../controller/gastos.controller.js';
import { GastosRepository } from '../repositories/gastos.repository.js';
import { GastosService } from '../services/gastos.service.js';

const router = Router();

const gastosRepository = new GastosRepository();
const gastosService = new GastosService(gastosRepository);
const gastosController = new GastosController(gastosService);

router.get('/:id', gastosController.getById);
router.put('/:id', gastosController.update);
router.delete('/:id', gastosController.delete);

export default router;
