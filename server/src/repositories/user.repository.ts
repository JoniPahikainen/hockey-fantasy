import pool from "../db";

export const createUser = async (username: string, email: string, passwordHash: string) => {
  const result = await pool.query(
    `WITH inserted_user AS (
       INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING user_id, username, email, role, created_at
     ),
     inserted_settings AS (
       INSERT INTO settings (user_id)
       SELECT user_id FROM inserted_user
       ON CONFLICT (user_id) DO NOTHING
     )
     SELECT user_id, username, email, role, created_at
     FROM inserted_user;`,
    [username, email, passwordHash]
  );
  return result.rows[0];
};

export const findByEmail = async (email: string) => {
  const result = await pool.query(
    `
    SELECT
      u.*,
      COALESCE(s.dark_mode, false) AS dark_mode
    FROM users u
    LEFT JOIN settings s ON s.user_id = u.user_id
    WHERE u.email = $1
    `,
    [email]
  );
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

export const getUserSettings = async (userId: number) => {
  const result = await pool.query(
    `
    WITH upsert AS (
      INSERT INTO settings (user_id)
      VALUES ($1)
      ON CONFLICT (user_id) DO NOTHING
      RETURNING user_id
    )
    SELECT user_id, email_notifications, dark_mode
    FROM settings
    WHERE user_id = $1
    `,
    [userId]
  );
  return result.rows[0];
};

export const updateUserDarkMode = async (userId: number, darkMode: boolean) => {
  const result = await pool.query(
    `
    INSERT INTO settings (user_id, dark_mode)
    VALUES ($1, $2)
    ON CONFLICT (user_id) DO UPDATE
      SET dark_mode = EXCLUDED.dark_mode
    RETURNING user_id, email_notifications, dark_mode
    `,
    [userId, darkMode]
  );
  return result.rows[0];
};