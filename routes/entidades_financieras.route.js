import express from "express";
import { EntidadesFinancierasController } from "../controller/entidades-financieras.controller.js";
import { EntidadesFinancierasRepository } from "../repositories/entidades-financieras.repository.js";
import { LogsRepository } from "../repositories/logs.repository.js";
import { GastosRepository } from "../repositories/gastos.repository.js";
import { EntidadesFinancierasService } from "../services/entidades-financieras.service.js";

const router = express.Router();

const entidadesFinancierasRepository = new EntidadesFinancierasRepository();
const gastosRepository = new GastosRepository();
const logsRepository = new LogsRepository();

const entidadesFinancierasService = new EntidadesFinancierasService({
    entidadesFinancierasRepository,
    gastosRepository,
    logsRepository
});

const entidadesFinancierasController = new EntidadesFinancierasController(entidadesFinancierasService);

router.get("/", entidadesFinancierasController.listar)
router.get("/:id", entidadesFinancierasController.obtenerPorId);
router.post("/", entidadesFinancierasController.crear);
router.delete("/:id", entidadesFinancierasController.eliminar);
router.put("/:id", entidadesFinancierasController.actualizar)

export default router;
