import { executeQuery } from '../db.js';

export class AuthRepository {
    async findUserByEmail(email) {
        return await executeQuery(
            "SELECT * FROM users WHERE email = $1 LIMIT 1",
            [email]
        );
    }

    async findUserByFirebaseId(firebaseId) {
        return await executeQuery(
            "SELECT * FROM users WHERE firebase_user_id = $1 LIMIT 1",
            [firebaseId]
        );
    }

    async createUser(name, email, hash, firebaseId) {
        return await executeQuery(
            `INSERT INTO users (name, email, password, firebase_user_id, created_at)
             VALUES ($1, $2, $3, $4, NOW())
             RETURNING id, name, email`,
            [name, email, hash, firebaseId]
        );
    }
}