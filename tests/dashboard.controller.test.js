import { describe, it, expect, vi, beforeEach } from "vitest";
import { DashboardController } from "../controller/dashboard.controller.js";

function makeRes() {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
}

describe("DashboardController", () => {
    let dashboardService;
    let controller;

    beforeEach(() => {
        dashboardService = { getHomeData: vi.fn() };
        controller = new DashboardController(dashboardService);
    });

    describe("home", () => {
        it("responde con los datos del dashboard para el usuario autenticado", async () => {
            const req = { session: { userId: 42 } };
            const res = makeRes();
            const mockData = [{ id: 1, name: "Tarjeta Visa", active_gastos: 3 }];
            dashboardService.getHomeData.mockResolvedValue(mockData);

            await controller.home(req, res);

            expect(dashboardService.getHomeData).toHaveBeenCalledWith(42);
            expect(res.json).toHaveBeenCalledWith({
                message: "Datos del dashboard obtenidos con éxito",
                data: mockData,
            });
        });

        it("responde con data vacía si el usuario no tiene entidades", async () => {
            const req = { session: { userId: 99 } };
            const res = makeRes();
            dashboardService.getHomeData.mockResolvedValue([]);

            await controller.home(req, res);

            expect(res.json).toHaveBeenCalledWith({
                message: "Datos del dashboard obtenidos con éxito",
                data: [],
            });
        });

        it("responde 500 cuando el servicio lanza un error", async () => {
            const req = { session: { userId: 42 } };
            const res = makeRes();
            dashboardService.getHomeData.mockRejectedValue(new Error("DB error"));

            await controller.home(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Error en el servidor" });
        });
    });
});
