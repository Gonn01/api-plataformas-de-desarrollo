
import { handleError, badRequest } from "../utils/errors.js";

export class AuthController {
    constructor(authService) {
        this.authService = authService;
    }

    register = async (req, res) => {
        try {
            const { name, email, password, firebaseId } = req.body;

            const firebaseIdFinal = firebaseId ?? null;

            if (!name || !email || !password) {
                return badRequest(res, "Faltan campos");
            }

            await this.authService.register(name, email, password, firebaseIdFinal);

            res.json({
                message: "Usuario creado con éxito",
            });

        } catch (err) {
            return handleError(res, err);
        }
    }

    login = async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return badRequest(res, "Faltan campos");
            }

            const response = await this.authService.login(email, password);

            res.json({
                message: "Login exitoso",
                data: response,
            });

        } catch (err) {
            return handleError(res, err);
        }
    }

    firebaseLogin = async (req, res) => {
        try {
            const { firebaseId, name, email, avatar } = req.body;

            if (!firebaseId) {
                return badRequest(res, "Token faltante");
            }
            const response = await this.authService.firebaseLogin(name, email, avatar, firebaseId);
            res.json({
                message: "Login exitoso",
                data: response,
            });

        } catch (err) {
            return handleError(res, err);
        }
    };
}
