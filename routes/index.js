import express from "express";
import authRoutes from "./auth.route.js";
import entidadesFinancierasRoutes from "./entidades_financieras.route.js";
import dashboardRoutes from "./dashboard.route.js"

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/entidades-financieras", entidadesFinancierasRoutes);
router.use("/dashboard", dashboardRoutes)

export default router;
