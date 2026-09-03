import { MovementType, ExpenseStatus } from "../utils/enums.js";
import { triggerCompartidos } from "../utils/pusher.js";

export class CompartidosService {
    constructor({ gastosRepository, entidadesFinancierasRepository, movementsRepository }) {
        this.gastosRepository = gastosRepository;
        this.entidadesFinancierasRepository = entidadesFinancierasRepository;
        this.movementsRepository = movementsRepository;
    }

    async getCompartidos(userId) {
        const [recibidos, emitidos, pagosRows] = await Promise.all([
            this.gastosRepository.getCompartidosRecibidos(userId),
            this.gastosRepository.getCompartidosEmitidos(userId),
            this.gastosRepository.getPagosCompartidos(userId),
        ]);

        const porConfirmar = [];
        const esperando = [];
        for (const r of pagosRows) {
            if (String(r.created_by_user_id) === String(userId)) esperando.push(r);
            else porConfirmar.push(r);
        }

        return { recibidos, emitidos, pagos: { porConfirmar, esperando } };
    }

    async #assertConfirmerDePago(pend, userId) {
        if (String(pend.created_by_user_id) === String(userId)) {
            throw new Error("No autorizado");
        }
        const [sibling] = await this.gastosRepository.getSharedSibling(pend.purchase_id);
        if (!sibling || String(sibling.counterparty_user_id) !== String(userId)) {
            throw new Error("No autorizado");
        }
    }

    async confirmarPago(movementId, userId) {
        const [pend] = await this.movementsRepository.getPendingPaymentById(movementId);
        if (!pend) throw new Error("Pago pendiente no encontrado");

        await this.#assertConfirmerDePago(pend, userId);

        const [confirmed] = await this.movementsRepository.confirmPendingPayment(movementId);
        await this.gastosRepository.clearFavoriteIfFinalized(pend.purchase_id);
        const [actor] = await this.gastosRepository.getUserName(userId);
        await triggerCompartidos(pend.created_by_user_id, 'pago.confirmado', {
            purchaseId: pend.purchase_id,
            actorName: actor?.name ?? null,
        });

        return confirmed;
    }

    async rechazarPago(movementId, userId) {
        const [pend] = await this.movementsRepository.getPendingPaymentById(movementId);
        if (!pend) throw new Error("Pago pendiente no encontrado");

        await this.#assertConfirmerDePago(pend, userId);

        const [deleted] = await this.movementsRepository.deletePendingPayment(movementId);
        const [actor] = await this.gastosRepository.getUserName(userId);
        await triggerCompartidos(pend.created_by_user_id, 'pago.rechazado', {
            purchaseId: pend.purchase_id,
            actorName: actor?.name ?? null,
        });

        return deleted;
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

            const senderRows = await this.gastosRepository.getEntityOwnerByPurchaseId(gasto.shared_from_id);
            if (senderRows.length) {
                await this.entidadesFinancierasRepository.vincularUsuario(entityId, userId, senderRows[0].user_id);
            }
        }

        if (!entityId) throw new Error("Debe seleccionar una entidad o proporcionar un nombre para crear una nueva");

        const entidad = await this.entidadesFinancierasRepository.getById(entityId, userId);
        if (!entidad.length) throw new Error("Entidad no encontrada o no pertenece al usuario");

        const [[updated], notifRows] = await Promise.all([
            this.gastosRepository.aprobarGasto(gastoId, entityId),
            this.gastosRepository.getApprovalNotificationData(gastoId),
        ]);

        const notif = notifRows[0];

        await Promise.all([
            this.gastosRepository.updateStatus(gasto.shared_from_id, ExpenseStatus.ACTIVE),
            this.movementsRepository.createGastoLog(gastoId, MovementType.CREATION),
            notif && triggerCompartidos(notif.sender_user_id, 'compartido.aprobado', {
                gastoId,
                entityId: notif.sender_entity_id,
                receiverName: notif.receiver_name,
                gastoName: notif.gasto_name,
            }),
        ]);

        return updated;
    }

    async rechazar(gastoId, userId) {
        const rows = await this.gastosRepository.getById(gastoId);
        if (!rows.length) throw new Error("Gasto no encontrado");

        const gasto = rows[0];
        if (String(gasto.receiver_user_id) !== String(userId)) throw new Error("No autorizado");
        if (gasto.status !== ExpenseStatus.PENDING_APPROVAL) throw new Error("El gasto no está pendiente de aprobación");

        const [[updated], senderRows] = await Promise.all([
            this.gastosRepository.updateStatus(gastoId, ExpenseStatus.REJECTED),
            this.gastosRepository.getEntityOwnerByPurchaseId(gasto.shared_from_id),
        ]);

        await Promise.all([
            this.gastosRepository.updateStatus(gasto.shared_from_id, ExpenseStatus.REJECTED),
            senderRows.length && triggerCompartidos(senderRows[0].user_id, 'compartido.rechazado', { gastoId }),
        ]);

        return updated;
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

        const [[updated]] = await Promise.all([
            this.gastosRepository.updateStatus(copy.id, ExpenseStatus.PENDING_APPROVAL),
            this.gastosRepository.updateStatus(gastoId, ExpenseStatus.PENDING_APPROVAL),
            triggerCompartidos(copy.receiver_user_id, 'compartido.nuevo', { gastoId }),
        ]);

        return updated;
    }
}
