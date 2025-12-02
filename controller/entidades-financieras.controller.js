import { logRed } from "../utils/logs_custom.js";

export class EntidadesFinancierasController {
    constructor(entidadesFinancierasRepository, gastosRepository, logsRepository) {
        this.entidadesFinancierasRepository = entidadesFinancierasRepository;
        this.gastosRepository = gastosRepository;
        this.logsRepository = logsRepository;
    }

    listar = async (req, res) => {
        try {
            const { userId } = req.session;

            const rows = await this.entidadesFinancierasRepository.listar(userId);

            res.json(rows);
        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }

    obtenerPorId = async (req, res) => {
        try {
            const { id } = req.params;
            const { userId } = req.session;

            const entidad = await this.entidadesFinancierasRepository.getById(id, userId);

            if (!entidad.length) {
                return res.status(404).json({ error: "Entidad no encontrada" });
            }

            const gastos = await this.gastosRepository.getGastosByEntidad(id);
            const logs = await this.logsRepository.getLogsByEntidad(id);

            res.json({
                ...entidad[0],
                gastos_activos: gastos.filter(g => g.deleted === false),
                gastos_inactivos: gastos.filter(g => g.deleted === true),
                logs
            });

        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    };

    crear = async (req, res) => {
        try {
            const { name } = req.body;
            const { userId } = req.session;

            if (!name) {
                return res.status(400).json({ error: "Falta el campo 'name'" });
            }

            const inserted = await this.entidadesFinancierasRepository.create(name, userId);

            res.status(201).json(inserted[0]);
        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }

    actualizar = async (req, res) => {
        try {
            const { id } = req.params;
            const { name } = req.body;
            const { userId } = req.session;

            const currentRows = await this.entidadesFinancierasRepository.getById(id, userId);

            if (currentRows.length === 0) {
                return res.status(404).json({ error: "Entidad no encontrada" });
            }

            const updatedRows = await this.entidadesFinancierasRepository.update(id, name, userId);

            res.json(updatedRows[0]);
        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }

    eliminar = async (req, res) => {
        try {
            const { id } = req.params;
            const { userId } = req.user;

            const deletedRows = await this.entidadesFinancierasRepository.delete(id, userId);

            if (deletedRows.length === 0) {
                return res.status(404).json({ error: "Entidad no encontrada" });
            }

            res.json({ message: "Entidad financiera eliminada con éxito", id });
        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }
}

