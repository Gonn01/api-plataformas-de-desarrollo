import postgres from "postgres";
import { faker } from "@faker-js/faker";
import { DATABASE_URL } from "./config/env.js";
import { logCyan, logGreen } from "./utils/logs_custom.js";

const connectionString = DATABASE_URL;
const sql = postgres(connectionString, { ssl: "require" });

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------

async function insertOne(query, values = []) {
    const rows = await sql.unsafe(query, values);
    return rows[0];
}

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Usuarios propietarios de entidades y gastos
const USERS = [16, 17];

// -----------------------------------------------------------
// SEED PRINCIPAL
// -----------------------------------------------------------

async function runSeed() {
    logGreen("🌱 Iniciando seed…");

    await sql.unsafe(`
        TRUNCATE TABLE 
            purchases_logs,
            purchases,
            financial_entities_logs,
            financial_entities
        RESTART IDENTITY CASCADE;
    `);

    // ===============================================================
    // 1) Crear ENTIDADES FINANCIERAS para usuarios 9, 11 y 13
    // ===============================================================

    const entityNames = [
        "Banco Galicia",
        "Mercado Pago",
        "BBVA",
        "Santander",
        "Naranja X",
        "HSBC",
        "Brubank",
    ];

    logCyan("➡ Creando entidades financieras…");

    const entities = [];

    for (const name of entityNames) {
        const ownerUserId = randomChoice(USERS); // repartir 9,11,13

        const entity = await insertOne(
            `
            INSERT INTO financial_entities (created_at, name, user_id, deleted)
            VALUES (NOW(), $1, $2, FALSE)
            RETURNING id, name, user_id;
        `,
            [name, ownerUserId]
        );

        entities.push(entity);

        await sql.unsafe(
            `
            INSERT INTO financial_entities_logs (created_at, financial_entity_id, content)
            VALUES (NOW(), $1, $2);
        `,
            [entity.id, `Entidad "${entity.name}" creada automáticamente para el usuario ${ownerUserId}`]
        );
    }

    logGreen(`✔ ${entities.length} entidades creadas.`);

    // ===============================================================
    // 2) Crear GASTOS (purchases)
    // ===============================================================

    logCyan("➡ Creando gastos…");

    const NUM_PURCHASES = 40;
    const currencies = [0, 1, 2]; // INT enum
    const purchaseTypes = ["DEBO", "ME_DEBEN"]; // enum nuevo

    const purchases = [];

    for (let i = 0; i < NUM_PURCHASES; i++) {
        const entity = randomChoice(entities);

        const amount = faker.number.int({ min: 3000, max: 250000 });
        const quotas = faker.number.int({ min: 1, max: 12 });
        const payed = faker.number.int({ min: 0, max: quotas });

        const currency = randomChoice(currencies);
        const type = randomChoice(purchaseTypes); // nuevo enum

        const purchase = await insertOne(
            `
            INSERT INTO purchases (
                created_at,
                finalization_date,
                first_quota_date,
                image,
                amount,
                amount_per_quota,
                number_of_quotas,
                payed_quotas,
                currency_type,
                type,                    -- <<< nuevo
                name,
                financial_entity_id,
                fixed_expense,
                deleted
            )
            VALUES (
                NOW(),
                NULL,
                NOW() + interval '1 month',
                NULL,
                $1,   -- amount
                $2,   -- amount_per_quota
                $3,   -- number_of_quotas
                $4,   -- payed_quotas
                $5,   -- currency_type (0,1,2)
                $6,   -- type enum DEBO / ME_DEBEN
                $7,   -- purchase name
                $8,   -- entity id
                FALSE,
                FALSE
            )
            RETURNING id, name, financial_entity_id, type;
        `,
            [
                amount,
                amount / quotas,
                quotas,
                payed,
                currency,
                type,
                faker.commerce.productName(),
                entity.id,
            ]
        );

        purchases.push(purchase);

        await sql.unsafe(
            `
            INSERT INTO purchases_logs (created_at, purchase_id, content)
            VALUES (NOW(), $1, $2);
        `,
            [purchase.id, `Compra generada automáticamente: ${purchase.name} (${purchase.type})`]
        );
    }

    logGreen(`✔ ${purchases.length} gastos creados.`);
    logGreen("🎉 SEED COMPLETADO!");
    process.exit(0);
}

// Ejecutar seed
runSeed().catch((err) => {
    console.error("❌ Error ejecutando el seed:", err);
    process.exit(1);
});
