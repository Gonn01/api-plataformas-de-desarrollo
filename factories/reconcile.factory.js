import { ReconcileController } from "../controller/reconcile.controller.js";
import { ReconcileRepository } from "../repositories/reconcile.repository.js";
import { ReconcileService } from "../services/reconcile.service.js";
import { GastosService } from "../services/gastos.service.js";
import { GastosRepository } from "../repositories/gastos.repository.js";
import { MovementsRepository } from "../repositories/movements.repository.js";
import { EntidadesFinancierasRepository } from "../repositories/entidades-financieras.repository.js";
import { CategoriasRepository } from "../repositories/categorias.repository.js";

export function makeReconcileController() {
    const reconcileRepository = new ReconcileRepository();

    // El cierre de sesión efectúa los pagos marcados: necesita GastosService.
    const gastosService = new GastosService({
        gastosRepository: new GastosRepository(),
        movementsRepository: new MovementsRepository(),
        entidadesFinancierasRepository: new EntidadesFinancierasRepository(),
        categoriasRepository: new CategoriasRepository(),
        reconcileRepository,
    });

    const reconcileService = new ReconcileService({ reconcileRepository, gastosService });
    return new ReconcileController(reconcileService);
}
