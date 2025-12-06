import { Router } from 'express';
import { makeGastosController } from '../factories/gastos.factory.js';

const router = Router();

const controller = makeGastosController();

router.post("/", controller.crear);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);
router.post("/:id/pagar-cuota", controller.pagarCuota);
router.post("/pagar-lote", controller.pagarCuotasLote);

export default router;
