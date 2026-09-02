import { logRed } from "../utils/logs_custom.js";

export class ReconcileController {
    constructor(reconcileService) {
        this.reconcileService = reconcileService;
    }

    getSession = async (req, res) => {
        try {
            const { userId } = req.session;
            const data = await this.reconcileService.getSession(userId);
            res.json({ message: "Sesión de cuentas", data });
        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    };

    startSession = async (req, res) => {
        try {
            const { userId } = req.session;
            const data = await this.reconcileService.startSession(userId);
            res.status(data.alreadyOpen ? 200 : 201).json({
                message: data.alreadyOpen ? "Ya había una sesión abierta" : "Sesión de cuentas iniciada",
                data,
            });
        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    };

    setItems = async (req, res) => {
        try {
            const { userId } = req.session;
            const { purchase_id, purchase_ids, checked, auto } = req.body;

            if (typeof checked !== "boolean") {
                return res.status(400).json({ error: "Debe enviar 'checked' (boolean)" });
            }

            let data;
            if (Array.isArray(purchase_ids)) {
                data = await this.reconcileService.setItemsBulk(userId, purchase_ids, checked);
            } else if (purchase_id !== undefined && purchase_id !== null) {
                data = await this.reconcileService.setItem(userId, Number(purchase_id), checked, Boolean(auto));
            } else {
                return res.status(400).json({ error: "Debe enviar 'purchase_id' o 'purchase_ids'" });
            }

            res.json({ message: "Sesión actualizada", data });
        } catch (err) {
            logRed(err);
            if (err.code === "RECONCILE_REQUIRED") {
                return res.status(409).json({ error: err.message, code: err.code });
            }
            res.status(500).json({ error: "Error en el servidor" });
        }
    };

    finishSession = async (req, res) => {
        try {
            const { userId } = req.session;
            const snapshot = await this.reconcileService.finishSession(userId);
            res.json({ message: "Cuentas cerradas", data: snapshot });
        } catch (err) {
            logRed(err);
            if (err.code === "NO_OPEN_SESSION") {
                return res.status(400).json({ error: err.message, code: err.code });
            }
            res.status(500).json({ error: "Error en el servidor" });
        }
    };

    discardSession = async (req, res) => {
        try {
            const { userId } = req.session;
            const data = await this.reconcileService.discardSession(userId);
            res.json({ message: "Sesión descartada", data });
        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    };

    listSnapshots = async (req, res) => {
        try {
            const { userId } = req.session;
            const data = await this.reconcileService.listSnapshots(userId);
            res.json({ message: "Snapshots de cuentas", data });
        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    };

    getSnapshot = async (req, res) => {
        try {
            const { userId } = req.session;
            const { id } = req.params;
            const data = await this.reconcileService.getSnapshot(userId, Number(id));
            res.json({ message: "Snapshot de cuentas", data });
        } catch (err) {
            logRed(err);
            if (err.code === "SNAPSHOT_NOT_FOUND") {
                return res.status(404).json({ error: err.message, code: err.code });
            }
            res.status(500).json({ error: "Error en el servidor" });
        }
    };
}
