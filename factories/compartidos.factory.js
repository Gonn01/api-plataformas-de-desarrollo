import { CompartidosController } from "../controller/compartidos.controller.js";
import { CompartidosService } from "../services/compartidos.service.js";
import { GastosRepository } from "../repositories/gastos.repository.js";
import { EntidadesFinancierasRepository } from "../repositories/entidades-financieras.repository.js";
import { MovementsRepository } from "../repositories/movements.repository.js";

export function makeCompartidosController() {
    const gastosRepository = new GastosRepository();
    const entidadesFinancierasRepository = new EntidadesFinancierasRepository();
    const movementsRepository = new MovementsRepository();

    const compartidosService = new CompartidosService({
        gastosRepository,
        entidadesFinancierasRepository,
        movementsRepository,
    });

    return new CompartidosController(compartidosService);
}
