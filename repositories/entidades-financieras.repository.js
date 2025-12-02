import { executeQuery } from "../db.js";

export class EntidadesFinancierasRepository {
    async listar(userId) {
        return await executeQuery(
            `SELECT * FROM financial_entities WHERE deleted = false AND user_id = $1 ORDER BY created_at DESC`,
            [userId]
        );
    }
    async getLogs(userId) {
        return await executeQuery(
            `SELECT fl.id, fl.action, fl.entity_id, fl.timestamp, fe.name AS entity_name
             FROM financial_logs fl
             JOIN financial_entities fe ON fe.id = fl.entity_id
             WHERE fe.user_id = $1
             ORDER BY fl.timestamp DESC`,
            [userId]
        );
    }

    async getById(id, userId) {
        return await executeQuery(
            `SELECT id, name, user_id, deleted, created_at
             FROM financial_entities
             WHERE id = $1 AND deleted = false AND user_id = $2
             LIMIT 1`,
            [id, userId], true
        );
    }

    async create(name, userId) {
        return await executeQuery(
            `INSERT INTO financial_entities (name, user_id, deleted, created_at)
             VALUES ($1, $2, false, NOW())
             RETURNING id, name, user_id, deleted, created_at`,
            [name, userId]
        );
    }

    async update(id, name, userId) {
        return await executeQuery(
            `UPDATE financial_entities
             SET name = $1
             WHERE id = $2 AND user_id = $3
             RETURNING id, name, user_id, deleted, created_at`,
            [name, id, userId]
        );
    }

    async delete(id, userId) {
        return await executeQuery(
            `UPDATE financial_entities
             SET deleted = true
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [id, userId]
        );
    }
}
