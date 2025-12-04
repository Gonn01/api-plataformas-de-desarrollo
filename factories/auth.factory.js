import { AuthController } from "../controller/auth.controller.js";
import { AuthRepository } from "../repositories/auth.repository.js";
import { AuthService } from "../services/auth.service.js";

export function makeAuthController() {
    const authRepository = new AuthRepository();

    const authService = new AuthService({ authRepository });

    const authController = new AuthController(authService);

    return authController;
}