import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import { z } from "zod";
import pool from "../db";

/* USE THIS AFTER DEVELOPMENT
const UserSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
});
*/

const UserSchema = z.object({
    username: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(1),
  });

export const createUser = async (req: Request, res: Response) => {
  try {
    let userData;
    
    const validation = UserSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ ok: false, error: validation.error.format() });
    }
    userData = validation.data;

    const { username, email, password } = userData;
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING user_id, username, email, created_at;`,
      [username, email, passwordHash]
    );

    return res.status(201).json({ ok: true, user: result.rows[0] });
  } catch (err: any) {
    if (err.code === "23505") {
      return res
        .status(409)
        .json({ ok: false, error: "Email or username already exists" });
    }

    console.error("Error creating user:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id!);

    if (isNaN(id)) {
      return res
        .status(400)
        .json({ ok: false, error: "Invalid user ID format" });
    }

    const result = await pool.query(
      "DELETE FROM users WHERE user_id = $1 RETURNING user_id",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    return res.json({ ok: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};


export const loginUser = async (req: Request, res: Response) => {
    try {
        //TODO: Validate input

        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ ok: false, error: "Email and password are required" });
        }

        console.log(email, password);


        const result = await pool.query("SELECT * FROM users WHERE email = $1", [req.body.email]);
        console.log(result);
        const user = result.rows[0];

        console.log(user);

        if (!user) {
            return res.status(401).json({ ok: false, error: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(req.body.password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ ok: false, error: "Invalid email or password" });
        }

        const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET!, { expiresIn: "1h" });

        return res.json({ ok: true, token, user: { id: user.user_id, username: user.username, email: user.email } });

    } catch (err: any) {
        console.error("Error logging in user:", err);
        return res.status(500).json({ ok: false, error: "Internal server error" });
    }
};
