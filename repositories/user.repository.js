import { executeQuery } from '../db.js';

export class UserRepository {
    async updatePreferredCurrency(userId, preferredCurrency) {
        return await executeQuery(
            `UPDATE users
             SET preferred_currency = $2
             WHERE id = $1
             RETURNING id, name, email, avatar, firebase_user_id, preferred_currency, sueldo`,
            [userId, preferredCurrency], true
        );
    }

    async updateSueldo(userId, sueldo) {
        return await executeQuery(
            `UPDATE users
             SET sueldo = $2
             WHERE id = $1
             RETURNING id, name, email, avatar, firebase_user_id, preferred_currency, sueldo`,
            [userId, sueldo], true
        );
    }
}
