import { executeQuery } from "../db.js";

export class DashboardRepository {
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
