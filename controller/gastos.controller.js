import { executeQuery } from '../db.js'; 

// 1. GET /gastos/:id (Obtener un gasto específico)
export const getGastoById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `SELECT * FROM purchases WHERE id = $1 AND deleted = false`;
        const result = await executeQuery(query, [id]);

        if (result.length === 0) {
            return res.status(404).json({ error: 'Gasto no encontrado' });
        }

        res.json(result[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. PUT /gastos/:id (Editar un gasto)
export const updateGasto = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, amount, image, fixed_expense, ignored } = req.body;

        // Actualizamos solo los campos básicos. 
        // Nota: No solemos dejar editar cantidad de cuotas ya pactadas, pero sí el nombre o monto.
        const query = `
            UPDATE purchases 
            SET name = $1, amount = $2, image = $3, fixed_expense = $4, ignored = $5
            WHERE id = $6
            RETURNING *
        `;

        // Si algún valor no viene, usamos null o false por defecto para que no rompa
        const values = [
            name, 
            amount, 
            image || null, 
            fixed_expense || false, 
            ignored || false, 
            id
        ];

        const result = await executeQuery(query, values);

        if (result.length === 0) {
            return res.status(404).json({ error: 'No se pudo actualizar (Gasto no existe)' });
        }

        res.json({ message: 'Gasto actualizado', gasto: result[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. DELETE /gastos/:id (Borrado Lógico)
// No lo borramos de verdad de la base, solo ponemos deleted = true
export const deleteGasto = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `UPDATE purchases SET deleted = true WHERE id = $1 RETURNING id`;
        const result = await executeQuery(query, [id]);

        if (result.length === 0) {
            return res.status(404).json({ error: 'Gasto no encontrado' });
        }

        res.json({ message: 'Gasto eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. POST /gastos/:id/pagar-cuota (Pagar cuota desde el detalle)
export const pagarCuotaGasto = async (req, res) => {
    try {
        const { id } = req.params;

        // Sumamos 1 a las cuotas pagadas, SIEMPRE QUE sea menor al total
        const query = `
            UPDATE purchases 
            SET payed_quotas = payed_quotas + 1
            WHERE id = $1 AND payed_quotas < number_of_quotas
            RETURNING *
        `;
        
        const result = await executeQuery(query, [id]);

        if (result.length === 0) {
            return res.status(400).json({ error: 'No se pudo pagar (quizás ya está pagado o el ID no existe)' });
        }

        res.json({ message: 'Cuota pagada', estado_actual: result[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};