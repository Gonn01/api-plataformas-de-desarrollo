import { ReconcileController } from "../controller/reconcile.controller.js";
import { ReconcileRepository } from "../repositories/reconcile.repository.js";
import { ReconcileService } from "../services/reconcile.service.js";

export function makeReconcileController() {
    const reconcileRepository = new ReconcileRepository();
    const reconcileService = new ReconcileService({ reconcileRepository });
    return new ReconcileController(reconcileService);
}
