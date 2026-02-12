import { Request, Response } from "express";
import { z } from "zod";
import * as service from "../services/user.service";
import { ServiceError } from "../utils/errors";

const UserSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
});

export const createUser = async (req: Request, res: Response) => {
  try {
    const validation = UserSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ ok: false, error: validation.error.format() });
    }

    const user = await service.register(validation.data);
    return res.status(201).json({ ok: true, user });
  } catch (err: any) {
    if (err instanceof ServiceError) {
      return res.status(err.statusCode).json({ ok: false, error: err.message });
    }
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "Email and password are required" });
    }

    const data = await service.login(email, password);
    return res.json({ ok: true, ...data });
  } catch (err: any) {
    if (err instanceof ServiceError) {
      return res.status(err.statusCode).json({ ok: false, error: err.message });
    }
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id || "");
    if (isNaN(id)) return res.status(400).json({ ok: false, error: "Invalid ID" });

    await service.removeUser(id);
    return res.json({ ok: true, message: "User deleted successfully" });
  } catch (err: any) {
    if (err instanceof ServiceError) {
      return res.status(err.statusCode).json({ ok: false, error: err.message });
    }
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};