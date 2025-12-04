import { DashboardController } from "../controller/dashboard.controller";
import { DashboardRepository } from "../repositories/dashboard.repository";
import { EntidadesFinancierasRepository } from "../repositories/entidades-financieras.repository";
import { GastosRepository } from "../repositories/gastos.repository";
import { LogsRepository } from "../repositories/logs.repository";
import { DashboardService } from "../services/dashboard.service";

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