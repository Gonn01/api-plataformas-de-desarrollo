import express from "express";
import { makeEntidadesFinancierasController } from "../factories/entidades_financieras.factory.js";

const router = express.Router();

const controller = makeEntidadesFinancierasController();

router.get("/", controller.listar);
router.get("/:id", controller.obtenerPorId);
router.post("/", controller.crear);
router.delete("/:id", controller.eliminar);
router.put("/:id", controller.actualizar);

export default router;
