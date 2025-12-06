import express from "express";
import { makeAuthController } from "../factories/auth.factory.js";

const router = express.Router();

const authController = makeAuthController();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/firebase-login", authController.firebaseLogin);
router.put("/preferred-currency", authController.updatePreferredCurrency);

export default router;
