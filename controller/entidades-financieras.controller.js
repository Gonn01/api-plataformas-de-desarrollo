import { logRed } from "../utils/logs_custom.js";

export class EntidadesFinancierasController {
    constructor(entidadesFinancierasService) {
        this.entidadesFinancierasService = entidadesFinancierasService;
    }

    listar = async (req, res) => {
        try {
            const { userId } = req.session;

            const response = await this.entidadesFinancierasService.listar(userId);

            res.json({
                message: "Listado de entidades financieras",
                data: response
            });
        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }

    obtenerPorId = async (req, res) => {
        try {
            const { id } = req.params;
            const { userId } = req.session;

            const response = await this.entidadesFinancierasService.obtenerPorId(id, userId);

            res.json({
                message: "Entidad financiera obtenida con éxito",
                data: response
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

            const response = await this.entidadesFinancierasService.crear(name, userId);

            res.status(201).json({
                message: "Entidad financiera creada con éxito",
                data: response
            });
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

            const response = await this.entidadesFinancierasService.actualizar(id, name, userId);

            res.json(response);
        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }

    eliminar = async (req, res) => {
        try {
            const { id } = req.params;
            const { userId } = req.session;

            const response = await this.entidadesFinancierasService.eliminar(id, userId);

            res.json({
                message: "Entidad financiera eliminada con éxito",
                data: response
            });
        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }
}

