import { DashboardController } from "../controller/dashboard.controller.js";
import { DashboardRepository } from "../repositories/dashboard.repository.js";
import { EntidadesFinancierasRepository } from "../repositories/entidades-financieras.repository.js";
import { GastosRepository } from "../repositories/gastos.repository.js";
import { LogsRepository } from "../repositories/logs.repository.js";
import { DashboardService } from "../services/dashboard.service.js";

export function makeFactoryController() {
    const dashboardRepository = new DashboardRepository();
    const gastosRepository = new GastosRepository();
    const entidadesFinancierasRepository = new EntidadesFinancierasRepository();
    const logsRepository = new LogsRepository();

    const dashboardService = new DashboardService({
        dashboardRepository,
        gastosRepository,
        entidadesFinancierasRepository,
        logsRepository
    });

    const dashboardController = new DashboardController(dashboardService);

    return dashboardController;
}