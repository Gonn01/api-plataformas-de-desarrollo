import express from "express";
import { DashboardController } from "../controller/dashboard.controller.js";
import { DashboardRepository } from "../repositories/dashboard.repository.js";
import { GastosRepository } from "../repositories/gastos.repository.js";
import { EntidadesFinancierasRepository } from "../repositories/entidades-financieras.repository.js";
import { DashboardService } from "../services/dashboard.service.js";
import { LogsRepository } from "../repositories/logs.repository.js";

const router = express.Router();

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

router.get("/home", dashboardController.home);
router.post("/gastos", dashboardController.crearGasto);
router.post("/pagar-cuota", dashboardController.pagarCuota);
router.post("/pagar-cuotas-lote", dashboardController.pagarCuotasLote);

export default router;