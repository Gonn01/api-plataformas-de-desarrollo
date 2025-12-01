import { logRed } from "../utils/logs_custom.js";

export class GastosController {

    constructor(gastosRepository) {
        this.gastosRepository = gastosRepository;
    }

    getById = async (req, res) => {
        try {
            const { id } = req.params;

            const rows = await this.gastosRepository.getById(id);

            if (rows.length === 0) {
                return res.status(404).json({ error: "Gasto no encontrado" });
            }

            res.json(rows[0]);
        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }

    update = async (req, res) => {
        try {
            const { id } = req.params;
            const { name, amount, image, fixed_expense } = req.body;

            const updatedRows = await this.gastosRepository.update(id, name, amount, image, fixed_expense);

            if (updatedRows.length === 0) {
                return res.status(404).json({ error: "No se pudo actualizar (Gasto no existe)" });
            }

            res.json({ message: "Gasto actualizado", gasto: updatedRows[0] });
        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }

    delete = async (req, res) => {
        try {
            const { id } = req.params;

            const deletedRows = await this.gastosRepository.delete(id);

            if (deletedRows.length === 0) {
                return res.status(404).json({ error: "Gasto no encontrado" });
            }

            res.json({ message: "Gasto eliminado correctamente", id });
        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }
}
