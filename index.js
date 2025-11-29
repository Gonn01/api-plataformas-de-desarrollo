import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;

const router = express.Router();

router.get("/", (req, res) => {
    console.log("GET / request received");
    setTimeout(() => {
        res.send({ "message": "Hello World!" });
    }, 5000);
});

app.use("/", router);

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});