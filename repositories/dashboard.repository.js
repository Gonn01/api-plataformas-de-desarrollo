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
                  'name', g.name,
                  'amount', g.amount,
                  'number_of_quotas', g.number_of_quotas,
                  'amount_per_quota', g.amount_per_quota,
                  'payed_quotas', g.payed_quotas,
                  'currency_type', g.currency_type,
                  'type', g.type,
                  'fixed_expense', g.fixed_expense
                )
              ) FILTER (WHERE g.id IS NOT NULL),
              '[]'::json
            ) AS gastos
            FROM financial_entities e
            LEFT JOIN purchases g 
              ON g.financial_entity_id = e.id 
              AND (g.fixed_expense = true OR g.payed_quotas < g.number_of_quotas)
              AND g.deleted = false
            WHERE e.user_id = $1 
              AND e.deleted = false
            GROUP BY e.id ORDER BY e.created_at DESC;
    `, [userId]);
  }
}
