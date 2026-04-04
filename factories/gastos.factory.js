import { GastosController } from "../controller/gastos.controller.js";
import { GastosRepository } from "../repositories/gastos.repository.js";
import { MovementsRepository } from "../repositories/movements.repository.js";
import { EntidadesFinancierasRepository } from "../repositories/entidades-financieras.repository.js";
import { GastosService } from "../services/gastos.service.js";

export function makeGastosController() {
    const gastosRepository = new GastosRepository();
    const movementsRepository = new MovementsRepository();
    const entidadesFinancierasRepository = new EntidadesFinancierasRepository();

    const gastosService = new GastosService({
        gastosRepository,
        movementsRepository,
        entidadesFinancierasRepository
    });

    const gastosController = new GastosController(gastosService);

    return gastosController;
}
