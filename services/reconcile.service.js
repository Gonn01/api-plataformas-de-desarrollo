export class ReconcileError extends Error {
    constructor(code, message) {
        super(message ?? code);
        this.code = code;
    }
}

// El driver puede devolver columnas JSONB como string; normalizamos.
function parseJson(value, fallback) {
    if (value == null) return fallback;
    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        } catch {
            return fallback;
        }
    }
    return value;
}

function normalizeSnapshot(row) {
    if (!row) return row;
    return {
        ...row,
        totals: parseJson(row.totals, { byCurrency: {}, entities: 0, items: 0 }),
        items: parseJson(row.items, []),
    };
}

function buildTotals(items) {
    const byCurrency = {};
    const entities = new Set();

    for (const it of items) {
        if (it.entity_id != null) entities.add(it.entity_id);

        const bucket = (byCurrency[it.currency] ??= { egreso: 0, ingreso: 0, count: 0 });
        bucket.count += 1;
        if (it.type === "INGRESO") bucket.ingreso += it.amount_per_quota;
        else bucket.egreso += it.amount_per_quota;
    }

    return { byCurrency, entities: entities.size, items: items.length };
}

export class ReconcileService {
    constructor({ reconcileRepository }) {
        this.reconcileRepository = reconcileRepository;
    }

    async getSession(userId) {
        const session = await this.reconcileRepository.getOpenSession(userId);
        if (!session) return null;
        const items = await this.reconcileRepository.getSessionItems(session.id);
        return { session, items };
    }

    async startSession(userId) {
        const existing = await this.reconcileRepository.getOpenSession(userId);
        if (existing) {
            const items = await this.reconcileRepository.getSessionItems(existing.id);
            return { session: existing, items, alreadyOpen: true };
        }
        const session = await this.reconcileRepository.createSession(userId);
        return { session, items: [], alreadyOpen: false };
    }

    async setItem(userId, purchaseId, checked, auto = false) {
        const session = await this.#requireOpenSession(userId);
        if (checked) await this.reconcileRepository.upsertItem(session.id, purchaseId, auto);
        else await this.reconcileRepository.removeItem(session.id, purchaseId);
        const items = await this.reconcileRepository.getSessionItems(session.id);
        return { session, items };
    }

    async setItemsBulk(userId, purchaseIds, checked) {
        const session = await this.#requireOpenSession(userId);
        const ids = purchaseIds.map(Number).filter(Number.isFinite);
        if (ids.length) {
            if (checked) await this.reconcileRepository.addItems(session.id, ids, false);
            else await this.reconcileRepository.removeItems(session.id, ids);
        }
        const items = await this.reconcileRepository.getSessionItems(session.id);
        return { session, items };
    }

    async finishSession(userId) {
        const session = await this.reconcileRepository.getOpenSession(userId);
        if (!session) throw new ReconcileError("NO_OPEN_SESSION", "No hay una sesión de cuentas abierta");

        const src = await this.reconcileRepository.getSnapshotSourceItems(session.id);
        const items = src.map((r) => ({
            purchase_id: r.purchase_id,
            name: r.name,
            entity_id: r.entity_id,
            entity_name: r.entity_name,
            amount_per_quota: Number(r.amount_per_quota ?? 0),
            currency: r.currency_type,
            type: r.type,
            fixed_expense: r.fixed_expense,
            number_of_quotas: r.number_of_quotas ?? null,
            quota_number: r.quota_number ?? null,
            auto: r.auto,
            checked_at: r.checked_at,
        }));

        const totals = buildTotals(items);
        const finishedAt = new Date();
        const month = finishedAt.toISOString().slice(0, 7);

        const snapshot = await this.reconcileRepository.insertSnapshot({
            userId,
            sessionId: session.id,
            month,
            startedAt: session.started_at,
            finishedAt,
            totals,
            items,
        });

        await this.reconcileRepository.finishSession(session.id);
        // Los gastos postergados vuelven a estar disponibles para la próxima sesión.
        await this.reconcileRepository.releasePostponedForUser(userId);
        return normalizeSnapshot(snapshot);
    }

    async discardSession(userId) {
        const session = await this.reconcileRepository.getOpenSession(userId);
        if (!session) return { discarded: false };
        await this.reconcileRepository.deleteSession(session.id);
        return { discarded: true };
    }

    async listSnapshots(userId) {
        const rows = await this.reconcileRepository.listSnapshots(userId);
        return rows.map((r) => ({ ...r, totals: parseJson(r.totals, { byCurrency: {}, entities: 0, items: 0 }) }));
    }

    async getSnapshot(userId, id) {
        const snapshot = await this.reconcileRepository.getSnapshot(userId, id);
        if (!snapshot) throw new ReconcileError("SNAPSHOT_NOT_FOUND", "Snapshot no encontrado");
        return normalizeSnapshot(snapshot);
    }

    async #requireOpenSession(userId) {
        const session = await this.reconcileRepository.getOpenSession(userId);
        if (!session) throw new ReconcileError("RECONCILE_REQUIRED", "No hay una sesión de cuentas abierta");
        return session;
    }
}
