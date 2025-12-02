import { executeQuery } from "../db.js";

export class DashboardRepository {
  async getHomeData(userId) {
    return await executeQuery(`
      SELECT
              e.id,
              e.name,
              COALESCE(
              json_agg(
                json_build_object(
                  'id', g.id,
                  'title', g.name,
                  'amount', g.amount,
                  'number_of_quotas', g.number_of_quotas,
                  'payed_quotas', g.payed_quotas,
                  'fixed_expense', g.fixed_expense
                )
              ) FILTER (WHERE g.id IS NOT NULL),
              '[]'::json
            ) AS gastos
            FROM financial_entities e
            LEFT JOIN purchases g 
              ON g.financial_entity_id = e.id 
              AND g.deleted = false
            WHERE e.user_id = $1 
              AND e.deleted = false
            GROUP BY e.id;
    `, [userId]);
  }
  async getActiveGastos(userId) {
    return await executeQuery(
      `
      SELECT
        p.id,
        p.name,
        p.amount,
        p.amount_per_quota,
        p.number_of_quotas,
        p.payed_quotas,
        p.fixed_expense,
        p.currency_type,
        p.first_quota_date,
        p.finalization_date,
        p.financial_entity_id
      FROM purchases p
      JOIN financial_entities fe ON fe.id = p.financial_entity_id
      WHERE fe.user_id = $1
        AND fe.deleted = false
        AND p.deleted = false
        AND (
             p.payed_quotas < p.number_of_quotas
             OR p.fixed_expense = true
        )
      ORDER BY p.first_quota_date ASC NULLS LAST
      `,
      [userId]
    );
  }
}
