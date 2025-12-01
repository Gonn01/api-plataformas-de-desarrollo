import { Router } from 'express';
// Importamos la Clase (fíjate en las llaves)
import { GastosController } from '../controller/gastos.controller.js';

const router = Router();

// Rutas base: /gastos
// Accedemos a los métodos estáticos con el punto (.)

router.get('/:id', GastosController.getById);
router.put('/:id', GastosController.update);
router.delete('/:id', GastosController.delete);


export default router;