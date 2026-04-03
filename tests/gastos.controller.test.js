import { describe, it, expect, vi, beforeEach } from "vitest";
import { GastosController } from "../controller/gastos.controller.js";

function makeRes() {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
}

function makeReq(overrides = {}) {
    return { body: {}, params: {}, session: { userId: 1 }, ...overrides };
}

describe("GastosController", () => {
    let service;
    let controller;

    beforeEach(() => {
        service = {
            crearGasto: vi.fn(),
            obtenerMovimientosPorGasto: vi.fn(),
            getById: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            pagarCuota: vi.fn(),
            pagarCuotasLote: vi.fn(),
        };
        controller = new GastosController(service);
    });

    // ─── crear ────────────────────────────────────────────────────────────────

    describe("crear", () => {
        const validBody = {
            financial_entity_id: 1,
            name: "Netflix",
            amount: 15000,
            number_of_quotas: 12,
            currency_type: 0,
            first_quota_date: "2024-01-01",
            fixed_expense: false,
            image: null,
            type: 0,
            payed_quotas: 0,
        };

        it("responde 201 con el gasto creado y sus movimientos", async () => {
            const req = makeReq({ body: validBody });
            const res = makeRes();
            const mockGasto = [{ id: 10, name: "Netflix" }];
            const mockMovements = [{ id: 1, type: "CREATION" }];
            service.crearGasto.mockResolvedValue(mockGasto);
            service.obtenerMovimientosPorGasto.mockResolvedValue(mockMovements);

            await controller.crear(req, res);

            expect(service.crearGasto).toHaveBeenCalledWith(
                1, "Netflix", 15000, 12, 0, "2024-01-01", false, null, 0, 0
            );
            expect(service.obtenerMovimientosPorGasto).toHaveBeenCalledWith(10);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: "Gasto creado con éxito",
                data: { id: 10, name: "Netflix", movements: mockMovements },
            });
        });

        it("responde 400 cuando falta financial_entity_id", async () => {
            const req = makeReq({ body: { name: "Netflix", amount: 15000 } });
            const res = makeRes();

            await controller.crear(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "Faltan campos obligatorios" });
            expect(service.crearGasto).not.toHaveBeenCalled();
        });

        it("responde 400 cuando falta name", async () => {
            const req = makeReq({ body: { financial_entity_id: 1, amount: 15000 } });
            const res = makeRes();

            await controller.crear(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "Faltan campos obligatorios" });
        });

        it("responde 400 cuando falta amount", async () => {
            const req = makeReq({ body: { financial_entity_id: 1, name: "Netflix" } });
            const res = makeRes();

            await controller.crear(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "Faltan campos obligatorios" });
        });

        it("responde 500 cuando el servicio lanza un error", async () => {
            const req = makeReq({ body: validBody });
            const res = makeRes();
            service.crearGasto.mockRejectedValue(new Error("DB error"));

            await controller.crear(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Error en el servidor" });
        });
    });

    // ─── getById ──────────────────────────────────────────────────────────────

    describe("getById", () => {
        it("responde con el gasto encontrado", async () => {
            const req = makeReq({ params: { id: "10" } });
            const res = makeRes();
            const mockGasto = { id: 10, name: "Netflix", movements: [] };
            service.getById.mockResolvedValue(mockGasto);

            await controller.getById(req, res);

            expect(service.getById).toHaveBeenCalledWith("10");
            expect(res.json).toHaveBeenCalledWith({ message: "Gasto encontrado", data: mockGasto });
        });

        it("responde 500 cuando el servicio lanza un error", async () => {
            const req = makeReq({ params: { id: "10" } });
            const res = makeRes();
            service.getById.mockRejectedValue(new Error("DB error"));

            await controller.getById(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Error en el servidor" });
        });
    });

    // ─── update ───────────────────────────────────────────────────────────────

    describe("update", () => {
        it("responde con el gasto actualizado", async () => {
            const req = makeReq({ params: { id: "10" }, body: { name: "Netflix Premium", amount: 20000, image: null, fixed_expense: false, type: 0 } });
            const res = makeRes();
            const mockUpdated = { id: 10, name: "Netflix Premium", amount: 20000 };
            service.update.mockResolvedValue(mockUpdated);

            await controller.update(req, res);

            expect(service.update).toHaveBeenCalledWith("10", "Netflix Premium", 20000, null, false, 0);
            expect(res.json).toHaveBeenCalledWith({ message: "Gasto actualizado", data: mockUpdated });
        });

        it("responde 500 cuando el servicio lanza un error", async () => {
            const req = makeReq({ params: { id: "10" }, body: { name: "Netflix" } });
            const res = makeRes();
            service.update.mockRejectedValue(new Error("DB error"));

            await controller.update(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Error en el servidor" });
        });
    });

    // ─── delete ───────────────────────────────────────────────────────────────

    describe("delete", () => {
        it("responde con confirmación al eliminar el gasto", async () => {
            const req = makeReq({ params: { id: "10" } });
            const res = makeRes();
            service.delete.mockResolvedValue();

            await controller.delete(req, res);

            expect(service.delete).toHaveBeenCalledWith("10");
            expect(res.json).toHaveBeenCalledWith({ message: "Gasto eliminado correctamente", data: "10" });
        });

        it("responde 500 cuando el servicio lanza un error", async () => {
            const req = makeReq({ params: { id: "10" } });
            const res = makeRes();
            service.delete.mockRejectedValue(new Error("DB error"));

            await controller.delete(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Error en el servidor" });
        });
    });

    // ─── pagarCuota ───────────────────────────────────────────────────────────

    describe("pagarCuota", () => {
        it("responde con el resultado del pago de cuota", async () => {
            const req = makeReq({ params: { id: "10" } });
            const res = makeRes();
            const mockResult = [{ id: 10, payed_quotas: 1 }];
            service.pagarCuota.mockResolvedValue(mockResult);

            await controller.pagarCuota(req, res);

            expect(service.pagarCuota).toHaveBeenCalledWith("10");
            expect(res.json).toHaveBeenCalledWith({ message: "Cuota pagada con éxito", data: mockResult[0] });
        });

        it("responde 500 cuando el servicio lanza un error", async () => {
            const req = makeReq({ params: { id: "10" } });
            const res = makeRes();
            service.pagarCuota.mockRejectedValue(new Error("DB error"));

            await controller.pagarCuota(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Error en el servidor" });
        });
    });

    // ─── pagarCuotasLote ─────────────────────────────────────────────────────

    describe("pagarCuotasLote", () => {
        it("responde con los gastos actualizados en lote", async () => {
            const req = makeReq({ body: { purchase_ids: [1, 2, 3] } });
            const res = makeRes();
            const mockUpdated = [{ id: 1 }, { id: 2 }, { id: 3 }];
            service.pagarCuotasLote.mockResolvedValue(mockUpdated);

            await controller.pagarCuotasLote(req, res);

            expect(service.pagarCuotasLote).toHaveBeenCalledWith([1, 2, 3]);
            expect(res.json).toHaveBeenCalledWith({ message: "Cuotas pagadas en lote", updated: mockUpdated });
        });

        it("responde 400 cuando purchase_ids no es un array", async () => {
            const req = makeReq({ body: { purchase_ids: "1,2,3" } });
            const res = makeRes();

            await controller.pagarCuotasLote(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "Debe enviar 'purchase_ids' como array no vacío" });
            expect(service.pagarCuotasLote).not.toHaveBeenCalled();
        });

        it("responde 400 cuando purchase_ids es un array vacío", async () => {
            const req = makeReq({ body: { purchase_ids: [] } });
            const res = makeRes();

            await controller.pagarCuotasLote(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "Debe enviar 'purchase_ids' como array no vacío" });
            expect(service.pagarCuotasLote).not.toHaveBeenCalled();
        });

        it("responde 400 cuando falta purchase_ids", async () => {
            const req = makeReq({ body: {} });
            const res = makeRes();

            await controller.pagarCuotasLote(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "Debe enviar 'purchase_ids' como array no vacío" });
        });

        it("responde 500 cuando el servicio lanza un error", async () => {
            const req = makeReq({ body: { purchase_ids: [1, 2] } });
            const res = makeRes();
            service.pagarCuotasLote.mockRejectedValue(new Error("DB error"));

            await controller.pagarCuotasLote(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Error en el servidor" });
        });
    });
});
