import { MovementType } from "../utils/enums.js";

export class GastosService {
    constructor({ gastosRepository, movementsRepository, entidadesFinancierasRepository }) {
        this.gastosRepository = gastosRepository;
        this.movementsRepository = movementsRepository;
        this.entidadesFinancierasRepository = entidadesFinancierasRepository;
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
        type,
        userId,
        payed_quotas = 0
    ) {
        const entidad = await this.entidadesFinancierasRepository.getById(financial_entity_id, userId);
        if (!entidad.length) throw new Error("Entidad financiera no encontrada o eliminada");

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

        const gastoId = rows[0].id;
        const amountPerQuota = number_of_quotas > 0 ? amount / number_of_quotas : amount;

        const logPromises = [
            this.movementsRepository.createGastoLog(gastoId, MovementType.CREATION)
        ];

        for (let i = 0; i < payed_quotas; i++) {
            logPromises.push(
                this.movementsRepository.createGastoLog(gastoId, MovementType.PAYMENT, amountPerQuota, new Date())
            );
        }

        await Promise.all(logPromises);

        return rows;
    }

    async pagarCuota(purchase_id) {
        const rows = await this.gastosRepository.getById(purchase_id);

        if (rows.length === 0) {
            throw new Error("Gasto no encontrado");
        }

        await this.movementsRepository.createGastoLog(purchase_id, MovementType.PAYMENT, rows[0].amount_per_quota, new Date());

        const updated = await this.gastosRepository.pagarCuota(purchase_id);

        return updated;
    }

    async pagarCuotasLote(purchaseIds) {
        if (!Array.isArray(purchaseIds) || purchaseIds.length === 0) {
            throw new Error("La lista de IDs de compra es inválida.");
        }

        const paymentDate = new Date();
        const updated = [];
        const failed = [];

        for (const id of purchaseIds) {
            try {
                const rows = await this.gastosRepository.getById(id);

                if (rows.length === 0) {
                    failed.push({ id, reason: "Gasto no encontrado" });
                    continue;
                }

                const gasto = rows[0];

                if (!gasto.fixed_expense && gasto.payed_quotas >= gasto.number_of_quotas) {
                    failed.push({ id, reason: "Todas las cuotas ya están pagas" });
                    continue;
                }

                await this.movementsRepository.createGastoLog(id, MovementType.PAYMENT, gasto.amount_per_quota, paymentDate);
                const result = await this.gastosRepository.pagarCuota(id);
                updated.push(result[0]);
            } catch (err) {
                failed.push({ id, reason: err.message });
            }
        }

        return { updated, failed };
    }

    async obtenerMovementsPorGasto(gastoId) {
        return await this.movementsRepository.getMovementsByGasto(gastoId);
    }
}
