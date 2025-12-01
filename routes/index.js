import express from "express";
import authRoutes from "./auth.route.js";
import entidadesFinancierasRoutes from "./entidades_financieras.route.js";
import dashboardRoutes from "./dashboard.route.js"
import gastosRoutes from "./gastos.routes.js";
import { verifyToken } from "../utils/verify_token.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use(verifyToken);
router.use("/entidades-financieras", entidadesFinancierasRoutes);
router.use("/dashboard", dashboardRoutes)
router.use('/gastos', gastosRoutes);

export default router;
