import { Currency } from "../utils/enums.js";
import { handleError, badRequest } from "../utils/errors.js";

export class UserController {
    constructor(userService) {
        this.userService = userService;
    }

    updatePreferredCurrency = async (req, res) => {
        try {
            const userId = req.session.userId;
            const { preferred_currency } = req.body;

            if (!preferred_currency || !Object.values(Currency).includes(preferred_currency)) {
                return badRequest(res, `Debe enviar 'preferred_currency' válida (${Object.values(Currency).join(', ')})`);
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
            return handleError(res, err);
        }
    };

    updateSueldo = async (req, res) => {
        try {
            const userId = req.session.userId;
            const { sueldo, sueldo_currency } = req.body;

            if (sueldo === undefined || sueldo === null || sueldo === "") {
                return badRequest(res, "Debe enviar 'sueldo'");
            }

            const sueldoNumber = Number(sueldo);

            if (!Number.isFinite(sueldoNumber) || sueldoNumber < 0) {
                return badRequest(res, "Debe enviar 'sueldo' como un número mayor o igual a 0");
            }

            if (sueldo_currency !== undefined && !Object.values(Currency).includes(sueldo_currency)) {
                return badRequest(res, `Debe enviar 'sueldo_currency' válida (${Object.values(Currency).join(', ')})`);
            }

            const updated = await this.userService.updateSueldo(
                userId,
                sueldoNumber,
                sueldo_currency
            );

            res.json({
                message: "Sueldo actualizado",
                data: updated,
            });
        } catch (err) {
            return handleError(res, err);
        }
    };
}
