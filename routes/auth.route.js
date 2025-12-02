import express from "express";
import { AuthController } from "../controller/auth.controller.js";
import { AuthRepository } from "../repositories/auth.repository.js";
import { AuthService } from "../services/auth.service.js";

const router = express.Router();

const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/firebase-login", authController.firebaseLogin);

export default router;
