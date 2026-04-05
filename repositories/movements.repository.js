import { executeQuery } from "../db.js";

export class MovementsRepository {
    async getMovementsByEntidad(entidadId) {
        return await executeQuery(
            `SELECT id, created_at, movement_type
             FROM financial_entities_movements
             WHERE financial_entity_id = $1
             ORDER BY created_at DESC`,
            [entidadId], true
        );
    }

    async getMovementsByGasto(gastoId) {
        return await executeQuery(
            `SELECT id, created_at, movement_type, amount, payment_date
             FROM purchases_movements
             WHERE purchase_id = $1
             ORDER BY created_at DESC`,
            [gastoId], true
        );
    }

    async createEntidadLog(entidadId, movementType) {
        return await executeQuery(
            `INSERT INTO financial_entities_movements (created_at, financial_entity_id, movement_type)
             VALUES (NOW(), $1, $2)
             RETURNING *`,
            [entidadId, movementType], true
        );
    }

    async deletePayments(gastoId) {
        return await executeQuery(
            `DELETE FROM purchases_movements WHERE purchase_id = $1 AND movement_type = 'PAYMENT'`,
            [gastoId], true
        );
    }

    async deleteLastPayment(gastoId) {
        return await executeQuery(
            `DELETE FROM purchases_movements
             WHERE id = (
                 SELECT id FROM purchases_movements
                 WHERE purchase_id = $1 AND movement_type = 'PAYMENT'
                 ORDER BY payment_date DESC, created_at DESC
                 LIMIT 1
             )
             RETURNING *`,
            [gastoId], true
        );
    }

    async createGastoLog(gastoId, movementType, amount = null, paymentDate = null) {
        return await executeQuery(
            `INSERT INTO purchases_movements (created_at, purchase_id, movement_type, amount, payment_date)
             VALUES (NOW(), $1, $2, $3, $4)
             RETURNING *`,
            [gastoId, movementType, amount, paymentDate], true
        );
    }
}
