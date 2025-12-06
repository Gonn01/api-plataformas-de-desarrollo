export class GastosService {
    constructor({ gastosRepository, logsRepository }) {
        this.gastosRepository = gastosRepository;
        this.logsRepository = logsRepository;
    }

    async getById(id) {
        const [row] = await this.gastosRepository.getById(id);

        if (row.length === 0) {
            throw new Error("Gasto no encontrado");
        }
        return row;
    }

    async update(id, name, amount, image, fixed_expense) {
        const [row] = await this.gastosRepository.update(id, name, amount, image, fixed_expense);

        if (row.length === 0) {
            throw new Error("No se pudo actualizar (Gasto no existe)");
        }
        await this.logsRepository.createGastoLog(id, "Gasto actualizado")
        return row;
    }

    async delete(id) {
        const [row] = await this.gastosService.delete(id);

        if (row.length === 0) {
            throw new Error("Gasto no encontrado");
        }

        await this.logsRepository.createGastoLog(id, "Gasto eliminado")

        return row;
    }

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