import { executeQuery } from "../db.js";

export class GastosRepository {
  async getById(id) {
    return await executeQuery(
      `SELECT * FROM purchases WHERE id = $1 AND deleted = false`,
      [id]
    );
  }

  async getGastosByEntidad(entidadId) {
    return await executeQuery(
      `SELECT 
                id,
                name,
                amount,
                amount_per_quota,
                number_of_quotas,
                payed_quotas,
                currency_type,
                fixed_expense,
                type,
                deleted
             FROM purchases
             WHERE financial_entity_id = $1 AND deleted = false
             ORDER BY created_at DESC`,
      [entidadId]
    );
  }

  async pagarCuota(id, newPayed, finalization) {
    return await executeQuery(
      `UPDATE purchases
             SET payed_quotas = $1, finalization_date = $2
             WHERE id = $3
             RETURNING *`,
      [newPayed, finalization, id]
    );
  }

  async pagarCuotasLote(ids) {
    const updated = [];
    for (const id of ids) {
      const result = await executeQuery(
        `UPDATE purchases
                 SET
                   payed_quotas = LEAST(payed_quotas + 1, number_of_quotas),
                     finalization_date = CASE
                       WHEN payed_quotas + 1 >= number_of_quotas THEN now()
                       ELSE finalization_date
                     END
                 WHERE id = $1
                 RETURNING
                   id, name, number_of_quotas, payed_quotas,
                   finalization_date, amount, amount_per_quota,
                   financial_entity_id, currency_type
                `,
        [id]
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
             RETURNING *`,
      [name, amount, image || null, fixed_expense || false, dbType, id]
    );
  }

  async delete(id) {
    return await executeQuery(
      `UPDATE purchases SET deleted = true WHERE id = $1 RETURNING id`,
      [id]
    );
  }

  async create(
    financial_entity_id,
    name,
    amount,
    amountPerQuota,
    number_of_quotas,
    currency_type,
    first_quota_date,
    fixed_expense,
    image,
    type
  ) {
    const dbType = type ? String(type).toUpperCase() : null;

    return await executeQuery(
      `INSERT INTO purchases (
                financial_entity_id, name, amount, amount_per_quota, number_of_quotas,
                payed_quotas, currency_type, first_quota_date, finalization_date,
                fixed_expense, deleted, image, created_at, type
            )
            VALUES ($1,$2,$3,$4,$5,0,$6,$7,NULL,$8,false,$9,now(),$10)
            RETURNING *`,
      [
        financial_entity_id,
        name,
        amount,
        amountPerQuota,
        number_of_quotas,
        currency_type,
        first_quota_date,
        fixed_expense || false,
        image || null,
        dbType,
      ],
      true
    );
  }
}
