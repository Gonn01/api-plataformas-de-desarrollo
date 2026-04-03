import { executeQuery } from "../db.js";

export class GastosRepository {
  async getById(id) {
    return await executeQuery(
      `SELECT p.*,
          (SELECT COUNT(*) FROM purchases_movements WHERE purchase_id = p.id AND movement_type = 'PAYMENT')::int AS payed_quotas,
          CASE WHEN p.number_of_quotas > 0 THEN p.amount::numeric / p.number_of_quotas ELSE p.amount END AS amount_per_quota
       FROM purchases p
       WHERE p.id = $1 AND p.deleted = false`,
      [id], true
    );
  }

  async getGastosByEntidad(entidadId) {
    return await executeQuery(
      `SELECT p.*,
          (SELECT COUNT(*) FROM purchases_movements WHERE purchase_id = p.id AND movement_type = 'PAYMENT')::int AS payed_quotas,
          CASE WHEN p.number_of_quotas > 0 THEN p.amount::numeric / p.number_of_quotas ELSE p.amount END AS amount_per_quota
       FROM purchases p
       WHERE p.financial_entity_id = $1 AND p.deleted = false
       ORDER BY p.created_at DESC`,
      [entidadId], true
    );
  }

  async pagarCuota(id) {
    return await executeQuery(
      `UPDATE purchases
       SET finalization_date = CASE
           WHEN fixed_expense = false AND (
               SELECT COUNT(*) FROM purchases_movements WHERE purchase_id = purchases.id AND movement_type = 'PAYMENT'
           ) >= number_of_quotas THEN now()
           ELSE finalization_date
       END,
       first_quota_date = CASE
           WHEN (
               SELECT COUNT(*) FROM purchases_movements WHERE purchase_id = purchases.id AND movement_type = 'PAYMENT'
           ) = 1 THEN now()
           ELSE first_quota_date
       END
       WHERE id = $1
       RETURNING *,
           (SELECT COUNT(*) FROM purchases_movements WHERE purchase_id = $1 AND movement_type = 'PAYMENT')::int AS payed_quotas,
           CASE WHEN number_of_quotas > 0 THEN amount::numeric / number_of_quotas ELSE amount END AS amount_per_quota`,
      [id], true
    );
  }

  async pagarCuotasLote(ids) {
    const updated = [];
    for (const id of ids) {
      const result = await executeQuery(
        `UPDATE purchases
         SET finalization_date = CASE
             WHEN fixed_expense = false AND (
                 SELECT COUNT(*) FROM purchases_movements WHERE purchase_id = purchases.id AND movement_type = 'PAYMENT'
             ) >= number_of_quotas THEN now()
             ELSE finalization_date
         END,
         first_quota_date = CASE
             WHEN (
                 SELECT COUNT(*) FROM purchases_movements WHERE purchase_id = purchases.id AND movement_type = 'PAYMENT'
             ) = 1 THEN now()
             ELSE first_quota_date
         END
         WHERE id = $1
         RETURNING id, name, number_of_quotas, financial_entity_id, currency_type, amount, finalization_date,
             (SELECT COUNT(*) FROM purchases_movements WHERE purchase_id = $1 AND movement_type = 'PAYMENT')::int AS payed_quotas,
             CASE WHEN number_of_quotas > 0 THEN amount::numeric / number_of_quotas ELSE amount END AS amount_per_quota`,
        [id], true
      );

      if (result.length > 0) {
        updated.push(result[0]);
      }
    }
    return updated;
  }

  async update(id, name, amount, image, fixed_expense, type) {
    const dbType = type ? String(type).toUpperCase() : null;
    return await executeQuery(
      `UPDATE purchases
       SET name = $1, amount = $2, image = $3, fixed_expense = $4, type = $5
       WHERE id = $6
       RETURNING *,
           (SELECT COUNT(*) FROM purchases_movements WHERE purchase_id = $6 AND movement_type = 'PAYMENT')::int AS payed_quotas,
           CASE WHEN number_of_quotas > 0 THEN amount::numeric / number_of_quotas ELSE amount END AS amount_per_quota`,
      [name, amount, image || null, fixed_expense || false, dbType, id], true
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
    first_quota_date,
    fixed_expense,
    image,
    type
  }) {
    const dbType = type ? String(type).toUpperCase() : null;

    return await executeQuery(
      `INSERT INTO purchases (
        financial_entity_id, name, amount, number_of_quotas,
        currency_type, first_quota_date, finalization_date,
        fixed_expense, deleted, image, created_at, type
      )
      VALUES ($1,$2,$3,$4,$5,$6,NULL,$7,false,$8,now(),$9)
      RETURNING *,
          0::int AS payed_quotas,
          CASE WHEN $4 > 0 THEN $3::numeric / $4 ELSE $3 END AS amount_per_quota`,
      [
        financial_entity_id,
        name,
        amount,
        number_of_quotas,
        currency_type,
        first_quota_date,
        fixed_expense || false,
        image || null,
        dbType,
      ], true
    );
  }
}
