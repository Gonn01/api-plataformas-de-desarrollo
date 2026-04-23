import { EntidadesFinancierasController } from "../controller/entidades-financieras.controller.js";
import { EntidadesFinancierasRepository } from "../repositories/entidades-financieras.repository.js";
import { GastosRepository } from "../repositories/gastos.repository.js";
import { MovementsRepository } from "../repositories/movements.repository.js";
import { AuthRepository } from "../repositories/auth.repository.js";
import { EntidadesFinancierasService } from "../services/entidades-financieras.service.js";

export function makeEntidadesFinancierasController() {
    const gastosRepository = new GastosRepository();
    const entidadesFinancierasRepository = new EntidadesFinancierasRepository();
    const movementsRepository = new MovementsRepository();
    const authRepository = new AuthRepository();

    const entidadesFinancierasService = new EntidadesFinancierasService({
        entidadesFinancierasRepository,
        gastosRepository,
        movementsRepository,
        authRepository,
    });

    const entidadesFinancierasController = new EntidadesFinancierasController(entidadesFinancierasService);

    return entidadesFinancierasController;
}
