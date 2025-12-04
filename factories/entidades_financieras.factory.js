import { EntidadesFinancierasController } from "../controller/entidades-financieras.controller";
import { EntidadesFinancierasRepository } from "../repositories/entidades-financieras.repository";
import { GastosRepository } from "../repositories/gastos.repository";
import { LogsRepository } from "../repositories/logs.repository";
import { EntidadesFinancierasService } from "../services/entidades-financieras.service";

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
