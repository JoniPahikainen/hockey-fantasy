import pool from "../db";

export const createUser = async (username: string, email: string, passwordHash: string) => {
  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING user_id, username, email, role, created_at;`,
    [username, email, passwordHash]
  );
  return result.rows[0];
};

export const findByEmail = async (email: string) => {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0];
};

export const findById = async (id: number) => {
  const result = await pool.query(
    "SELECT user_id, username, email, password_hash, role FROM users WHERE user_id = $1",
    [id]
  );
  return result.rows[0];
};

export const updateUsername = async (userId: number, username: string) => {
  const result = await pool.query(
    "UPDATE users SET username = $1 WHERE user_id = $2 RETURNING user_id, username, email, role",
    [username.trim(), userId]
  );
  return result.rows[0];
};

export const updatePassword = async (userId: number, passwordHash: string) => {
  await pool.query(
    "UPDATE users SET password_hash = $1 WHERE user_id = $2",
    [passwordHash, userId]
  );
};

export const isUsernameTaken = async (username: string, excludeUserId?: number) => {
  const result = excludeUserId
    ? await pool.query(
        "SELECT 1 FROM users WHERE username = $1 AND user_id != $2",
        [username.trim(), excludeUserId]
      )
    : await pool.query("SELECT 1 FROM users WHERE username = $1", [username.trim()]);
  return (result.rowCount ?? 0) > 0;
};

export const deleteById = async (id: number) => {
  return await pool.query(
    "DELETE FROM users WHERE user_id = $1 RETURNING user_id",
    [id]
  );
};