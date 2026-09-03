import { MovementType, ExpenseStatus, ExpenseType } from "../utils/enums.js";
import { triggerCompartidos } from "../utils/pusher.js";

export class GastosService {
    constructor({ gastosRepository, movementsRepository, entidadesFinancierasRepository, categoriasRepository, reconcileRepository }) {
        this.gastosRepository = gastosRepository;
        this.movementsRepository = movementsRepository;
        this.entidadesFinancierasRepository = entidadesFinancierasRepository;
        this.categoriasRepository = categoriasRepository;
        this.reconcileRepository = reconcileRepository;
    }

    // "Modo hacer cuentas": no se puede registrar un pago si el usuario
    // no tiene una sesión de cuentas abierta. Devuelve la sesión abierta.
    async requireReconcileSession(userId) {
        if (!this.reconcileRepository) return null;
        if (!userId) {
            const err = new Error("RECONCILE_REQUIRED");
            err.code = "RECONCILE_REQUIRED";
            throw err;
        }
        const session = await this.reconcileRepository.getOpenSession(userId);
        if (!session) {
            const err = new Error("RECONCILE_REQUIRED");
            err.code = "RECONCILE_REQUIRED";
            throw err;
        }
        return session;
    }

    async getById(id) {
        const row = await this.gastosRepository.getById(id);

        if (row.length === 0) {
            throw new Error("Gasto no encontrado");
        }

        const [movements, categories] = await Promise.all([
            this.movementsRepository.getMovementsByGasto(id),
            this.categoriasRepository.getCategoriasByGasto(id),
        ]);

        row[0].movements = movements;
        row[0].categories = categories;
        return row[0];
    }

    async update(id, name, amount, image_url, fixed_expense, type, category_ids, payed_quotas, apply_to_linked = false) {
        const current = await this.gastosRepository.getById(id);
        if (!current.length) throw new Error("No se pudo actualizar (Gasto no existe)");

        const [row] = await this.gastosRepository.update(id, name, amount, image_url, fixed_expense, type);

        if (row.length === 0) {
            throw new Error("No se pudo actualizar (Gasto no existe)");
        }

        if (payed_quotas !== undefined && !fixed_expense) {
            const currentPaid = current[0].payed_quotas;
            if (payed_quotas === 1 && currentPaid === 0) {
                await this.movementsRepository.createGastoLog(id, MovementType.PAYMENT, row.amount_per_quota ?? amount, new Date());
            } else if (payed_quotas === 0 && currentPaid > 0) {
                await this.movementsRepository.deletePayments(id);
            }
        }

        if (Array.isArray(category_ids)) {
            await this.categoriasRepository.setCategoriasForGasto(id, category_ids);
        }

        // Propagar cambios al movimiento espejo (nombre / monto / imagen / gasto fijo
        // y categorías). El tipo del espejo se mantiene opuesto al del original.
        const linkedId = current[0].linked_purchase_id;
        if (apply_to_linked && linkedId) {
            const oppositeType = String(type).toUpperCase() === ExpenseType.INGRESO
                ? ExpenseType.EGRESO
                : ExpenseType.INGRESO;
            await this.gastosRepository.update(linkedId, name, amount, image_url, fixed_expense, oppositeType);
            if (Array.isArray(category_ids)) {
                await this.categoriasRepository.setCategoriasForGasto(linkedId, category_ids);
            }
        }

        return row;
    }

    async delete(id, delete_linked = false) {
        const current = await this.gastosRepository.getById(id);
        const linkedId = current[0]?.linked_purchase_id;

        const row = await this.gastosRepository.delete(id);

        if (!row || row.length === 0) {
            throw new Error("Gasto no encontrado");
        }

        if (linkedId) {
            if (delete_linked) {
                await this.gastosRepository.delete(linkedId);
            } else {
                // Rompemos el vínculo para no dejar el espejo apuntando a una fila borrada.
                await this.gastosRepository.unlink(id);
            }
        }

        return row[0];
    }

    // Crea una compra + su log de CREATION + un log de PAYMENT por cada cuota
    // pagada + asocia categorías. Devuelve las rows de la compra creada.
    async #crearCompraConLogs({
        financial_entity_id,
        name,
        amount,
        number_of_quotas,
        currency_type,
        fixed_expense,
        image_url,
        type,
        status,
        payed_quotas = 0,
        category_ids = [],
        linked_purchase_id = null,
    }) {
        const rows = await this.gastosRepository.create({
            financial_entity_id,
            name,
            amount,
            number_of_quotas,
            currency_type,
            fixed_expense,
            image_url,
            type,
            status,
            linked_purchase_id,
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

        if (category_ids?.length) {
            await this.categoriasRepository.setCategoriasForGasto(gastoId, category_ids);
        }

        rows[0].categories = await this.categoriasRepository.getCategoriasByGasto(gastoId);

        return rows;
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
        payed_quotas = 0,
        category_ids = [],
        payment_entity_id = null,
        postponed = false
    ) {
        const entidad = await this.entidadesFinancierasRepository.getById(financial_entity_id, userId);
        if (!entidad.length) throw new Error("Entidad financiera no encontrada o eliminada");

        // "Pagar con otra entidad": validamos la entidad de pago antes de crear nada.
        const usaEntidadPago = payment_entity_id && String(payment_entity_id) !== String(financial_entity_id);
        if (usaEntidadPago) {
            const entidadPago = await this.entidadesFinancierasRepository.getById(payment_entity_id, userId);
            if (!entidadPago.length) throw new Error("Entidad de pago no encontrada o eliminada");
        }

        const rows = await this.#crearCompraConLogs({
            financial_entity_id,
            name,
            amount,
            number_of_quotas,
            currency_type,
            fixed_expense,
            image_url,
            type,
            status: entidad[0].linked_user_id ? ExpenseStatus.PENDING_APPROVAL : ExpenseStatus.ACTIVE,
            payed_quotas,
            category_ids,
        });

        const gastoId = rows[0].id;

        // Si la entidad tiene un usuario vinculado, crear la copia pendiente para ese usuario
        if (entidad[0].linked_user_id) {
            await triggerCompartidos(entidad[0].linked_user_id, 'compartido.nuevo', { gastoId });
            const sharedRows = await this.gastosRepository.create({
                financial_entity_id: null,
                name,
                amount,
                number_of_quotas,
                currency_type,
                fixed_expense,
                image_url,
                type,
                status: ExpenseStatus.PENDING_APPROVAL,
                shared_from_id: gastoId,
                receiver_user_id: entidad[0].linked_user_id,
            });
            await this.movementsRepository.createGastoLog(sharedRows[0].id, MovementType.CREATION);
        }

        // Movimiento espejo en la entidad de pago: copia casi exacta del original
        // (mismas cuotas, cuotas pagadas y flag de gasto fijo), con el tipo opuesto.
        // Siempre es una creación normal (ACTIVE, sin copia compartida).
        if (usaEntidadPago) {
            const oppositeType = String(type).toUpperCase() === ExpenseType.INGRESO
                ? ExpenseType.EGRESO
                : ExpenseType.INGRESO;

            const mirror = await this.#crearCompraConLogs({
                financial_entity_id: payment_entity_id,
                name,
                amount,
                number_of_quotas,
                currency_type,
                fixed_expense,
                image_url,
                type: oppositeType,
                status: ExpenseStatus.ACTIVE,
                payed_quotas,
                category_ids,
                linked_purchase_id: gastoId,
            });

            await this.gastosRepository.linkPurchases(gastoId, mirror[0].id);
            rows[0].linked_purchase_id = mirror[0].id;
        }

        // Postergar: el gasto no entra en la sesión de cuentas actual/próxima.
        if (postponed) {
            await this.gastosRepository.setPostponed(gastoId, true);
            rows[0].is_postponed = true;
        }

        return rows;
    }

    async postergarGasto(id, userId, postponed) {
        const current = await this.gastosRepository.getById(id);
        if (!current.length) throw new Error("Gasto no encontrado");

        const entidad = await this.entidadesFinancierasRepository.getById(
            current[0].financial_entity_id,
            userId,
        );
        if (!entidad.length) throw new Error("No autorizado");

        const [updated] = await this.gastosRepository.setPostponed(id, Boolean(postponed));
        return updated;
    }

    async marcarFavorito(id, userId, favorite) {
        const current = await this.gastosRepository.getById(id);
        if (!current.length) throw new Error("Gasto no encontrado");

        const entidad = await this.entidadesFinancierasRepository.getById(
            current[0].financial_entity_id,
            userId,
        );
        if (!entidad.length) throw new Error("No autorizado");

        const [updated] = await this.gastosRepository.setFavorite(id, Boolean(favorite));
        return updated;
    }

    async actualizarCategorias(gastoId, categoryIds) {
        await this.categoriasRepository.setCategoriasForGasto(gastoId, categoryIds);
        return await this.categoriasRepository.getCategoriasByGasto(gastoId);
    }

    // "Modo hacer cuentas" diferido: pagar una cuota NO registra el pago en el
    // momento. Solo marca el gasto en la sesión abierta; el pago real se efectúa
    // al cerrar la sesión (ver ReconcileService.finishSession -> efectuarPago).
    async pagarCuota(purchase_id, userId) {
        const session = await this.requireReconcileSession(userId);

        const rows = await this.gastosRepository.getById(purchase_id);

        if (rows.length === 0) {
            throw new Error("Gasto no encontrado");
        }

        if (rows[0].is_postponed) {
            throw new Error("GASTO_POSTERGADO");
        }

        await this.reconcileRepository.upsertItem(session.id, purchase_id, false);

        return rows;
    }

    /**
     * Efectúa el pago real de una cuota: registra el movimiento PAYMENT (o
     * PENDING_PAYMENT si el gasto es compartido) y limpia el favorito si quedó
     * saldado. Lo usa ReconcileService al cerrar la sesión de cuentas.
     */
    async efectuarPago(gasto, userId, paymentDate = new Date()) {
        const result = await this.#registrarPagoOPendiente(gasto, userId, paymentDate);
        await this.gastosRepository.clearFavoriteIfFinalized(gasto.id);
        return result;
    }

    /**
     * Registra el pago de una cuota. Si el gasto está compartido con otro usuario
     * (par original <-> copia, ambos activos), el pago queda como PENDING_PAYMENT
     * hasta que la otra persona lo confirme; si no, se aplica de una.
     */
    async #registrarPagoOPendiente(gasto, userId, paymentDate) {
        const [sibling] = await this.gastosRepository.getSharedSibling(gasto.id);

        const esCompartido =
            sibling &&
            sibling.counterparty_user_id &&
            String(sibling.counterparty_user_id) !== String(userId);

        if (esCompartido) {
            const yaCubierto =
                !gasto.fixed_expense &&
                (Number(gasto.payed_quotas) || 0) + (Number(gasto.pending_quotas) || 0) >=
                    Number(gasto.number_of_quotas);

            if (yaCubierto) return { pending: true, skipped: true };

            await this.movementsRepository.createGastoLog(
                gasto.id, MovementType.PENDING_PAYMENT, gasto.amount_per_quota, paymentDate, userId,
            );
            await triggerCompartidos(sibling.counterparty_user_id, 'pago.pendiente', {
                purchaseId: gasto.id,
            });
            return { pending: true };
        }

        await this.movementsRepository.createGastoLog(
            gasto.id, MovementType.PAYMENT, gasto.amount_per_quota, paymentDate,
        );
        return { pending: false };
    }

    async refundCuota(purchase_id) {
        const rows = await this.gastosRepository.getById(purchase_id);

        if (rows.length === 0) throw new Error("Gasto no encontrado");
        if (rows[0].payed_quotas === 0) throw new Error("No hay cuotas pagadas para revertir");

        const deleted = await this.movementsRepository.deleteLastPayment(purchase_id);
        await this.movementsRepository.createGastoLog(purchase_id, MovementType.REFUND, deleted[0]?.amount ?? null, new Date());

        return await this.gastosRepository.getById(purchase_id);
    }

    async pagarCuotasLote(purchaseIds, userId) {
        if (!Array.isArray(purchaseIds) || purchaseIds.length === 0) {
            throw new Error("La lista de IDs de compra es inválida.");
        }

        const session = await this.requireReconcileSession(userId);

        // Diferido: solo marcamos cada gasto en la sesión. El pago real se
        // efectúa al cerrarla (ReconcileService.finishSession -> efectuarPago).
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

                if (gasto.is_postponed) {
                    failed.push({ id, reason: "Gasto postergado para la próxima sesión" });
                    continue;
                }

                if (!gasto.fixed_expense && gasto.payed_quotas >= gasto.number_of_quotas) {
                    failed.push({ id, reason: "Todas las cuotas ya están pagas" });
                    continue;
                }

                await this.reconcileRepository.upsertItem(session.id, id, false);
                updated.push(gasto);
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
