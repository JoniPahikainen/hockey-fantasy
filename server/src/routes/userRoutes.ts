import { Router } from "express";
import {
  createUser,
  deleteUser,
  loginUser,
  updateProfile,
  updatePassword,
  getSettings,
  updateSettings,
} from "../controllers/user.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/user/register", createUser);
router.post("/user/login", loginUser);
router.delete("/user/:id", deleteUser);

router.patch("/user/profile", authenticate, updateProfile);
router.patch("/user/password", authenticate, updatePassword);
router.get("/user/settings", authenticate, getSettings);
router.patch("/user/settings", authenticate, updateSettings);

export default router;


