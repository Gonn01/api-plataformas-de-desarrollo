import { executeQuery } from "../db.js";
import { Currency, ExpenseType, ExpenseStatus } from "../utils/enums.js";

const CALCULATED_FIELDS = `
  (SELECT COUNT(*) FROM purchases_movements WHERE purchase_id = p.id AND movement_type = 'PAYMENT')::int AS payed_quotas,
  CASE WHEN p.number_of_quotas > 0 THEN p.amount::numeric / p.number_of_quotas ELSE p.amount END AS amount_per_quota,
  (SELECT payment_date FROM purchases_movements WHERE purchase_id = p.id AND movement_type = 'PAYMENT' ORDER BY payment_date ASC NULLS LAST LIMIT 1) AS first_quota_date,
  (SELECT MAX(payment_date) FROM purchases_movements WHERE purchase_id = p.id AND movement_type = 'PAYMENT') AS last_payment_date,
  CASE WHEN p.fixed_expense = false AND (SELECT COUNT(*) FROM purchases_movements WHERE purchase_id = p.id AND movement_type = 'PAYMENT') >= p.number_of_quotas
       THEN (SELECT MAX(payment_date) FROM purchases_movements WHERE purchase_id = p.id AND movement_type = 'PAYMENT')
       ELSE NULL END AS finalization_date
`;

export class GastosRepository {
  async getById(id) {
    return await executeQuery(
      `SELECT p.*, ${CALCULATED_FIELDS}
       FROM purchases p
       WHERE p.id = $1 AND p.deleted = false`,
      [id], true
    );
  }

  async getGastosByEntidad(entidadId) {
    return await executeQuery(
      `SELECT p.*, ${CALCULATED_FIELDS},
          COALESCE(
            (SELECT json_agg(json_build_object('id', c.id, 'name', c.name, 'color', c.color))
             FROM purchases_categories pc
             JOIN user_categories c ON c.id = pc.category_id
             WHERE pc.purchase_id = p.id),
            '[]'::json
          ) AS categories
       FROM purchases p
       WHERE p.financial_entity_id = $1 AND p.deleted = false AND p.status = 'ACTIVE'
       ORDER BY p.created_at DESC`,
      [entidadId], true
    );
  }

  async pagarCuota(id) {
    return await executeQuery(
      `SELECT p.*, ${CALCULATED_FIELDS}
       FROM purchases p
       WHERE p.id = $1 AND p.deleted = false`,
      [id], true
    );
  }

  async pagarCuotasLote(ids) {
    const updated = [];
    for (const id of ids) {
      const result = await executeQuery(
        `SELECT p.*, ${CALCULATED_FIELDS}
         FROM purchases p
         WHERE p.id = $1 AND p.deleted = false`,
        [id], true
      );
      if (result.length > 0) updated.push(result[0]);
    }
    return updated;
  }

  async update(id, name, amount, image_url, fixed_expense, type) {
    const dbType = type ? String(type).toUpperCase() : null;
    return await executeQuery(
      `UPDATE purchases
       SET name = $1, amount = $2, image_url = $3, fixed_expense = $4, type = $5
       WHERE id = $6
       RETURNING *,
           (SELECT COUNT(*) FROM purchases_movements WHERE purchase_id = $6 AND movement_type = 'PAYMENT')::int AS payed_quotas,
           CASE WHEN number_of_quotas > 0 THEN amount::numeric / number_of_quotas ELSE amount END AS amount_per_quota,
           (SELECT payment_date FROM purchases_movements WHERE purchase_id = $6 AND movement_type = 'PAYMENT' ORDER BY payment_date ASC NULLS LAST LIMIT 1) AS first_quota_date,
           (SELECT MAX(payment_date) FROM purchases_movements WHERE purchase_id = $6 AND movement_type = 'PAYMENT') AS last_payment_date,
           CASE WHEN fixed_expense = false AND (SELECT COUNT(*) FROM purchases_movements WHERE purchase_id = $6 AND movement_type = 'PAYMENT') >= number_of_quotas
                THEN (SELECT MAX(payment_date) FROM purchases_movements WHERE purchase_id = $6 AND movement_type = 'PAYMENT')
                ELSE NULL END AS finalization_date`,
      [name, amount, image_url || null, fixed_expense || false, dbType, id], true
    );
  }

  async delete(id) {
    return await executeQuery(
      `UPDATE purchases SET deleted = true WHERE id = $1 RETURNING id`,
      [id], true
    );
  }

  async create({
    financial_entity_id,
    name,
    amount,
    number_of_quotas,
    currency_type,
    fixed_expense,
    image_url,
    type,
    status = ExpenseStatus.ACTIVE,
    shared_from_id = null,
    receiver_user_id = null,
  }) {
    const dbType = type && Object.values(ExpenseType).includes(String(type).toUpperCase())
      ? String(type).toUpperCase()
      : null;
    const dbCurrency = currency_type && Object.values(Currency).includes(String(currency_type).toUpperCase())
      ? String(currency_type).toUpperCase()
      : null;

    return await executeQuery(
      `INSERT INTO purchases (
        financial_entity_id, name, amount, number_of_quotas,
        currency_type, fixed_expense, deleted, image_url, created_at, type,
        status, shared_from_id, receiver_user_id
      )
      VALUES ($1,$2,$3,$4,$5,$6,false,$7,now(),$8,$9,$10,$11)
      RETURNING *,
          0::int AS payed_quotas,
          CASE WHEN $4 > 0 THEN $3::numeric / $4 ELSE $3 END AS amount_per_quota,
          NULL::timestamptz AS first_quota_date,
          NULL::timestamptz AS finalization_date`,
      [
        financial_entity_id ?? null,
        name,
        amount,
        number_of_quotas,
        dbCurrency,
        fixed_expense || false,
        image_url || null,
        dbType,
        status,
        shared_from_id,
        receiver_user_id,
      ], true
    );
  }

  async updateStatus(id, status) {
    return await executeQuery(
      `UPDATE purchases SET status = $2 WHERE id = $1 AND deleted = false RETURNING *`,
      [id, status], true
    );
  }

  async aprobarGasto(id, financialEntityId) {
    return await executeQuery(
      `UPDATE purchases
       SET status = 'ACTIVE', financial_entity_id = $2
       WHERE id = $1 AND deleted = false
       RETURNING *, ${CALCULATED_FIELDS.replace(/p\./g, '')}`,
      [id, financialEntityId], true
    );
  }

  async getEntityOwnerByPurchaseId(purchaseId) {
    return await executeQuery(
      `SELECT fe.user_id
       FROM purchases p
       JOIN financial_entities fe ON fe.id = p.financial_entity_id
       WHERE p.id = $1 AND p.deleted = false
       LIMIT 1`,
      [purchaseId], true
    );
  }

  async getSharedCopyByOriginalId(originalId) {
    return await executeQuery(
      `SELECT * FROM purchases WHERE shared_from_id = $1 AND deleted = false LIMIT 1`,
      [originalId], true
    );
  }

  async getCompartidosRecibidos(userId) {
    return await executeQuery(
      `SELECT
          p.id, p.name, p.amount, p.number_of_quotas, p.currency_type, p.type,
          p.fixed_expense, p.status, p.created_at, p.shared_from_id, p.financial_entity_id,
          (SELECT COUNT(*) FROM purchases_movements WHERE purchase_id = p.id AND movement_type = 'PAYMENT')::int AS payed_quotas,
          CASE WHEN p.number_of_quotas > 0 THEN p.amount::numeric / p.number_of_quotas ELSE p.amount END AS amount_per_quota,
          u_sender.id AS sender_id,
          u_sender.name AS sender_name,
          u_sender.email AS sender_email,
          fe_original.name AS sender_entity_name,
          fe_assigned.id AS assigned_entity_id,
          fe_assigned.name AS assigned_entity_name,
          (SELECT fe_sug.id FROM financial_entities fe_sug
           WHERE fe_sug.user_id = $1
             AND fe_sug.linked_user_id = fe_original.user_id
             AND fe_sug.deleted = false
           LIMIT 1) AS suggested_entity_id
       FROM purchases p
       JOIN purchases p_original ON p_original.id = p.shared_from_id AND p_original.deleted = false
       JOIN financial_entities fe_original ON fe_original.id = p_original.financial_entity_id
       JOIN users u_sender ON u_sender.id = fe_original.user_id
       LEFT JOIN financial_entities fe_assigned ON fe_assigned.id = p.financial_entity_id
       WHERE p.receiver_user_id = $1 AND p.deleted = false
       ORDER BY p.created_at DESC`,
      [userId], true
    );
  }

  async getCompartidosEmitidos(userId) {
    return await executeQuery(
      `SELECT
          p.id, p.name, p.amount, p.number_of_quotas, p.currency_type, p.type,
          p.fixed_expense, p.created_at, p.financial_entity_id,
          fe.name AS entity_name,
          copy.id AS copy_id,
          copy.status AS copy_status,
          copy.financial_entity_id AS copy_entity_id,
          fe_copy.name AS copy_entity_name,
          u_receiver.id AS receiver_id,
          u_receiver.name AS receiver_name,
          u_receiver.email AS receiver_email
       FROM purchases p
       JOIN financial_entities fe ON fe.id = p.financial_entity_id AND fe.user_id = $1
       JOIN purchases copy ON copy.shared_from_id = p.id AND copy.deleted = false
       LEFT JOIN financial_entities fe_copy ON fe_copy.id = copy.financial_entity_id
       JOIN users u_receiver ON u_receiver.id = copy.receiver_user_id
       WHERE p.deleted = false AND p.status = 'ACTIVE'
       ORDER BY p.created_at DESC`,
      [userId], true
    );
  }
}
