import express from "express";
import { makeFactoryController } from "../factories/dashboard.factory.js";

const router = express.Router();

const dashboardController = makeFactoryController();

router.get("/home", dashboardController.home);
router.post("/gastos", dashboardController.crearGasto);
router.post("/pagar-cuota", dashboardController.pagarCuota);
router.post("/pagar-cuotas-lote", dashboardController.pagarCuotasLote);

export default router;
