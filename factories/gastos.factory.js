import { GastosController } from "../controller/gastos.controller.js";
import { GastosRepository } from "../repositories/gastos.repository.js";
import { MovementsRepository } from "../repositories/movements.repository.js";
import { GastosService } from "../services/gastos.service.js";

export function makeGastosController() {
    const gastosRepository = new GastosRepository();
    const movementsRepository = new MovementsRepository();

    const gastosService = new GastosService({
        gastosRepository,
        movementsRepository
    });

    const gastosController = new GastosController(gastosService);

    return gastosController;
}
