import { logRed } from "../utils/logs_custom.js";

export class GastosController {

    constructor(gastosService) {
        this.gastosService = gastosService;
    }

    getById = async (req, res) => {
        try {
            const { id } = req.params;

            const response = await this.gastosService.getById(id);

            res.json({
                message: "Gasto encontrado",
                data: response
            });
        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }

    update = async (req, res) => {
        try {
            const { id } = req.params;
            const { name, amount, image, fixed_expense } = req.body;

            const response = await this.gastosService.update(id, name, amount, image, fixed_expense);

            res.json({
                message: "Gasto actualizado",
                data: response
            });
        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }

    delete = async (req, res) => {
        try {
            const { id } = req.params;

            await this.gastosService.delete(id);

            res.json({
                message: "Gasto eliminado correctamente",
                data: id
            });
        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }
}
