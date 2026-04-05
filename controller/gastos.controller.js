import { logRed } from "../utils/logs_custom.js";

export class GastosController {

    constructor(gastosService) {
        this.gastosService = gastosService;
    }

    crear = async (req, res) => {
        try {
            const {
                financial_entity_id,
                name,
                amount,
                number_of_quotas,
                currency_type,
                fixed_expense,
                image_url,
                type,
                payed_quotas,
                category_ids,
            } = req.body;
            const { userId } = req.session;

            if (!financial_entity_id || !name || !amount || !currency_type) {
                return res.status(400).json({ error: "Faltan campos obligatorios" });
            }

            const inserted = await this.gastosService.crearGasto(
                financial_entity_id,
                name,
                amount,
                number_of_quotas,
                currency_type,
                fixed_expense,
                image_url,
                type,
                userId,
                payed_quotas,
                category_ids
            );
            res.status(201).json({
                message: "Gasto creado con éxito",
                data: inserted[0],
            });
        } catch (err) {
            logRed(err);
            if (err.message === "Entidad financiera no encontrada o eliminada") {
                return res.status(404).json({ error: err.message });
            }
            res.status(500).json({ error: "Error en el servidor" });
        }
    };

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
            const { name, amount, image_url, fixed_expense, type, category_ids, payed_quotas } = req.body;

            const response = await this.gastosService.update(id, name, amount, image_url, fixed_expense, type, category_ids, payed_quotas);

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

    pagarCuota = async (req, res) => {
        try {
            const { id } = req.params;

            const updated = await this.gastosService.pagarCuota(id);

            res.json({
                message: "Cuota pagada con éxito",
                data: updated[0]
            });
        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }

    actualizarCategorias = async (req, res) => {
        try {
            const { id } = req.params;
            const { category_ids } = req.body;

            if (!Array.isArray(category_ids)) {
                return res.status(400).json({ error: "Debe enviar 'category_ids' como array" });
            }

            const data = await this.gastosService.actualizarCategorias(id, category_ids);
            res.json({ message: "Categorías actualizadas con éxito", data });
        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }

    pagarCuotasLote = async (req, res) => {
        try {
            const { purchase_ids } = req.body;

            if (!Array.isArray(purchase_ids) || purchase_ids.length === 0) {
                return res.status(400).json({
                    error: "Debe enviar 'purchase_ids' como array no vacío",
                });
            }

            const { updated, failed } = await this.gastosService.pagarCuotasLote(purchase_ids);

            res.json({
                message: "Lote procesado",
                updated,
                failed,
            });
        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }
}
