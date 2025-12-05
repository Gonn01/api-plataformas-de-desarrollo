import { EntidadesFinancierasController } from "../controller/entidades-financieras.controller.js";
import { EntidadesFinancierasRepository } from "../repositories/entidades-financieras.repository.js";
import { GastosRepository } from "../repositories/gastos.repository.js";
import { LogsRepository } from "../repositories/logs.repository.js";
import { EntidadesFinancierasService } from "../services/entidades-financieras.service.js";

export function makeEntidadesFinancierasController() {
    const gastosRepository = new GastosRepository();
    const entidadesFinancierasRepository = new EntidadesFinancierasRepository();
    const logsRepository = new LogsRepository();

    const entidadesFinancierasService = new EntidadesFinancierasService({
        entidadesFinancierasRepository,
        gastosRepository,
        logsRepository
    });

    const entidadesFinancierasController = new EntidadesFinancierasController(entidadesFinancierasService);

    return entidadesFinancierasController;
}
