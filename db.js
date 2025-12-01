import postgres from "postgres";
import { DATABASE_URL } from "./config/env.js";
import { logYellow } from "./utils/logs_custom.js";

const connectionString = DATABASE_URL;
const connection = postgres(connectionString, { ssl: "require" });

export async function executeQuery(query, values = [], log = true) {
    if (log) {
        logYellow(
            `Ejecutando query: ${query} con valores: ${JSON.stringify(values)}`
        );
    }

    try {
        const results = await connection.unsafe(query, values);

        if (log) {
            logYellow(`Query ejecutado con éxito: ${JSON.stringify(results)}`);
        }

        return results;
    } catch (error) {
        logYellow(`Error en executeQuery: ${error.stack}`);
        throw error;
    }
}
