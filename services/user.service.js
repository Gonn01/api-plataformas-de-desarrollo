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
            throw new Error("Usuario no encontrado");
        }

        return rows[0];
    }

    async updateSueldo(userId, sueldo) {
        const rows = await this.userRepository.updateSueldo(userId, sueldo);

        if (rows.length === 0) {
            throw new Error("Usuario no encontrado");
        }

        return rows[0];
    }
}
