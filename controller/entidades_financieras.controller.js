
import bcrypt from "bcrypt";
import { executeQuery } from "../db.js";

export class EntidadesFinancierasController {
    static async crear(req, res) {
        try {
            res.send("Crear entidad financiera");
        } catch (err) {
            console.log(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }
    static async eliminar(req, res) {
        try {
            const { id } = req.body;
            if (!id) {
                return res.status(400).json({ error: "Faltan campos" });
            }
            await executeQuery(
                "DELETE FROM entidades_financieras WHERE id = $1",
                [id]
            );
            res.status(200).json({ message: "Entidad financiera eliminada con éxito" });
        } catch (err) {
            console.log(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }
}

