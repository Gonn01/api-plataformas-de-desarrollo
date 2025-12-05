import { GastosController } from "../controller/gastos.controller.js";
import { GastosRepository } from "../repositories/gastos.repository.js";
import { LogsRepository } from "../repositories/logs.repository.js";
import { GastosService } from "../services/gastos.service.js";

export function makeGastosController() {
    const gastosRepository = new GastosRepository();
    const logsRepository = new LogsRepository();

    const gastosService = new GastosService({
        gastosRepository,
        logsRepository
    });

    const gastosController = new GastosController(gastosService);

    return gastosController;
}
