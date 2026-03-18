import express from "express";
import {
  changePassword,
  forgotPassword,
  login,
  logout,
  register,
  resetPassword,
  updateProfile,
  verifyOtp,
} from "../controller/auth.controller.js";
import { requireAuth } from "../auth.js";
import { requireCsrf } from "../csrf.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", requireAuth, requireCsrf, logout);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);
router.post("/change-password", requireCsrf, changePassword);
router.patch("/profile", requireCsrf, updateProfile);

export default router;
