import { logRed } from "../utils/logs_custom.js";

export class DashboardController {
  constructor(dashboardService) {
    this.dashboardService = dashboardService;
  }

  home = async (req, res) => {
    try {
      const { userId } = req.session;

      const response = await this.dashboardService.getHomeData(userId);

      res.json({
        message: "Datos del dashboard obtenidos con éxito",
        data: response
      });
    } catch (err) {
      logRed(err);
      res.status(500).json({ error: "Error en el servidor" });
    }
  }

  crearGasto = async (req, res) => {
    try {
      const {
        financial_entity_id,
        name,
        amount,
        number_of_quotas,
        currency_type,
        first_quota_date,
        fixed_expense,
        image,
        type
      } = req.body;

      if (!financial_entity_id || !name || !amount || !number_of_quotas) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
      }

      const inserted = await this.dashboardService.crearGasto(
        financial_entity_id,
        name,
        amount,
        number_of_quotas,
        currency_type,
        first_quota_date,
        fixed_expense,
        image,
        type
      );

      res.status(201).json({
        message: "Gasto creado con éxito",
        data: inserted[0]
      });
    } catch (err) {
      logRed(err);
      res.status(500).json({ error: "Error en el servidor" });
    }
  }

  pagarCuota = async (req, res) => {
    try {
      const { purchase_id } = req.body;

      const updated = await this.dashboardService.pagarCuota(purchase_id);

      res.json({
        message: "Cuota pagada con éxito",
        data: updated[0]
      });
    } catch (err) {
      logRed(err);
      res.status(500).json({ error: "Error en el servidor" });
    }
  }

  pagarCuotasLote = async (req, res) => {
    try {
      const { purchase_ids } = req.body;

      if (!Array.isArray(purchase_ids) || purchase_ids.length === 0) {
        return res.status(400).json({
          error: "Debe enviar 'purchase_ids' como array no vacío",
        });
      }

      const updated = await this.dashboardService.pagarCuotasLote(purchase_ids);

      res.json({
        message: "Cuotas pagadas en lote",
        updated,
      });
    } catch (err) {
      logRed(err);
      res.status(500).json({ error: "Error en el servidor" });
    }
  }
}

