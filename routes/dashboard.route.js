import express from "express";
import { DashboardController } from "../controller/dashboard.controller.js";
import { DashboardRepository } from "../repositories/dashboard.repository.js";
import { GastosRepository } from "../repositories/gastos.repository.js";
import { EntidadesFinancierasRepository } from "../repositories/entidades-financieras.repository.js";

const router = express.Router();

const dashboardRepository = new DashboardRepository();
const gastosRepository = new GastosRepository();
const entidadesFinancierasRepository = new EntidadesFinancierasRepository();
const dashboardController = new DashboardController(dashboardRepository, gastosRepository, entidadesFinancierasRepository);


router.get("/home", dashboardController.home);
router.post("/gastos", dashboardController.crearGasto);
router.post("/pagar-cuota", dashboardController.pagarCuota);
router.post("/pagar-cuotas-lote", dashboardController.pagarCuotasLote);

export default router;