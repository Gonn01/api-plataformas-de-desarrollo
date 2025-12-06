import { DashboardController } from "../controller/dashboard.controller.js";
import { DashboardRepository } from "../repositories/dashboard.repository.js";
import { DashboardService } from "../services/dashboard.service.js";

export function makeDashboardController() {
    const dashboardRepository = new DashboardRepository();

    const dashboardService = new DashboardService({
        dashboardRepository,
    });

    const dashboardController = new DashboardController(dashboardService);

    return dashboardController;
}