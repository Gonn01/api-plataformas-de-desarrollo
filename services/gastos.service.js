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
        type,
        payed_quotas = 0
  ) {
    const num = Number(number_of_quotas) || 0;
    const amt = Number(amount) || 0;
    const amountPerQuota = num > 0 ? amt / num : amt;
    const safePayed = Number(payed_quotas) || 0;

    return this.gastosRepository.create(
        financial_entity_id, // $1
        name,                // $2
        amt,                 // $3
        amountPerQuota,      // $4
        num,                 // $5
        safePayed,           // $6
        currency_type,       // $7
        first_quota_date,    // $8
        fixed_expense,       // $9
        image,               // $10
        type                 // $11
    );
  }

    async pagarCuota(purchase_id) {
        const rows = await this.gastosRepository.getById(purchase_id);

        if (rows.length === 0) {
            throw new Error("Gasto no encontrado");
        }

        const updated = await this.gastosRepository.pagarCuota(purchase_id);

        await this.logsRepository.createGastoLog(purchase_id, "Cuota pagada.");

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