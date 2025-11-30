import express from "express";
import { EntidadesFinancierasController } from "../controller/entidades_financieras.controller.js";

const router = express.Router();

router.post("/", EntidadesFinancierasController.crear);
router.delete("/", EntidadesFinancierasController.eliminar);

export default router;
