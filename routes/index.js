import express from "express";
import authRoutes from "./auth.route.js";
import entidadesFinancierasRoutes from "./entidades_financieras.route.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/entidades-financieras", entidadesFinancierasRoutes);

export default router;
