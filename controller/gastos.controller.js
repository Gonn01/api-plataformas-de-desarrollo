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
                payment_entity_id,
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
                category_ids,
                payment_entity_id
            );
            res.status(201).json({
                message: "Gasto creado con éxito",
                data: inserted[0],
            });
        } catch (err) {
            logRed(err);
            if (
                err.message === "Entidad financiera no encontrada o eliminada" ||
                err.message === "Entidad de pago no encontrada o eliminada"
            ) {
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
            const { name, amount, image_url, fixed_expense, type, category_ids, payed_quotas, apply_to_linked } = req.body;

            const response = await this.gastosService.update(id, name, amount, image_url, fixed_expense, type, category_ids, payed_quotas, apply_to_linked);

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
            const deleteLinked = req.body?.delete_linked ?? req.query?.delete_linked;
            const shouldDeleteLinked = deleteLinked === true || deleteLinked === "true";

            await this.gastosService.delete(id, shouldDeleteLinked);

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
            const { userId } = req.session;

            const updated = await this.gastosService.pagarCuota(id, userId);

            res.json({
                message: "Cuota pagada con éxito",
                data: updated[0]
            });
        } catch (err) {
            logRed(err);
            if (err.code === "RECONCILE_REQUIRED") {
                return res.status(409).json({
                    error: 'Activá el modo "Hacer cuentas" para registrar pagos.',
                    code: "RECONCILE_REQUIRED"
                });
            }
            res.status(500).json({ error: "Error en el servidor" });
        }
    }

    refundCuota = async (req, res) => {
        try {
            const { id } = req.params;

            const updated = await this.gastosService.refundCuota(id);

            res.json({
                message: "Cuota revertida con éxito",
                data: updated[0]
            });
        } catch (err) {
            logRed(err);
            if (err.message === "Gasto no encontrado" || err.message === "No hay cuotas pagadas para revertir") {
                return res.status(400).json({ error: err.message });
            }
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
            const { userId } = req.session;

            if (!Array.isArray(purchase_ids) || purchase_ids.length === 0) {
                return res.status(400).json({
                    error: "Debe enviar 'purchase_ids' como array no vacío",
                });
            }

            const { updated, failed } = await this.gastosService.pagarCuotasLote(purchase_ids, userId);

            res.json({
                message: "Lote procesado",
                data: {
                    updated,
                    failed
                }
            });
        } catch (err) {
            logRed(err);
            if (err.code === "RECONCILE_REQUIRED") {
                return res.status(409).json({
                    error: 'Activá el modo "Hacer cuentas" para registrar pagos.',
                    code: "RECONCILE_REQUIRED"
                });
            }
            res.status(500).json({ error: "Error en el servidor" });
        }
    }
}
