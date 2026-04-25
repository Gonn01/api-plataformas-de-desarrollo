import { MovementType, ExpenseStatus } from "../utils/enums.js";

export class CompartidosService {
    constructor({ gastosRepository, entidadesFinancierasRepository, movementsRepository }) {
        this.gastosRepository = gastosRepository;
        this.entidadesFinancierasRepository = entidadesFinancierasRepository;
        this.movementsRepository = movementsRepository;
    }

    async getCompartidos(userId) {
        const [recibidos, emitidos] = await Promise.all([
            this.gastosRepository.getCompartidosRecibidos(userId),
            this.gastosRepository.getCompartidosEmitidos(userId),
        ]);
        return { recibidos, emitidos };
    }

    async aprobar(gastoId, userId, financialEntityId, newEntityName) {
        const rows = await this.gastosRepository.getById(gastoId);
        if (!rows.length) throw new Error("Gasto no encontrado");

        const gasto = rows[0];
        if (String(gasto.receiver_user_id) !== String(userId)) throw new Error("No autorizado");
        if (gasto.status !== ExpenseStatus.PENDING_APPROVAL) throw new Error("El gasto no está pendiente de aprobación");

        let entityId = financialEntityId ?? null;

        if (!entityId && newEntityName) {
            const [newEntity] = await this.entidadesFinancierasRepository.create(newEntityName, userId);
            await this.movementsRepository.createEntidadLog(newEntity.id, MovementType.CREATION);
            entityId = newEntity.id;
        }

        if (!entityId) throw new Error("Debe seleccionar una entidad o proporcionar un nombre para crear una nueva");

        const entidad = await this.entidadesFinancierasRepository.getById(entityId, userId);
        if (!entidad.length) throw new Error("Entidad no encontrada o no pertenece al usuario");

        const [updated] = await Promise.all([
            this.gastosRepository.aprobarGasto(gastoId, entityId),
            this.gastosRepository.updateStatus(gasto.shared_from_id, ExpenseStatus.ACTIVE),
            this.movementsRepository.createGastoLog(gastoId, MovementType.CREATION),
        ]);

        return updated[0];
    }

    async rechazar(gastoId, userId) {
        const rows = await this.gastosRepository.getById(gastoId);
        if (!rows.length) throw new Error("Gasto no encontrado");

        const gasto = rows[0];
        if (String(gasto.receiver_user_id) !== String(userId)) throw new Error("No autorizado");
        if (gasto.status !== ExpenseStatus.PENDING_APPROVAL) throw new Error("El gasto no está pendiente de aprobación");

        const [updated] = await Promise.all([
            this.gastosRepository.updateStatus(gastoId, ExpenseStatus.REJECTED),
            this.gastosRepository.updateStatus(gasto.shared_from_id, ExpenseStatus.REJECTED),
        ]);
        return updated[0];
    }

    async reintentar(gastoId, userId) {
        const originalRows = await this.gastosRepository.getById(gastoId);
        if (!originalRows.length) throw new Error("Gasto no encontrado");

        const original = originalRows[0];

        const entidad = await this.entidadesFinancierasRepository.getById(original.financial_entity_id, userId);
        if (!entidad.length) throw new Error("No autorizado");

        const copyRows = await this.gastosRepository.getSharedCopyByOriginalId(gastoId);
        if (!copyRows.length) throw new Error("No hay gasto compartido asociado");

        const copy = copyRows[0];
        if (copy.status !== ExpenseStatus.REJECTED) throw new Error("El gasto compartido no está rechazado");

        const [updated] = await Promise.all([
            this.gastosRepository.updateStatus(copy.id, ExpenseStatus.PENDING_APPROVAL),
            this.gastosRepository.updateStatus(gastoId, ExpenseStatus.PENDING_APPROVAL),
        ]);
        return updated[0];
    }
}
