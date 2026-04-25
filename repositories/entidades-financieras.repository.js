import { executeQuery } from "../db.js";

export class EntidadesFinancierasRepository {
    async listar(userId) {
        return await executeQuery(
            `SELECT fe.id, fe.name, fe.linked_user_id,
                    u.name AS linked_user_name, u.email AS linked_user_email
             FROM financial_entities fe
             LEFT JOIN users u ON u.id = fe.linked_user_id
             WHERE fe.deleted = false AND fe.user_id = $1
             ORDER BY fe.created_at DESC`,
            [userId], true
        );
    }

    async getById(id, userId) {
        return await executeQuery(
            `SELECT fe.id, fe.name, fe.user_id, fe.deleted, fe.created_at, fe.linked_user_id,
                    u.name AS linked_user_name, u.email AS linked_user_email
             FROM financial_entities fe
             LEFT JOIN users u ON u.id = fe.linked_user_id
             WHERE fe.id = $1 AND fe.deleted = false AND fe.user_id = $2
             LIMIT 1`,
            [id, userId], true
        );
    }

    async create(name, userId) {
        return await executeQuery(
            `INSERT INTO financial_entities (name, user_id, deleted, created_at)
             VALUES ($1, $2, false, NOW())
             RETURNING id, name, user_id, deleted, created_at, linked_user_id`,
            [name, userId], true
        );
    }

    async update(id, name, userId) {
        return await executeQuery(
            `UPDATE financial_entities
             SET name = $1
             WHERE id = $2 AND user_id = $3
             RETURNING id, name, user_id, deleted, created_at, linked_user_id`,
            [name, id, userId], true
        );
    }

    async delete(id, userId) {
        return await executeQuery(
            `UPDATE financial_entities
             SET deleted = true
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [id, userId], true
        );
    }

    async findByLinkedUser(userId, linkedUserId) {
        return await executeQuery(
            `SELECT id, name FROM financial_entities
             WHERE user_id = $1 AND linked_user_id = $2 AND deleted = false
             LIMIT 1`,
            [userId, linkedUserId], true
        );
    }

    async vincularUsuario(id, userId, linkedUserId) {
        return await executeQuery(
            `UPDATE financial_entities
             SET linked_user_id = $3
             WHERE id = $1 AND user_id = $2 AND deleted = false
             RETURNING id, name, user_id, deleted, created_at, linked_user_id`,
            [id, userId, linkedUserId], true
        );
    }

    async desvincularUsuario(id, userId) {
        return await executeQuery(
            `UPDATE financial_entities
             SET linked_user_id = NULL
             WHERE id = $1 AND user_id = $2 AND deleted = false
             RETURNING id, name, user_id, deleted, created_at, linked_user_id`,
            [id, userId], true
        );
    }
}
