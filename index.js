import express from "express";
import cors from "cors";
import routesIndex from "./routes/index.js";
import { logBlue, logRed } from "./utils/logs_custom.js";
import { errorMiddleware } from "./utils/errors.js";
import { ensureReconcileSchema } from "./repositories/reconcile.repository.js";
import { ensureGastosSchema } from "./repositories/gastos.repository.js";

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;

app.use("/api", routesIndex);

// Red de seguridad: si un handler async lanza sin capturar, traduce el error
// a una respuesta HTTP en vez de tumbar el request.
app.use(errorMiddleware);

try {
    await ensureReconcileSchema();
    logBlue("Esquema de 'modo hacer cuentas' verificado");
} catch (err) {
    logRed(`No se pudo asegurar el esquema de reconcile: ${err.stack ?? err}`);
}

try {
    await ensureGastosSchema();
    logBlue("Esquema de gastos verificado");
} catch (err) {
    logRed(`No se pudo asegurar el esquema de gastos: ${err.stack ?? err}`);
}

app.listen(port, () => {
    logBlue(`Servidor corriendo en http://localhost:${port}`);
});