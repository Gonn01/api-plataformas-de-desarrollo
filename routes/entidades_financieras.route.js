import express from "express";
import { makeEntidadesFinancierasController } from "../factories/entidades_financieras.factory.js";

const router = express.Router();

const entidadesFinancierasController = makeEntidadesFinancierasController();

router.get("/", entidadesFinancierasController.listar);
router.get("/:id", entidadesFinancierasController.obtenerPorId);
router.post("/", entidadesFinancierasController.crear);
router.delete("/:id", entidadesFinancierasController.eliminar);
router.put("/:id", entidadesFinancierasController.actualizar);

export default router;
