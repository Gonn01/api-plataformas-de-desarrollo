import express from "express";
import { EntidadesFinancierasController } from "../controller/entidades-financieras.controller.js";
import { EntidadesFinancierasRepository } from "../repositories/entidades-financieras.repository.js";

const router = express.Router();

const entidadesFinancierasRepository = new EntidadesFinancierasRepository();
const entidadesFinancierasController = new EntidadesFinancierasController(entidadesFinancierasRepository);

router.get("/", entidadesFinancierasController.listar)
router.get("/:id", entidadesFinancierasController.obtenerPorId);
router.post("/", entidadesFinancierasController.crear);
router.delete("/:id", entidadesFinancierasController.eliminar);
router.put("/:id", entidadesFinancierasController.actualizar)


export default router;
