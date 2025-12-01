
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";
import { logRed } from "../utils/logs_custom.js";

export class AuthController {
    constructor(authRepository) {
        this.authRepository = authRepository;
    }

    register = async (req, res) => {
        try {
            const { name, email, password, firebaseId } = req.body;
            const firebaseIdFinal = firebaseId ?? null;
            if (!name || !email || !password) {
                return res.status(400).json({ error: "Faltan campos" });
            }

            const existing = await this.authRepository.findUserByEmail(email);

            if (existing.length > 0) {
                return res.status(400).json({ error: "El email ya existe" });
            }

            const hash = await bcrypt.hash(password, 12);

            const inserted = await this.authRepository.createUser(name, email, hash, firebaseIdFinal);

            const user = inserted[0];

            const payload = { id: user.id, email: user.email };
            if (firebaseIdFinal) payload.firebaseId = firebaseIdFinal;

            res.json({
                message: "Usuario creado con éxito",
                user
            });

        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }

    login = async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: "Faltan campos" });
            }

            const users = await this.authRepository.findUserByEmail(email);

            if (users.length === 0) {
                return res.status(404).json({ error: "Credenciales incorrectas" });
            }

            const user = users[0];

            const match = await bcrypt.compare(password, user.password);

            if (!match) {
                return res.status(401).json({ error: "Credenciales incorrectas" });
            }

            const token = jwt.sign(
                { userId: user.id, email: user.email, firebaseId: user.firebase_id },
                JWT_SECRET,
                { expiresIn: "7d" }
            );

            res.json({
                message: "Login exitoso",
                data: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                },
                token
            });

        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }

    firebaseLogin = async (req, res) => {
        try {
            const { firebaseId, name, email } = req.body;

            if (!firebaseId) {
                return res.status(400).json({ error: "Token faltante" });
            }

            const existing = await this.authRepository.findUserByFirebaseId(firebaseId);

            let user;

            if (existing.length === 0) {
                const inserted = await this.authRepository.createUser(name, email, null, firebaseId);
                user = inserted[0];
            } else {
                user = existing[0];
            }

            const token = jwt.sign(
                { userId: user.id, email: user.email, firebaseId },
                JWT_SECRET,
                { expiresIn: "7d" }
            );

            res.json({ data: user, token });

        } catch (err) {
            logRed(err);
            res.status(401).json({ error: "Token inválido" });
        }
    };
}

