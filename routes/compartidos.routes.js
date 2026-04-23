import { Router } from "express";
import { makeCompartidosController } from "../factories/compartidos.factory.js";

const router = Router();
const controller = makeCompartidosController();

router.get("/", controller.getCompartidos);
router.post("/:id/aprobar", controller.aprobar);
router.post("/:id/rechazar", controller.rechazar);
router.post("/:id/reintentar", controller.reintentar);

export default router;
