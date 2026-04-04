import { Router } from "express";
import { makeCategoriasController } from "../factories/categorias.factory.js";

const router = Router();
const controller = makeCategoriasController();

router.get("/", controller.listar);
router.post("/", controller.crear);
router.put("/:id", controller.actualizar);
router.delete("/:id", controller.eliminar);

export default router;
