import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as repo from "../repositories/user.repository";
import { ServiceError } from "../utils/errors";

export const register = async (userData: any) => {
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(userData.password, saltRounds);

  try {
    return await repo.createUser(userData.username, userData.email, passwordHash);
  } catch (err: any) {
    if (err.code === "23505") {
      throw new ServiceError("Email or username already exists", 409);
    }
    throw err;
  }
};

export const login = async (email: string, password: string) => {
  const user = await repo.findByEmail(email);
  if (!user) throw new ServiceError("Invalid email or password", 401);

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) throw new ServiceError("Invalid email or password", 401);

  const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET!, { expiresIn: "1h" });
  
  return {
    token,
    user: { id: user.user_id, username: user.username, email: user.email }
  };
};

export const removeUser = async (id: number) => {
  const result = await repo.deleteById(id);
  if (result.rowCount === 0) throw new ServiceError("User not found", 404);
  return true;
};