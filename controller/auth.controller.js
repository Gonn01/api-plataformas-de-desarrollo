
import { logRed } from "../utils/logs_custom.js";
import { Currency } from "../utils/enums.js";

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

    firebaseLogin = async (req, res) => {
        try {
            const { firebaseId, name, email, avatar } = req.body;

            if (!firebaseId) {
                return res.status(400).json({ error: "Token faltante" });
            }
            const response = await this.authService.firebaseLogin(name, email, avatar, firebaseId);
            res.json({
                message: "Login exitoso",
                data: response,
            });

        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    };

    updatePreferredCurrency = async (req, res) => {
        try {
            const { user_id, preferred_currency } = req.body;

            if (!user_id) {
                return res
                    .status(400)
                    .json({ error: "Debe enviar 'user_id'" });
            }

            if (!preferred_currency || !Object.values(Currency).includes(preferred_currency)) {
                return res
                    .status(400)
                    .json({ error: `Debe enviar 'preferred_currency' válida (${Object.values(Currency).join(', ')})` });
            }

            const updated = await this.authService.updatePreferredCurrency(
                Number(user_id),
                preferred_currency
            );

            res.json({
                message: "Moneda preferida actualizada",
                data: updated,
            });
        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    };
}

