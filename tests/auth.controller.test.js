import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthController } from "../controller/auth.controller.js";

function makeRes() {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
}

function makeReq(overrides = {}) {
    return { body: {}, params: {}, ...overrides };
}

describe("AuthController", () => {
    let authService;
    let controller;

    beforeEach(() => {
        authService = {
            register: vi.fn(),
            login: vi.fn(),
            firebaseLogin: vi.fn(),
            updatePreferredCurrency: vi.fn(),
        };
        controller = new AuthController(authService);
    });

    // ─── register ────────────────────────────────────────────────────────────

    describe("register", () => {
        it("responde 200 cuando el registro es exitoso", async () => {
            const req = makeReq({ body: { name: "Juan", email: "juan@test.com", password: "1234" } });
            const res = makeRes();
            authService.register.mockResolvedValue();

            await controller.register(req, res);

            expect(authService.register).toHaveBeenCalledWith("Juan", "juan@test.com", "1234", null);
            expect(res.json).toHaveBeenCalledWith({ message: "Usuario creado con éxito" });
        });

        it("pasa firebaseId cuando se envía", async () => {
            const req = makeReq({ body: { name: "Juan", email: "juan@test.com", password: "1234", firebaseId: "fb123" } });
            const res = makeRes();
            authService.register.mockResolvedValue();

            await controller.register(req, res);

            expect(authService.register).toHaveBeenCalledWith("Juan", "juan@test.com", "1234", "fb123");
        });

        it("responde 400 cuando faltan campos obligatorios", async () => {
            const req = makeReq({ body: { email: "juan@test.com" } });
            const res = makeRes();

            await controller.register(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "Faltan campos" });
            expect(authService.register).not.toHaveBeenCalled();
        });

        it("responde 500 cuando el servicio lanza un error", async () => {
            const req = makeReq({ body: { name: "Juan", email: "juan@test.com", password: "1234" } });
            const res = makeRes();
            authService.register.mockRejectedValue(new Error("DB error"));

            await controller.register(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining("Error en el servidor") }));
        });
    });

    // ─── login ───────────────────────────────────────────────────────────────

    describe("login", () => {
        it("responde con token cuando el login es exitoso", async () => {
            const req = makeReq({ body: { email: "juan@test.com", password: "1234" } });
            const res = makeRes();
            authService.login.mockResolvedValue({ token: "jwt-token" });

            await controller.login(req, res);

            expect(authService.login).toHaveBeenCalledWith("juan@test.com", "1234");
            expect(res.json).toHaveBeenCalledWith({ message: "Login exitoso", data: { token: "jwt-token" } });
        });

        it("responde 400 cuando faltan email o password", async () => {
            const req = makeReq({ body: { email: "juan@test.com" } });
            const res = makeRes();

            await controller.login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "Faltan campos" });
            expect(authService.login).not.toHaveBeenCalled();
        });

        it("responde 500 cuando el servicio lanza un error", async () => {
            const req = makeReq({ body: { email: "juan@test.com", password: "1234" } });
            const res = makeRes();
            authService.login.mockRejectedValue(new Error("DB error"));

            await controller.login(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Error en el servidor" });
        });
    });

    // ─── firebaseLogin ───────────────────────────────────────────────────────

    describe("firebaseLogin", () => {
        it("responde con token cuando el login firebase es exitoso", async () => {
            const req = makeReq({ body: { firebaseId: "fb123", name: "Juan", email: "juan@test.com", avatar: "https://avatar.url" } });
            const res = makeRes();
            authService.firebaseLogin.mockResolvedValue({ token: "jwt-token" });

            await controller.firebaseLogin(req, res);

            expect(authService.firebaseLogin).toHaveBeenCalledWith("Juan", "juan@test.com", "https://avatar.url", "fb123");
            expect(res.json).toHaveBeenCalledWith({ message: "Login exitoso", data: { token: "jwt-token" } });
        });

        it("responde 400 cuando falta firebaseId", async () => {
            const req = makeReq({ body: { name: "Juan", email: "juan@test.com" } });
            const res = makeRes();

            await controller.firebaseLogin(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "Token faltante" });
            expect(authService.firebaseLogin).not.toHaveBeenCalled();
        });

        it("responde 500 cuando el servicio lanza un error", async () => {
            const req = makeReq({ body: { firebaseId: "fb123" } });
            const res = makeRes();
            authService.firebaseLogin.mockRejectedValue(new Error("DB error"));

            await controller.firebaseLogin(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Error en el servidor" });
        });
    });

    // ─── updatePreferredCurrency ─────────────────────────────────────────────

    describe("updatePreferredCurrency", () => {
        it("responde con los datos actualizados cuando todo está bien", async () => {
            const req = makeReq({ body: { user_id: "1", preferred_currency: 0 } });
            const res = makeRes();
            authService.updatePreferredCurrency.mockResolvedValue({ id: 1, preferred_currency: 0 });

            await controller.updatePreferredCurrency(req, res);

            expect(authService.updatePreferredCurrency).toHaveBeenCalledWith(1, 0);
            expect(res.json).toHaveBeenCalledWith({
                message: "Moneda preferida actualizada",
                data: { id: 1, preferred_currency: 0 },
            });
        });

        it("responde 400 cuando falta user_id", async () => {
            const req = makeReq({ body: { preferred_currency: 0 } });
            const res = makeRes();

            await controller.updatePreferredCurrency(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "Debe enviar 'user_id'" });
        });

        it("responde 400 cuando falta preferred_currency", async () => {
            const req = makeReq({ body: { user_id: "1" } });
            const res = makeRes();

            await controller.updatePreferredCurrency(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "Debe enviar 'preferred_currency'" });
        });

        it("responde 500 cuando el servicio lanza un error", async () => {
            const req = makeReq({ body: { user_id: "1", preferred_currency: 1 } });
            const res = makeRes();
            authService.updatePreferredCurrency.mockRejectedValue(new Error("DB error"));

            await controller.updatePreferredCurrency(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Error en el servidor" });
        });
    });
});
