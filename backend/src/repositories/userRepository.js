const db = require('../database');

class UserRepository {
  // Inserts a new user record and returns the safe user profile without password_hash
  async create({ name, email, passwordHash, role = 'user' }) {
    const text = `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, is_verified, created_at, updated_at;
    `;
    const params = [name, email, passwordHash, role];
    const { rows } = await db.query(text, params);
    return rows[0];
  }

  // Finds a user by email, returning the password_hash for credential validation
  async findByEmail(email) {
    const text = `
      SELECT id, name, email, password_hash, role, is_verified, created_at, updated_at
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1;
    `;
    const { rows } = await db.query(text, [email]);
    return rows[0] || null;
  }

  // Finds a user by ID without exposing the password_hash
  async findById(id) {
    const text = `
      SELECT id, name, email, role, is_verified, created_at, updated_at
      FROM users
      WHERE id = $1
      LIMIT 1;
    `;
    const { rows } = await db.query(text, [id]);
    return rows[0] || null;
  }

  // Returns the total count of registered users
  async count() {
    const { rows } = await db.query('SELECT COUNT(*) AS total FROM users;');
    return parseInt(rows[0].total, 10);
  }
}

module.exports = new UserRepository();
