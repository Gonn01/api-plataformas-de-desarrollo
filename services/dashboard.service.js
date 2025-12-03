export class DashboardService {
    constructor(dashboardRepository, gastosRepository, entidadesFinancierasRepository) {
        this.dashboardRepository = dashboardRepository;
        this.gastosRepository = gastosRepository;
        this.entidadesFinancierasRepository = entidadesFinancierasRepository;
    }

    async getHomeData(userId) {
        return await this.dashboardRepository.getHomeData(userId);
    }

    async crearGasto(financial_entity_id, name, amount, number_of_quotas, currency_type, first_quota_date, fixed_expense, image, type) {
        const amountPerQuota = Number(amount) / Number(number_of_quotas);

        const inserted = await this.gastosRepository.create(financial_entity_id, name, amount, amountPerQuota, number_of_quotas, currency_type, first_quota_date ?? null, fixed_expense, image ?? null, type);
        return inserted;
    }

    async pagarCuota(purchase_id) {
        const rows = await this.gastosRepository.getById(purchase_id);

        if (rows.length === 0) {
            throw new Error("Gasto no encontrado");
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

        return updated;
    }

    async pagarCuotasLote(purchaseIds) {
        return await this.gastosRepository.pagarCuotasLote(purchaseIds);
    }
}