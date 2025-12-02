
import { logRed } from "../utils/logs_custom.js";

export class AuthController {
    constructor(authService) {
        this.authService = authService;
    }

    register = async (req, res) => {
        try {
            const { name, email, password, firebaseId } = req.body;

            const firebaseIdFinal = firebaseId ?? null;

            if (!name || !email || !password) {
                return res.status(400).json({ error: "Faltan campos" });
            }

            await this.authService.register(name, email, password, firebaseIdFinal);

            res.json({
                message: "Usuario creado con éxito",
            });

        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor: " + err.message });
        }
    }

    login = async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: "Faltan campos" });
            }

            const response = await this.authService.login(email, password);

            res.json({
                message: "Login exitoso",
                data: response,
            });

        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    }

    /* firebaseLogin = async (req, res) => {
        try {
            const { firebaseId, name, email, avatar } = req.body;

            if (!firebaseId) {
                return res.status(400).json({ error: "Token faltante" });
            }

            const response = await this.authService.firebaseLogin(firebaseId, name, email, avatar);

            res.json({
                message: "Login exitoso",
                data: response,
            });

        } catch (err) {
            logRed(err);
            res.status(401).json({ error: "Token inválido" });
        }
    }; */

    firebaseLogin = async (req, res) => {
        try {
            const { firebaseId, name, email, avatar } = req.body;

            if (!firebaseId) {
                return res.status(400).json({ error: "Token faltante" });
            }
            // etstaba asi (firebaseId, name, email, avatar)
            // cambie el orden (name, email, avatar, firebaseId) 
            const response = await this.authService.firebaseLogin(name, email, avatar, firebaseId);
            // ----------------------------

            res.json({
                message: "Login exitoso",
                data: response,
            });

        } catch (err) {
            logRed(err);
            res.status(401).json({ error: "Token inválido" });
        }
    };
}

