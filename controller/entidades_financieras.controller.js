
import bcrypt from "bcrypt";
import { executeQuery } from "../db.js";

export class EntidadesFinancierasController {
    static async listar(req, res) {
        try {
            const rows = await executeQuery(
                `SELECT id, name, name, user_id, deleted, created_at
                FROM financial_entities
                WHERE deleted = false
                ORDER BY created_at DESC`
            );
            res.json(rows);
        } catch (err) {
            console.log(err);
            res.status(500).json({ error: "Error en el servidor" });
        }

    }   

    static async obtenerById(req, res) {
        try {
            const { id } = req.params;

            const rows = await executeQuery(
                `SELECT id, name, user_id, deleted, created_at
                FROM financial_entities
                WHERE id = $1
                LIMIT 1`,
                [id]
            );

            if (rows.length === 0) {
                return res.status(404).json({ error: "Entidad no encontrada" });
            }

                res.json(rows[0]);
            } catch (err) {
                console.log(err);
                res.status(500).json({ error: "Error en el servidor" });
            }
        }


    static async crear(req, res) {
        try {
            const {name, user_id } = req.body;

            if (!name || !user_id) {
                return res.status(400).json({ error: "Falta el campo 'name' o 'user_id'" });
            }

            const inserted = await executeQuery(
                `INSERT INTO financial_entities
                (name, user_id, deleted, created_at)
                VALUES ($1, $2, false, now())
                RETURNING id, name, user_id, deleted, created_at`,
                [name, user_id]
            );

        res.status(201).json(inserted[0]);


        } catch (err) {
            console.log(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }


    static async actualizar(req, res) {
        try {
            const { id } = req.params;
            const { name} = req.body;


        const currentRows = await executeQuery(
            `SELECT id, name, deleted
            FROM financial_entities
            WHERE id = $1
            LIMIT 1`,
            [id]
        );

        if (currentRows.length === 0) {
            return res.status(404).json({ error: "Entidad no encontrada" });
        }

        const updatedRows = await executeQuery(
            `UPDATE financial_entities
            SET name = $1
            WHERE id = $2
            RETURNING id, name, deleted, created_at`,
            [name, id]
        );

        res.json(updatedRows[0]);

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Error en el servidor" });
    }
}


    static async eliminar(req, res) {
        try {
            const { id } = req.params;
            

        const deletedRows = await executeQuery(
            `UPDATE financial_entities
            set deleted = true
            WHERE id = $1
            RETURNING id`,
            [id]
        );

        if (deletedRows.length === 0) {
            return res.status(404).json({ error: "Entidad no encontrada" });
        }

        res.json({ message: "Entidad financiera eliminada con éxito", id });
        } catch (err) {
            console.log(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }

}

