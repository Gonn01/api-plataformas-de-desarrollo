import { GastosController } from "../controller/gastos.controller";
import { GastosRepository } from "../repositories/gastos.repository";
import { LogsRepository } from "../repositories/logs.repository";
import { GastosService } from "../services/gastos.service";

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
