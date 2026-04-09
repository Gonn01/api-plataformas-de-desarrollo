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
                  'amount_per_quota', CASE WHEN g.number_of_quotas > 0 THEN g.amount::numeric / g.number_of_quotas ELSE g.amount END,
                  'payed_quotas', (SELECT COUNT(*) FROM purchases_movements WHERE purchase_id = g.id AND movement_type = 'PAYMENT'),
                  'currency_type', g.currency_type,
                  'type', g.type,
                  'fixed_expense', g.fixed_expense,
                  'created_at', g.created_at,
                  'last_payment_date', (SELECT MAX(payment_date) FROM purchases_movements WHERE purchase_id = g.id AND movement_type = 'PAYMENT'),
                  'categories', COALESCE(
                    (SELECT json_agg(json_build_object('id', uc.id, 'name', uc.name, 'color', uc.color))
                     FROM purchases_categories pc
                     JOIN user_categories uc ON uc.id = pc.category_id
                     WHERE pc.purchase_id = g.id AND uc.deleted = false),
                    '[]'::json
                  )
                )
              ) FILTER (WHERE g.id IS NOT NULL),
              '[]'::json
            ) AS gastos
            FROM financial_entities e
            LEFT JOIN purchases g
              ON g.financial_entity_id = e.id
              AND (g.fixed_expense = true OR (
                  SELECT COUNT(*) FROM purchases_movements WHERE purchase_id = g.id AND movement_type = 'PAYMENT'
              ) < g.number_of_quotas)
              AND g.deleted = false
            WHERE e.user_id = $1
              AND e.deleted = false
            GROUP BY e.id ORDER BY e.created_at DESC;
    `, [userId], true);
  }
}
