import postgres from "postgres";
import { DATABASE_URL } from "./config/env.js";

const connectionString = DATABASE_URL;
const connection = postgres(connectionString, { ssl: "require" });

export async function executeQuery(query, values = [], log = true) {
    if (log) {
        console.log(
            `Ejecutando query: ${query} con valores: ${JSON.stringify(values)}`
        );
    }

    try {
        const results = await connection.unsafe(query, values);

        if (log) {
            console.log(`Query ejecutado con éxito: ${JSON.stringify(results)}`);
        }

        return results;
    } catch (error) {
        console.log(`Error en executeQuery: ${error.stack}`);
        throw error;
    }
}
