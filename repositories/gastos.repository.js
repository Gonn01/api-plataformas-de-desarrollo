import { executeQuery } from "../db.js";
import { Currency, ExpenseType } from "../utils/enums.js";

export class GastosRepository {
  async getById(id) {
    return await executeQuery(
      `SELECT p.*,
          (SELECT COUNT(*) FROM purchases_movements WHERE purchase_id = p.id AND movement_type = 'PAYMENT')::int AS payed_quotas,
          CASE WHEN p.number_of_quotas > 0 THEN p.amount::numeric / p.number_of_quotas ELSE p.amount END AS amount_per_quota,
          (SELECT payment_date FROM purchases_movements WHERE purchase_id = p.id AND movement_type = 'PAYMENT' ORDER BY payment_date ASC NULLS LAST LIMIT 1) AS first_quota_date,
          CASE WHEN p.fixed_expense = false AND (SELECT COUNT(*) FROM purchases_movements WHERE purchase_id = p.id AND movement_type = 'PAYMENT') >= p.number_of_quotas
               THEN (SELECT MAX(payment_date) FROM purchases_movements WHERE purchase_id = p.id AND movement_type = 'PAYMENT')
               ELSE NULL END AS finalization_date
       FROM purchases p
       WHERE p.id = $1 AND p.deleted = false`,
      [id], true
    );
  }

  async getGastosByEntidad(entidadId) {
    return await executeQuery(
      `SELECT p.*,
          (SELECT COUNT(*) FROM purchases_movements WHERE purchase_id = p.id AND movement_type = 'PAYMENT')::int AS payed_quotas,
          CASE WHEN p.number_of_quotas > 0 THEN p.amount::numeric / p.number_of_quotas ELSE p.amount END AS amount_per_quota,
          (SELECT payment_date FROM purchases_movements WHERE purchase_id = p.id AND movement_type = 'PAYMENT' ORDER BY payment_date ASC NULLS LAST LIMIT 1) AS first_quota_date,
          CASE WHEN p.fixed_expense = false AND (SELECT COUNT(*) FROM purchases_movements WHERE purchase_id = p.id AND movement_type = 'PAYMENT') >= p.number_of_quotas
               THEN (SELECT MAX(payment_date) FROM purchases_movements WHERE purchase_id = p.id AND movement_type = 'PAYMENT')
               ELSE NULL END AS finalization_date,
          COALESCE(
            (SELECT json_agg(json_build_object('id', c.id, 'name', c.name, 'color', c.color))
             FROM purchases_categories pc
             JOIN user_categories c ON c.id = pc.category_id
             WHERE pc.purchase_id = p.id),
            '[]'::json
          ) AS categories
       FROM purchases p
       WHERE p.financial_entity_id = $1 AND p.deleted = false
       ORDER BY p.created_at DESC`,
      [entidadId], true
    );
  }

  async pagarCuota(id) {
    return await executeQuery(
      `SELECT p.*,
          (SELECT COUNT(*) FROM purchases_movements WHERE purchase_id = p.id AND movement_type = 'PAYMENT')::int AS payed_quotas,
          CASE WHEN p.number_of_quotas > 0 THEN p.amount::numeric / p.number_of_quotas ELSE p.amount END AS amount_per_quota,
          (SELECT payment_date FROM purchases_movements WHERE purchase_id = p.id AND movement_type = 'PAYMENT' ORDER BY payment_date ASC NULLS LAST LIMIT 1) AS first_quota_date,
          CASE WHEN p.fixed_expense = false AND (SELECT COUNT(*) FROM purchases_movements WHERE purchase_id = p.id AND movement_type = 'PAYMENT') >= p.number_of_quotas
               THEN (SELECT MAX(payment_date) FROM purchases_movements WHERE purchase_id = p.id AND movement_type = 'PAYMENT')
               ELSE NULL END AS finalization_date
       FROM purchases p
       WHERE p.id = $1 AND p.deleted = false`,
      [id], true
    );
  }

  async pagarCuotasLote(ids) {
    const updated = [];
    for (const id of ids) {
      const result = await executeQuery(
        `SELECT p.*,
            (SELECT COUNT(*) FROM purchases_movements WHERE purchase_id = p.id AND movement_type = 'PAYMENT')::int AS payed_quotas,
            CASE WHEN p.number_of_quotas > 0 THEN p.amount::numeric / p.number_of_quotas ELSE p.amount END AS amount_per_quota,
            (SELECT payment_date FROM purchases_movements WHERE purchase_id = p.id AND movement_type = 'PAYMENT' ORDER BY payment_date ASC NULLS LAST LIMIT 1) AS first_quota_date,
            CASE WHEN p.fixed_expense = false AND (SELECT COUNT(*) FROM purchases_movements WHERE purchase_id = p.id AND movement_type = 'PAYMENT') >= p.number_of_quotas
                 THEN (SELECT MAX(payment_date) FROM purchases_movements WHERE purchase_id = p.id AND movement_type = 'PAYMENT')
                 ELSE NULL END AS finalization_date
         FROM purchases p
         WHERE p.id = $1 AND p.deleted = false`,
        [id], true
      );

      if (result.length > 0) {
        updated.push(result[0]);
      }
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
    type
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
        currency_type, fixed_expense, deleted, image_url, created_at, type
      )
      VALUES ($1,$2,$3,$4,$5,$6,false,$7,now(),$8)
      RETURNING *,
          0::int AS payed_quotas,
          CASE WHEN $4 > 0 THEN $3::numeric / $4 ELSE $3 END AS amount_per_quota,
          NULL::timestamptz AS first_quota_date,
          NULL::timestamptz AS finalization_date`,
      [
        financial_entity_id,
        name,
        amount,
        number_of_quotas,
        dbCurrency,
        fixed_expense || false,
        image_url || null,
        dbType,
      ], true
    );
  }
}
