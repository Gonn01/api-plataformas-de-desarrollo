import express from "express";
import cors from "cors";
import { executeQuery } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;

const router = express.Router();

router.get("/", async (req, res) => {
    const user = await executeQuery("SELECT * FROM users LIMIT 1");
    res.send(user);
});

app.use("/", router);

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});