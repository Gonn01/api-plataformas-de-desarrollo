import { executeQuery } from "../db.js";
import { logRed, logGreen } from "../utils/logs_custom.js";

/**
 * Crea las tablas del "modo hacer cuentas" si no existen.
 * Se llama una vez al arrancar el server (index.js).
 */
export async function ensureReconcileSchema() {
    const steps = [
        ["reconcile_sessions", `
            CREATE TABLE IF NOT EXISTS reconcile_sessions (
                id          SERIAL PRIMARY KEY,
                user_id     INTEGER NOT NULL,
                status      TEXT NOT NULL DEFAULT 'OPEN',
                started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                finished_at TIMESTAMPTZ
            )
        `],
        ["reconcile_sessions_one_open", `
            CREATE UNIQUE INDEX IF NOT EXISTS reconcile_sessions_one_open
                ON reconcile_sessions (user_id) WHERE status = 'OPEN'
        `],
        ["reconcile_session_items", `
            CREATE TABLE IF NOT EXISTS reconcile_session_items (
                id           SERIAL PRIMARY KEY,
                session_id   INTEGER NOT NULL REFERENCES reconcile_sessions(id) ON DELETE CASCADE,
                purchase_id  INTEGER NOT NULL,
                auto         BOOLEAN NOT NULL DEFAULT false,
                quota_number INTEGER,
                checked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE (session_id, purchase_id)
            )
        `],
        ["reconcile_session_items.quota_number", `
            ALTER TABLE reconcile_session_items
                ADD COLUMN IF NOT EXISTS quota_number INTEGER
        `],
        ["reconcile_snapshots", `
            CREATE TABLE IF NOT EXISTS reconcile_snapshots (
                id          SERIAL PRIMARY KEY,
                user_id     INTEGER NOT NULL,
                session_id  INTEGER,
                month       TEXT NOT NULL,
                started_at  TIMESTAMPTZ NOT NULL,
                finished_at TIMESTAMPTZ NOT NULL,
                totals      JSONB NOT NULL,
                items       JSONB NOT NULL,
                created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `],
        ["reconcile_snapshots_user_month", `
            CREATE INDEX IF NOT EXISTS reconcile_snapshots_user_month
                ON reconcile_snapshots (user_id, month)
        `],
    ];

    for (const [name, sql] of steps) {
        try {
            await executeQuery(sql);
        } catch (err) {
            logRed(`[reconcile schema] falló "${name}": ${err.message}`);
            throw err;
        }
    }
    logGreen("[reconcile schema] OK");
}

export class ReconcileRepository {
    async getOpenSession(userId) {
        const rows = await executeQuery(
            `SELECT id, user_id, status, started_at, finished_at
             FROM reconcile_sessions
             WHERE user_id = $1 AND status = 'OPEN'
             LIMIT 1`,
            [userId],
        );
        return rows[0] ?? null;
    }

    async createSession(userId) {
        const rows = await executeQuery(
            `INSERT INTO reconcile_sessions (user_id, status)
             VALUES ($1, 'OPEN')
             RETURNING id, user_id, status, started_at, finished_at`,
            [userId],
        );
        return rows[0];
    }

    async getSessionItems(sessionId) {
        return await executeQuery(
            `SELECT purchase_id, auto, quota_number, checked_at
             FROM reconcile_session_items
             WHERE session_id = $1
             ORDER BY checked_at ASC`,
            [sessionId],
        );
    }

    async upsertItem(sessionId, purchaseId, auto = false) {
        // quota_number = cuotas pagadas del gasto en este momento
        // (si se llama tras pagar, ya incluye la recién pagada).
        const cnt = await executeQuery(
            `SELECT COUNT(*)::int AS n FROM purchases_movements
             WHERE purchase_id = $1 AND movement_type = 'PAYMENT'`,
            [purchaseId],
        );
        const quota = cnt[0]?.n ?? 0;

        return await executeQuery(
            `INSERT INTO reconcile_session_items (session_id, purchase_id, auto, quota_number)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (session_id, purchase_id)
             DO UPDATE SET
                 auto = reconcile_session_items.auto OR EXCLUDED.auto,
                 quota_number = GREATEST(
                     COALESCE(reconcile_session_items.quota_number, 0),
                     COALESCE(EXCLUDED.quota_number, 0)
                 )`,
            [sessionId, purchaseId, auto, quota],
        );
    }

    async removeItem(sessionId, purchaseId) {
        return await executeQuery(
            `DELETE FROM reconcile_session_items
             WHERE session_id = $1 AND purchase_id = $2`,
            [sessionId, purchaseId],
        );
    }

    async removeItems(sessionId, purchaseIds) {
        for (const purchaseId of purchaseIds) {
            await this.removeItem(sessionId, purchaseId);
        }
    }

    async addItems(sessionId, purchaseIds, auto = false) {
        for (const purchaseId of purchaseIds) {
            await this.upsertItem(sessionId, purchaseId, auto);
        }
    }

    async getSnapshotSourceItems(sessionId) {
        return await executeQuery(
            `SELECT
                i.purchase_id,
                i.auto,
                i.checked_at,
                i.quota_number,
                p.name,
                p.currency_type,
                p.type,
                p.fixed_expense,
                p.number_of_quotas,
                CASE WHEN p.number_of_quotas > 0
                     THEN p.amount::numeric / p.number_of_quotas
                     ELSE p.amount END AS amount_per_quota,
                fe.id   AS entity_id,
                fe.name AS entity_name
             FROM reconcile_session_items i
             JOIN purchases p ON p.id = i.purchase_id
             LEFT JOIN financial_entities fe ON fe.id = p.financial_entity_id
             WHERE i.session_id = $1
             ORDER BY fe.name NULLS LAST, p.name`,
            [sessionId],
        );
    }

    async finishSession(sessionId) {
        return await executeQuery(
            `UPDATE reconcile_sessions
             SET status = 'FINISHED', finished_at = NOW()
             WHERE id = $1`,
            [sessionId],
        );
    }

    // Al cerrar una sesión, los gastos postergados del usuario vuelven a estar
    // disponibles para la próxima.
    async releasePostponedForUser(userId) {
        return await executeQuery(
            `UPDATE purchases p
             SET is_postponed = false
             FROM financial_entities fe
             WHERE p.financial_entity_id = fe.id
               AND fe.user_id = $1
               AND p.is_postponed = true
               AND p.deleted = false`,
            [userId],
        );
    }

    async deleteSession(sessionId) {
        return await executeQuery(
            `DELETE FROM reconcile_sessions WHERE id = $1`,
            [sessionId],
        );
    }

    async insertSnapshot({ userId, sessionId, month, startedAt, finishedAt, totals, items }) {
        const rows = await executeQuery(
            `INSERT INTO reconcile_snapshots
                (user_id, session_id, month, started_at, finished_at, totals, items)
             VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)
             RETURNING *`,
            [
                userId,
                sessionId,
                month,
                startedAt,
                finishedAt,
                JSON.stringify(totals),
                JSON.stringify(items),
            ],
        );
        return rows[0];
    }

    async listSnapshots(userId) {
        return await executeQuery(
            `SELECT id, month, started_at, finished_at, totals, created_at
             FROM reconcile_snapshots
             WHERE user_id = $1
             ORDER BY finished_at DESC`,
            [userId],
        );
    }

    async getSnapshot(userId, id) {
        const rows = await executeQuery(
            `SELECT * FROM reconcile_snapshots WHERE id = $1 AND user_id = $2 LIMIT 1`,
            [id, userId],
        );
        return rows[0] ?? null;
    }
}
