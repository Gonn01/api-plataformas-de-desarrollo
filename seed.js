import dotenv from "dotenv";
import postgres from "postgres";
import { faker } from "@faker-js/faker";

dotenv.config({ path: process.env.ENV_FILE || ".env" });

const connectionString = process.env.DATABASE_URL;
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

// -----------------------------------------------------------
// SEED PRINCIPAL
// -----------------------------------------------------------

async function runSeed() {
    console.log("🌱 Iniciando seed…");

    const USER_ID = 1; // usuario al que se le generarán entidades + gastos

    // ===============================================================
    // 1) Crear ENTIDADES FINANCIERAS del usuario 1
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

    console.log("➡ Creando entidades financieras…");

    const entities = [];

    for (const name of entityNames) {
        const entity = await insertOne(
            `
            INSERT INTO financial_entities (created_at, name, user_id, deleted)
            VALUES (NOW(), $1, $2, FALSE)
            RETURNING id, name;
        `,
            [name, USER_ID]
        );

        entities.push(entity);

        // Log inicial de la entidad
        await sql.unsafe(
            `
            INSERT INTO financial_entities_logs (created_at, financial_entity_id, content)
            VALUES (NOW(), $1, $2);
        `,
            [entity.id, `Entidad "${entity.name}" creada automáticamente para el usuario ${USER_ID}`]
        );
    }

    console.log(`✔ ${entities.length} entidades creadas.`);

    // ===============================================================
    // 2) Crear GASTOS
    // ===============================================================

    console.log("➡ Creando gastos…");

    const NUM_PURCHASES = 40;

    // CURRENCY ENUM AS INT → 0, 1, 2
    const currencies = [0, 1, 2];

    const purchases = [];

    for (let i = 0; i < NUM_PURCHASES; i++) {
        const entity = randomChoice(entities);

        const amount = faker.number.int({ min: 3000, max: 250000 });
        const quotas = faker.number.int({ min: 1, max: 12 });
        const payed = faker.number.int({ min: 0, max: quotas });

        const currency = randomChoice(currencies);

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
        $5,   -- currency_type INT enum
        $6,   -- name
        $7,   -- financial_entity_id
        FALSE,
        FALSE
    )
    RETURNING id, name, financial_entity_id;
`,
            [
                amount,                  // $1
                amount / quotas,         // $2
                quotas,                  // $3
                payed,                   // $4
                currency,                // $5 (0,1,2)
                faker.commerce.productName(), // $6
                entity.id,               // $7
            ]
        );


        purchases.push(purchase);

        // Crear log de la compra
        await sql.unsafe(
            `
            INSERT INTO purchases_logs (created_at, purchase_id, content)
            VALUES (NOW(), $1, $2);
        `,
            [purchase.id, `Compra generada automáticamente: ${purchase.name}`]
        );
    }

    console.log(`✔ ${purchases.length} gastos creados.`);

    console.log("🎉 SEED COMPLETADO!");
    process.exit(0);
}

// Ejecutar seed
runSeed().catch((err) => {
    console.error("❌ Error ejecutando el seed:", err);
    process.exit(1);
});
