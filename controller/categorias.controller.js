import { logRed } from "../utils/logs_custom.js";

export class CategoriasController {
    constructor(categoriasService) {
        this.categoriasService = categoriasService;
    }

    listar = async (req, res) => {
        try {
            const { userId } = req.session;
            const data = await this.categoriasService.listar(userId);
            res.json({ message: "Listado de categorías", data });
        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    };

    crear = async (req, res) => {
        try {
            const { name, color } = req.body;
            const { userId } = req.session;

            if (!name) return res.status(400).json({ error: "Falta el campo 'name'" });

            const data = await this.categoriasService.crear(name, color, userId);
            res.status(201).json({ message: "Categoría creada con éxito", data });
        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    };

    actualizar = async (req, res) => {
        try {
            const { id } = req.params;
            const { name, color } = req.body;
            const { userId } = req.session;

            if (!name) return res.status(400).json({ error: "Falta el campo 'name'" });

            const data = await this.categoriasService.actualizar(id, name, color, userId);
            res.json({ message: "Categoría actualizada con éxito", data });
        } catch (err) {
            logRed(err);
            if (err.message === "Categoría no encontrada") {
                return res.status(404).json({ error: err.message });
            }
            res.status(500).json({ error: "Error en el servidor" });
        }
    };

    eliminar = async (req, res) => {
        try {
            const { id } = req.params;
            const { userId } = req.session;

            const data = await this.categoriasService.eliminar(id, userId);
            res.json({ message: "Categoría eliminada con éxito", data });
        } catch (err) {
            logRed(err);
            if (err.message === "Categoría no encontrada") {
                return res.status(404).json({ error: err.message });
            }
            res.status(500).json({ error: "Error en el servidor" });
        }
    };
}
