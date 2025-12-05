export class DashboardService {
    constructor({
        dashboardRepository,
        gastosRepository,
        entidadesFinancierasRepository,
        logsRepository
    }) {
        this.dashboardRepository = dashboardRepository;
        this.gastosRepository = gastosRepository;
        this.entidadesFinancierasRepository = entidadesFinancierasRepository;
        this.logsRepository = logsRepository;
    }

    async getHomeData(userId) {
        return await this.dashboardRepository.getHomeData(userId);
    }

    /*     async crearGasto(financial_entity_id, name, amount, number_of_quotas, currency_type, first_quota_date, fixed_expense, image, type) {
            const amountPerQuota = Number(amount) / Number(number_of_quotas);
    
            const inserted = await this.gastosRepository.create(financial_entity_id, name, amount, amountPerQuota, number_of_quotas, currency_type, first_quota_date, fixed_expense, image);
            await this.logsRepository.createGastoLog(inserted.id, `Gasto "${name}" creado con monto total ${amount} y ${number_of_quotas} cuotas de ${amountPerQuota} cada una.`);
            return inserted;
        } */

    async crearGasto(
        financial_entity_id,
        name,
        amount,
        number_of_quotas,
        currency_type,
        first_quota_date,
        fixed_expense,
        image,
        type
    ) {

        // el temita del debo
        const typeFormatted = type ? type.toUpperCase() : null;

        const amountPerQuota = Number(amount) / Number(number_of_quotas);

        const inserted = await this.gastosRepository.create(
            financial_entity_id,
            name,
            amount,
            amountPerQuota,
            number_of_quotas,
            currency_type,
            first_quota_date ?? null,
            fixed_expense,
            image ?? null,
            typeFormatted
        );

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

        await this.logsRepository.createGastoLog(purchase_id, "Cuota pagada. Total de cuotas pagadas: " + newPayed);

        return updated;
    }

    // dashboard.service.js

    // ... (otros métodos)

    async pagarCuotasLote(purchaseIds) {

        if (!Array.isArray(purchaseIds) || purchaseIds.length === 0) {
            throw new Error("La lista de IDs de compra es inválida.");
        }

        const logPromises = purchaseIds.map(element => {
            return this.logsRepository.createGastoLog(
                element,
                `Cuota pagada por lote`
            );
        });

        await Promise.all(logPromises);

        return await this.gastosRepository.pagarCuotasLote(purchaseIds);
    }
}