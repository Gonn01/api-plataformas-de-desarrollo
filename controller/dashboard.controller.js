import { logRed } from "../utils/logs_custom.js";

export class DashboardController {
  constructor(dashboardRepository, gastosRepository, entidadesFinancierasRepository) {
    this.dashboardRepository = dashboardRepository;
    this.gastosRepository = gastosRepository;
    this.entidadesFinancierasRepository = entidadesFinancierasRepository;
  }

  home = async (req, res) => {
    try {
      const { userId } = req.session;

      const entities = await this.entidadesFinancierasRepository.listar(userId);

      const activeExpenses = await this.dashboardRepository.getActiveGastos(userId);

      const entitiesWithExpenses = entities.map((fe) => ({
        id: fe.id,
        name: fe.name,
        gastos: activeExpenses.filter((g) => g.financial_entity_id === fe.id),
      }));

      res.json({
        entities: entitiesWithExpenses,
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
        image
      } = req.body;

      if (!financial_entity_id || !name || !amount || !number_of_quotas) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
      }

      const amountPerQuota = Number(amount) / Number(number_of_quotas);

      const inserted = await this.gastosRepository.create(financial_entity_id, name, amount, amountPerQuota, number_of_quotas, currency_type, first_quota_date, fixed_expense, image);

      res.status(201).json(inserted[0]);
    } catch (err) {
      logRed(err);
      res.status(500).json({ error: "Error en el servidor" });
    }
  }

  pagarCuota = async (req, res) => {
    try {
      const { purchase_id } = req.body;

      const rows = await this.gastosRepository.getById(purchase_id);

      if (rows.length === 0) {
        return res.status(404).json({ error: "Gasto no encontrado" });
      }

      const purchase = rows[0];

      const newPayed = Number(purchase.payed_quotas) + 1;

      const finalization =
        newPayed >= Number(purchase.number_of_quotas) ? new Date() : null;

      const updated = await this.gastosRepository.pagarCuota(
        purchase_id,
        newPayed,
        finalization
      );

      res.json(updated[0]);
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

      const updated = await this.gastosRepository.pagarCuotasLote(purchase_ids);

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

