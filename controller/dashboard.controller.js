// controller/dashboard.controller.js
import { executeQuery } from "../db.js";

export class DashboardController {

  static async home(req, res) {
    try {
      const { user_id } = req.query;

      if (!user_id) {
        return res.status(400).json({ error: "Falta parámetro 'user_id'" });
      }

      // ==========================================================
      // 1) TRAER ENTIDADES DEL USUARIO
      // ==========================================================

      const entities = await executeQuery(
        `
      SELECT id, name
      FROM financial_entities
      WHERE user_id = $1
        AND deleted = false
      ORDER BY created_at DESC
      `,
        [user_id]
      );

      // ==========================================================
      // 2) TRAER GASTOS ACTIVOS DE TODAS LAS ENTIDADES DEL USUARIO
      // ==========================================================

      const activeExpenses = await executeQuery(
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
        [user_id]
      );

      // ==========================================================
      // 3) AGRUPAR GASTOS POR ENTIDAD
      // ==========================================================

      const entitiesWithExpenses = entities.map((fe) => ({
        id: fe.id,
        name: fe.name,
        gastos: activeExpenses.filter((g) => g.financial_entity_id === fe.id),
      }));

      // ==========================================================
      // 4) DEVOLVER RESULTADO
      // ==========================================================

      res.json({
        entities: entitiesWithExpenses,
      });

    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Error en el servidor" });
    }
  }


  static async crearGasto(req, res) {
    try {
      const {
        financial_entity_id,
        name,
        amount,
        number_of_quotas,
        currency_type,
        first_quota_date,
        fixed_expense,
        image
      } = req.body;

      if (!financial_entity_id || !name || !amount || !number_of_quotas) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
      }

      const amountPerQuota = Number(amount) / Number(number_of_quotas);

      const inserted = await executeQuery(
        `INSERT INTO purchases 
        (financial_entity_id, name, amount, amount_per_quota, number_of_quotas,
         payed_quotas, currency_type, first_quota_date, finalization_date,
         fixed_expense, deleted, image, created_at)
       VALUES ($1,$2,$3,$4,$5,0,$6,$7,NULL,$8,false,$9,now())
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
          image || null
        ]
      );

      res.status(201).json(inserted[0]);
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Error en el servidor" });
    }
  }

  static async pagarCuota(req, res) {
    try {
      const { purchase_id } = req.body;

      const rows = await executeQuery(
        `SELECT * FROM purchases WHERE id = $1 LIMIT 1`,
        [purchase_id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Gasto no encontrado" });
      }

      const purchase = rows[0];

      const newPayed = Number(purchase.payed_quotas) + 1;

      const finalization =
        newPayed >= Number(purchase.number_of_quotas) ? new Date() : null;

      const updated = await executeQuery(
        `UPDATE purchases
       SET payed_quotas = $1,
           finalization_date = $2
       WHERE id = $3
       RETURNING *`,
        [newPayed, finalization, purchase_id]
      );

      res.json(updated[0]);
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Error en el servidor" });
    }
  }


  static async pagarCuotasLote(req, res) {
    try {
      const { purchase_ids } = req.body;

      if (!Array.isArray(purchase_ids) || purchase_ids.length === 0) {
        return res.status(400).json({
          error: "Debe enviar 'purchase_ids' como array no vacío",
        });
      }

      const updated = [];

      for (const pid of purchase_ids) {
        const rows = await executeQuery(
          `
          UPDATE purchases
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
          [pid]
        );

        if (rows.length > 0) updated.push(rows[0]);
      }

      res.json({
        message: "Cuotas pagadas en lote",
        updated,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Error en el servidor" });
    }
  }
}

