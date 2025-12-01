import express from "express";
import cors from "cors";
import routesIndex from "./routes/index.js";
import { logBlue } from "./utils/logs_custom.js";

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;

app.use("/api", routesIndex);

app.listen(port, () => {
    logBlue(`Servidor corriendo en http://localhost:${port}`);
});