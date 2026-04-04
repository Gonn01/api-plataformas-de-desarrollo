import { MovementType } from "../utils/enums.js";

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

    async update(id, name, amount, image_url, fixed_expense, type) {
        const [row] = await this.gastosRepository.update(id, name, amount, image_url, fixed_expense, type);

        if (row.length === 0) {
            throw new Error("No se pudo actualizar (Gasto no existe)");
        }
        return row;
    }

    async delete(id) {
        const row = await this.gastosRepository.delete(id);

        if (!row || row.length === 0) {
            throw new Error("Gasto no encontrado");
        }

        await this.logsRepository.createGastoLog(id, MovementType.DELETE);

        return row[0];
    }

    async crearGasto(
        financial_entity_id,
        name,
        amount,
        number_of_quotas,
        currency_type,
        fixed_expense,
        image_url,
        type
    ) {
        const rows = await this.gastosRepository.create({
            financial_entity_id,
            name,
            amount,
            number_of_quotas,
            currency_type,
            fixed_expense,
            image_url,
            type
        });

        await this.logsRepository.createGastoLog(rows[0].id, MovementType.CREATION);

        return rows;
    }

    async pagarCuota(purchase_id) {
        const rows = await this.gastosRepository.getById(purchase_id);

        if (rows.length === 0) {
            throw new Error("Gasto no encontrado");
        }

        await this.logsRepository.createGastoLog(purchase_id, MovementType.PAYMENT, rows[0].amount_per_quota, new Date());

        const updated = await this.gastosRepository.pagarCuota(purchase_id);

        return updated;
    }

    async pagarCuotasLote(purchaseIds) {

        if (!Array.isArray(purchaseIds) || purchaseIds.length === 0) {
            throw new Error("La lista de IDs de compra es inválida.");
        }

        const paymentDate = new Date();
        const logPromises = purchaseIds.map(id =>
            this.logsRepository.createGastoLog(id, MovementType.PAYMENT, null, paymentDate)
        );
        await Promise.all(logPromises);

        return await this.gastosRepository.pagarCuotasLote(purchaseIds);
    }

    async obtenerMovementsPorGasto(gastoId) {
        return await this.movementsRepository.getMovementsByGasto(gastoId);
    }
}
