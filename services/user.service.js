import { customError, ErrorCode } from "../utils/errors.js";

export class UserService {
    constructor({
        userRepository
    }) {
        this.userRepository = userRepository;
    }

    async updatePreferredCurrency(userId, preferredCurrency) {
        const rows = await this.userRepository.updatePreferredCurrency(
            userId,
            preferredCurrency
        );

        if (rows.length === 0) {
            throw customError(ErrorCode.USUARIO_NOT_FOUND);
        }

        return rows[0];
    }

    async updateSueldo(userId, sueldo, sueldoCurrency) {
        const rows = await this.userRepository.updateSueldo(userId, sueldo, sueldoCurrency);

        if (rows.length === 0) {
            throw customError(ErrorCode.USUARIO_NOT_FOUND);
        }

        return rows[0];
    }
}
