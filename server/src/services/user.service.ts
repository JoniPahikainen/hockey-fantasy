import bcrypt from "bcrypt";
import { createToken } from "../middleware/auth";
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

  const token = createToken({ userId: user.user_id, role: user.role });

  return {
    token,
    user: {
      id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      dark_mode: Boolean(user.dark_mode),
    },
  };
};

export const removeUser = async (id: number) => {
  const result = await repo.deleteById(id);
  if (result.rowCount === 0) throw new ServiceError("User not found", 404);
  return true;
};

export const updateUsername = async (userId: number, username: string) => {
  const trimmed = username.trim();
  if (!trimmed) throw new ServiceError("Username is required", 400);
  const taken = await repo.isUsernameTaken(trimmed, userId);
  if (taken) throw new ServiceError("Username already taken", 409);
  const updated = await repo.updateUsername(userId, trimmed);
  if (!updated) throw new ServiceError("User not found", 404);
  return { username: updated.username, email: updated.email, role: updated.role };
};

export const changePassword = async (
  userId: number,
  oldPassword: string,
  newPassword: string
) => {
  const user = await repo.findById(userId);
  if (!user) throw new ServiceError("User not found", 404);
  const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
  if (!isMatch) throw new ServiceError("Current password is incorrect", 401);
  if (!newPassword || newPassword.length < 1)
    throw new ServiceError("New password is required", 400);
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);
  await repo.updatePassword(userId, passwordHash);
  return true;
};

export const getSettings = async (userId: number) => {
  const settings = await repo.getUserSettings(userId);
  if (!settings) throw new ServiceError("Settings not found", 404);
  return settings;
};

export const updateDarkMode = async (userId: number, darkMode: boolean) => {
  const settings = await repo.updateUserDarkMode(userId, darkMode);
  if (!settings) throw new ServiceError("Failed to update settings", 500);
  return settings;
};