import { logRed } from "../utils/logs_custom.js";

export class CompartidosController {
    constructor(compartidosService) {
        this.compartidosService = compartidosService;
    }

    getCompartidos = async (req, res) => {
        try {
            const { userId } = req.session;
            const data = await this.compartidosService.getCompartidos(userId);
            res.json({ message: "Gastos compartidos obtenidos", data });
        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }

    aprobar = async (req, res) => {
        try {
            const { id } = req.params;
            const { financial_entity_id, new_entity_name } = req.body;
            const { userId } = req.session;

            const data = await this.compartidosService.aprobar(id, userId, financial_entity_id, new_entity_name);
            res.json({ message: "Gasto aprobado con éxito", data });
        } catch (err) {
            logRed(err);
            if (err.message === "Gasto no encontrado") return res.status(404).json({ error: err.message });
            if (err.message === "No autorizado") return res.status(403).json({ error: err.message });
            if (
                err.message === "El gasto no está pendiente de aprobación" ||
                err.message === "Debe seleccionar una entidad o proporcionar un nombre para crear una nueva" ||
                err.message === "Entidad no encontrada o no pertenece al usuario"
            ) return res.status(400).json({ error: err.message });
            res.status(500).json({ error: "Error en el servidor" });
        }
    }

    rechazar = async (req, res) => {
        try {
            const { id } = req.params;
            const { userId } = req.session;

            const data = await this.compartidosService.rechazar(id, userId);
            res.json({ message: "Gasto rechazado", data });
        } catch (err) {
            logRed(err);
            if (err.message === "Gasto no encontrado") return res.status(404).json({ error: err.message });
            if (err.message === "No autorizado") return res.status(403).json({ error: err.message });
            if (err.message === "El gasto no está pendiente de aprobación") return res.status(400).json({ error: err.message });
            res.status(500).json({ error: "Error en el servidor" });
        }
    }

    reintentar = async (req, res) => {
        try {
            const { id } = req.params;
            const { userId } = req.session;

            const data = await this.compartidosService.reintentar(id, userId);
            res.json({ message: "Gasto reenviado con éxito", data });
        } catch (err) {
            logRed(err);
            if (err.message === "Gasto no encontrado") return res.status(404).json({ error: err.message });
            if (err.message === "No autorizado") return res.status(403).json({ error: err.message });
            if (
                err.message === "No hay gasto compartido asociado" ||
                err.message === "El gasto compartido no está rechazado"
            ) return res.status(400).json({ error: err.message });
            res.status(500).json({ error: "Error en el servidor" });
        }
    }
}
