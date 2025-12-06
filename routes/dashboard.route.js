import express from "express";
import { makeDashboardController } from "../factories/dashboard.factory.js";

const router = express.Router();

const controller = makeDashboardController();

router.get("/", controller.home);

export default router;
