import { executeQuery } from "../db.js";

export class LogsRepository {
    async getLogsByEntidad(entidadId) {
        return await executeQuery(
            `SELECT id, created_at, content
             FROM financial_entities_logs
             WHERE financial_entity_id = $1
             ORDER BY created_at DESC`,
            [entidadId]
        );
    }

    async getLogsByGasto(gastoId) {
        return await executeQuery(
            `SELECT id, created_at, content
             FROM purchases_logs
             WHERE purchase_id = $1
             ORDER BY created_at DESC`,
            [gastoId],
        );
    }

    async createEntidadLog(entidadId, content) {
        return await executeQuery(
            `INSERT INTO financial_entities_logs (created_at, financial_entity_id, content)
             VALUES (NOW(), $1, $2)
             RETURNING *`,
            [entidadId, content]
        );
    }

    async createGastoLog(gastoId, content) {
        return await executeQuery(
            `INSERT INTO purchases_logs (created_at, purchase_id, content)
             VALUES (NOW(), $1, $2)
             RETURNING *`,
            [gastoId, content]
        );
    }
}
