import { logRed } from "../utils/logs_custom.js";
import { Currency } from "../utils/enums.js";

export class UserController {
    constructor(userService) {
        this.userService = userService;
    }

    updatePreferredCurrency = async (req, res) => {
        try {
            const userId = req.session.userId;
            const { preferred_currency } = req.body;

            if (!preferred_currency || !Object.values(Currency).includes(preferred_currency)) {
                return res
                    .status(400)
                    .json({ error: `Debe enviar 'preferred_currency' válida (${Object.values(Currency).join(', ')})` });
            }

            const updated = await this.userService.updatePreferredCurrency(
                userId,
                preferred_currency
            );

            res.json({
                message: "Moneda preferida actualizada",
                data: updated,
            });
        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    };

    updateSueldo = async (req, res) => {
        try {
            const userId = req.session.userId;
            const { sueldo } = req.body;

            if (sueldo === undefined || sueldo === null || sueldo === "") {
                return res
                    .status(400)
                    .json({ error: "Debe enviar 'sueldo'" });
            }

            const sueldoNumber = Number(sueldo);

            if (!Number.isFinite(sueldoNumber) || sueldoNumber < 0) {
                return res
                    .status(400)
                    .json({ error: "Debe enviar 'sueldo' como un número mayor o igual a 0" });
            }

            const updated = await this.userService.updateSueldo(
                userId,
                sueldoNumber
            );

            res.json({
                message: "Sueldo actualizado",
                data: updated,
            });
        } catch (err) {
            logRed(err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    };
}
