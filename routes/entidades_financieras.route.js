import express from "express";
import { EntidadesFinancierasController } from "../controller/entidades_financieras.controller.js";

const router = express.Router();

router.get("/", EntidadesFinancierasController.listar)
router.get("/:id", EntidadesFinancierasController.obtenerById);
router.post("/", EntidadesFinancierasController.crear);
router.delete("/:id", EntidadesFinancierasController.eliminar);
router.put("/:id", EntidadesFinancierasController.actualizar)


export default router;
