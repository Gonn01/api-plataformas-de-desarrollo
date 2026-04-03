import { faker } from "@faker-js/faker";
import { logGreen, logCyan, logBlue } from "./utils/logs_custom.js";
import { executeQuery } from "./db.js";
import { MovementType, Currency, ExpenseType } from "./utils/enums.js";

const USERS = [18];

async function runSeed() {
    logGreen("🌱 Iniciando seed…");

    await executeQuery(`
        TRUNCATE TABLE
            purchases_movements,
            purchases,
            financial_entities_movements,
            financial_entities
        RESTART IDENTITY CASCADE;
    `);

    const entityNames = [
        "Banco Galicia",
        "Mercado Pago",
        "BBVA",
        "Santander",
        "Naranja X",
        "HSBC",
        "Brubank"
    ];

    logCyan("➡ Creando entidades financieras…");

    const entities = [];

    for (const name of entityNames) {
        const ownerUserId = USERS[Math.floor(Math.random() * USERS.length)];

        const entity = await executeQuery(
            `
            INSERT INTO financial_entities (created_at, name, user_id, deleted)
            VALUES (NOW(), $1, $2, FALSE)
            RETURNING id, name, user_id;
        `,
            [name, ownerUserId]
        );

        const row = entity[0];
        entities.push(row);

        await executeQuery(
            `INSERT INTO financial_entities_movements (created_at, financial_entity_id, movement_type)
             VALUES (NOW(), $1, $2);`,
            [row.id, MovementType.CREATION]
        );

        logBlue(`  - Entidad creada: ${row.name} (Usuario ID: ${row.user_id})`);
    }

    logGreen(`✔ ${entities.length} entidades creadas.`);

    logCyan("➡ Creando gastos…");

    const NUM_PURCHASES = 40;
    const currencies = Object.values(Currency);
    const purchaseTypes = Object.values(ExpenseType);
    const purchases = [];

    for (let i = 0; i < NUM_PURCHASES; i++) {
        const entity = entities[Math.floor(Math.random() * entities.length)];

        const amount = faker.number.int({ min: 3000, max: 250000 });
        const currency = currencies[Math.floor(Math.random() * currencies.length)];
        const type = purchaseTypes[Math.floor(Math.random() * purchaseTypes.length)];
        const fixedExpense = Math.random() < 0.3;

        let quotas, payed;

        if (fixedExpense) {
            quotas = 0;
            payed = faker.number.int({ min: 0, max: 1 });
        } else {
            quotas = faker.number.int({ min: 1, max: 12 });
            payed = faker.number.int({ min: 0, max: quotas });
        }

        const purchase = await executeQuery(
            `
            INSERT INTO purchases (
                created_at,
                finalization_date,
                first_quota_date,
                image,
                amount,
                number_of_quotas,
                currency_type,
                type,
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
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                FALSE
            )
            RETURNING id, name, financial_entity_id, type, fixed_expense, number_of_quotas;
        `,
            [
                amount,
                quotas,
                currency,
                type,
                faker.commerce.productName(),
                entity.id,
                fixedExpense
            ]
        );

        const row = purchase[0];
        purchases.push(row);

        await executeQuery(
            `INSERT INTO purchases_movements (created_at, purchase_id, movement_type, amount, payment_date)
             VALUES (NOW(), $1, $2, NULL, NULL);`,
            [row.id, MovementType.CREATION]
        );

        const amountPerQuota = quotas > 0 ? amount / quotas : amount;
        for (let p = 0; p < payed; p++) {
            await executeQuery(
                `INSERT INTO purchases_movements (created_at, purchase_id, movement_type, amount, payment_date)
                 VALUES (NOW() - interval '1 month' * $1, $2, $4, $3, NOW() - interval '1 month' * $1);`,
                [payed - p, row.id, amountPerQuota, MovementType.PAYMENT]
            );
        }

        logBlue(
            `  - Gasto creado: ${row.name} | Tipo: ${row.type} | Fixed: ${row.fixed_expense} | Cuotas: ${row.number_of_quotas} | Pagadas: ${payed}`
        );
    }

    logGreen(`✔ ${purchases.length} gastos creados.`);
    logGreen("🎉 SEED COMPLETADO!");
    process.exit(0);
}

runSeed().catch(err => {
    console.error("❌ Error ejecutando seed:", err);
    process.exit(1);
});
