import { Router } from 'express';
import { 
    getGastoById, 
    updateGasto, 
    deleteGasto, 
    pagarCuotaGasto 
} from '../controller/gastos.controller.js';

const router = Router();

// Rutas base: /gastos

router.get('/:id', getGastoById);             // Ver uno
router.put('/:id', updateGasto);              // Editar
router.delete('/:id', deleteGasto);           // Borrar
router.post('/:id/pagar-cuota', pagarCuotaGasto); // Pagar una cuota

// Falta la de pagar-cuotas (lote) para un gasto especifico, 
// pero suele ser igual a pagar-cuota o recibir un numero. 
// Por ahora con la anterior cubres la funcionalidad.

export default router;