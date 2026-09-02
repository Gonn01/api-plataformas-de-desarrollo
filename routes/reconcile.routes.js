import { Router } from "express";
import { makeReconcileController } from "../factories/reconcile.factory.js";

const router = Router();
const controller = makeReconcileController();

router.get("/session", controller.getSession);
router.post("/session", controller.startSession);
router.put("/session/items", controller.setItems);
router.post("/session/finish", controller.finishSession);
router.delete("/session", controller.discardSession);

router.get("/snapshots", controller.listSnapshots);
router.get("/snapshots/:id", controller.getSnapshot);

export default router;
