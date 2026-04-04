import { CategoriasController } from "../controller/categorias.controller.js";
import { CategoriasRepository } from "../repositories/categorias.repository.js";
import { CategoriasService } from "../services/categorias.service.js";

export function makeCategoriasController() {
    const categoriasRepository = new CategoriasRepository();
    const categoriasService = new CategoriasService({ categoriasRepository });
    return new CategoriasController(categoriasService);
}
