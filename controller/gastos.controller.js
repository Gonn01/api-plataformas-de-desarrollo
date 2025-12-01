import { executeQuery } from "../db.js";

export class GastosController {

    // 1. GET /gastos/:id
    static async getById(req, res) {
        try {
            const { id } = req.params;
            
            // Usamos 'purchases' igual que tus compañeros
            const rows = await executeQuery(
                `SELECT * FROM purchases WHERE id = $1 AND deleted = false`,
                [id]
            );

            if (rows.length === 0) {
                return res.status(404).json({ error: "Gasto no encontrado" });
            }

            res.json(rows[0]);
        } catch (err) {
            console.log(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }

    // 2. PUT /gastos/:id
static async update(req, res) {
        try {
            const { id } = req.params;
            // Quitamos 'ignored' de aquí porque no existe en la base
            const { name, amount, image, fixed_expense } = req.body;

            console.log("--> INTENTANDO ACTUALIZAR GASTO ID:", id);

            const updatedRows = await executeQuery(
                `UPDATE purchases 
                 SET name = $1, amount = $2, image = $3, fixed_expense = $4
                 WHERE id = $5
                 RETURNING *`,
                [
                    name, 
                    amount, 
                    image || null, 
                    fixed_expense || false, 
                    id // Fíjate que ahora el ID es el $5
                ]
            );

            if (updatedRows.length === 0) {
                return res.status(404).json({ error: "No se pudo actualizar (Gasto no existe)" });
            }

            res.json({ message: "Gasto actualizado", gasto: updatedRows[0] });
        } catch (err) {
            console.log(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }

    // 3. DELETE /gastos/:id
    static async delete(req, res) {
        try {
            const { id } = req.params;

            const deletedRows = await executeQuery(
                `UPDATE purchases SET deleted = true WHERE id = $1 RETURNING id`,
                [id]
            );

            if (deletedRows.length === 0) {
                return res.status(404).json({ error: "Gasto no encontrado" });
            }

            res.json({ message: "Gasto eliminado correctamente", id });
        } catch (err) {
            console.log(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }
}
