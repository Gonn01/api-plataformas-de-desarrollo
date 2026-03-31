export class GastosService {
    constructor({ gastosRepository, movementsRepository }) {
        this.gastosRepository = gastosRepository;
        this.movementsRepository = movementsRepository;
    }

    async getById(id) {
        const row = await this.gastosRepository.getById(id);

        if (row.length === 0) {
            throw new Error("Gasto no encontrado");
        }
        const movements = await this.movementsRepository.getMovementsByGasto(id);
        row[0].movements = movements;
        return row[0];
    }

    async update(id, name, amount, image, fixed_expense) {
        const [row] = await this.gastosRepository.update(id, name, amount, image, fixed_expense);

        if (row.length === 0) {
            throw new Error("No se pudo actualizar (Gasto no existe)");
        }
        await this.movementsRepository.createGastoLog(id, "Gasto actualizado")
        return row;
    }

    async delete(id) {
        const row = await this.gastosRepository.delete(id);

        if (!row || row.length === 0) {
            throw new Error("Gasto no encontrado");
        }

        await this.movementsRepository.createGastoLog(id, "Gasto eliminado");

        return row[0];
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
        type,
        payed_quotas = 0
    ) {
        const amountPerQuota = number_of_quotas > 0 ? amount / number_of_quotas : amount;

        return this.gastosRepository.create({
            financial_entity_id,
            name,
            amount,
            amountPerQuota,
            number_of_quotas,
            payed_quotas,
            currency_type,
            first_quota_date,
            fixed_expense,
            image,
            type
        });
    }

    async pagarCuota(purchase_id) {
        const rows = await this.gastosRepository.getById(purchase_id);

        if (rows.length === 0) {
            throw new Error("Gasto no encontrado");
        }

        const updated = await this.gastosRepository.pagarCuota(purchase_id);

        await this.movementsRepository.createGastoLog(purchase_id, "Cuota pagada.");

        return updated;
    }

    async pagarCuotasLote(purchaseIds) {

        if (!Array.isArray(purchaseIds) || purchaseIds.length === 0) {
            throw new Error("La lista de IDs de compra es inválida.");
        }

        const logPromises = purchaseIds.map(element => {
            return this.movementsRepository.createGastoLog(
                element,
                `Cuota pagada por lote`
            );
        });

        await Promise.all(logPromises);

        return await this.gastosRepository.pagarCuotasLote(purchaseIds);
    }

    async obtenerMovementsPorGasto(gastoId) {
        return await this.movementsRepository.getMovementsByGasto(gastoId);
    }
}