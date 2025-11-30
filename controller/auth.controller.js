
import bcrypt from "bcrypt";
import { executeQuery } from "../db.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
export class AuthController {
    static async register(req, res) {
        try {
            const { name, email, password, firebaseId } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({ error: "Faltan campos" });
            }

            const existing = await executeQuery(
                "SELECT id FROM users WHERE email = $1 LIMIT 1",
                [email]
            );

            if (existing.length > 0) {
                return res.status(400).json({ error: "El email ya existe" });
            }

            const hash = await bcrypt.hash(password, 12);

            const inserted = await executeQuery(
                `INSERT INTO users (name, email, password, firebase_user_id, created_at)
             VALUES ($1, $2, $3, $4, NOW())
             RETURNING id, name, email`,
                [name, email, hash, firebaseId]
            );

            const user = inserted[0];

            const token = jwt.sign(
                { id: user.id, email: user.email, firebaseId },
                JWT_SECRET,
                { expiresIn: "7d" }
            );

            res.json({
                message: "Usuario creado con éxito",
                user,
                token
            });

        } catch (err) {
            console.log(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }

    static async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: "Faltan campos" });
            }

            const users = await executeQuery(
                "SELECT * FROM users WHERE email = $1 LIMIT 1",
                [email]
            );

            if (users.length === 0) {
                return res.status(404).json({ error: "Credenciales incorrectas" });
            }

            const user = users[0];

            const match = await bcrypt.compare(password, user.password);

            if (!match) {
                return res.status(401).json({ error: "Credenciales incorrectas" });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email },
                JWT_SECRET,
                { expiresIn: "7d" }
            );

            res.json({
                message: "Login exitoso",
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                },
                token
            });

        } catch (err) {
            console.log(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }
}

