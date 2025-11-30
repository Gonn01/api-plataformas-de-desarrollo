import express from "express";
import { DashboardController } from "../controller/dashboard.controller.js";

const router = express.Router();

router.get("/home", DashboardController.home);
router.post("/gastos", DashboardController.crearGasto);
router.post("/pagar-cuota", DashboardController.pagarCuota);
router.post("/pagar-cuotas-lote", DashboardController.pagarCuotasLote);

export default router;