import express from "express";
import cors from "cors";
import routesIndex from "./routes/index.js";

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;

app.use("/api", routesIndex);

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});