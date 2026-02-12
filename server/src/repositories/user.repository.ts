import pool from "../db";

export const createUser = async (username: string, email: string, passwordHash: string) => {
  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING user_id, username, email, created_at;`,
    [username, email, passwordHash]
  );
  return result.rows[0];
};

export const findByEmail = async (email: string) => {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0];
};

export const deleteById = async (id: number) => {
  return await pool.query(
    "DELETE FROM users WHERE user_id = $1 RETURNING user_id",
    [id]
  );
};