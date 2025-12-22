import { Request, Response } from 'express';
import pool from '../db';

export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body as {
      username?: string;
      email?: string;
      password?: string;
    };

    if (!username || !email || !password) {
      return res.status(400).json({ ok: false, error: 'username, email and password are required' });
    }

    const result = await pool.query(
      `
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING user_id, username, email, created_at;
      `,
      [username, email, password],
    );

    return res.status(201).json({ ok: true, user: result.rows[0] });
  } catch (err) {
    console.error('Error creating user:', err);
    return res.status(500).json({ ok: false, error: 'Failed to create user' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: 'Invalid user id' });
    }

    const result = await pool.query(
      `
      DELETE FROM users
      WHERE user_id = $1
      RETURNING user_id, username, email, created_at;
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    return res.json({ ok: true, user: result.rows[0] });
  } catch (err) {
    console.error('Error deleting user:', err);
    return res.status(500).json({ ok: false, error: 'Failed to delete user' });
  }
};


