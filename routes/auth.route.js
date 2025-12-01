import express from "express";
import { AuthController } from "../controller/auth.controller.js";
import { AuthRepository } from "../repositories/auth.repository.js";

const router = express.Router();

const authRepository = new AuthRepository();
const authController = new AuthController(authRepository);

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/firebase-login", authController.firebaseLogin);

export default router;
