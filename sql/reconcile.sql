-- "Modo hacer cuentas" (reconcile) — persistencia en DB.
-- Estas tablas se crean automáticamente al arrancar el server
-- (ver ensureReconcileSchema en repositories/reconcile.repository.js).
-- Este archivo queda como referencia / para correr a mano si hiciera falta.

CREATE TABLE IF NOT EXISTS reconcile_sessions (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL,
    status      TEXT NOT NULL DEFAULT 'OPEN', -- OPEN | FINISHED
    started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);

-- Una sola sesión abierta por usuario.
CREATE UNIQUE INDEX IF NOT EXISTS reconcile_sessions_one_open
    ON reconcile_sessions (user_id) WHERE status = 'OPEN';

CREATE TABLE IF NOT EXISTS reconcile_session_items (
    id           SERIAL PRIMARY KEY,
    session_id   INTEGER NOT NULL REFERENCES reconcile_sessions(id) ON DELETE CASCADE,
    purchase_id  INTEGER NOT NULL,
    auto         BOOLEAN NOT NULL DEFAULT false, -- true = marcado al pagar, false = marcado a mano
    quota_number INTEGER,                        -- nº de cuota / vez pagada al momento de marcar
    checked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (session_id, purchase_id)
);

CREATE TABLE IF NOT EXISTS reconcile_snapshots (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL,
    session_id  INTEGER,
    month       TEXT NOT NULL,          -- 'YYYY-MM' de finished_at
    started_at  TIMESTAMPTZ NOT NULL,
    finished_at TIMESTAMPTZ NOT NULL,
    totals      JSONB NOT NULL,         -- { byCurrency: {ARS:{egreso,ingreso,count}}, entities, items }
    items       JSONB NOT NULL,         -- [{ purchase_id, name, entity_id, entity_name, amount_per_quota, currency, type, fixed_expense, number_of_quotas, quota_number, auto, checked_at }]
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reconcile_snapshots_user_month
    ON reconcile_snapshots (user_id, month);
