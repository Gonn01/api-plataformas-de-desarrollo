import { executeQuery } from "../db.js";

export class MovementsRepository {
    async getMovementsByEntidad(entidadId) {
        return await executeQuery(
            `SELECT id, created_at, movement_type
             FROM financial_entities_movements
             WHERE financial_entity_id = $1
             ORDER BY created_at DESC`,
            [entidadId]
        );
    }

    async getMovementsByGasto(gastoId) {
        return await executeQuery(
            `SELECT id, created_at, movement_type
             FROM purchases_movements
             WHERE purchase_id = $1
             ORDER BY created_at DESC`,
            [gastoId],
        );
    }

    async createEntidadLog(entidadId, movement_type) {
        return await executeQuery(
            `INSERT INTO financial_entities_logs (created_at, financial_entity_id, movement_type)
             VALUES (NOW(), $1, $2)
             RETURNING *`,
            [entidadId, movement_type]
        );
    }

    async createGastoLog(gastoId, movement_type) {
        return await executeQuery(
            `INSERT INTO purchases_logs (created_at, purchase_id, movement_type)
             VALUES (NOW(), $1, $2)
             RETURNING *`,
            [gastoId, movement_type]
        );
    }
}
