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

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);
router.post("/change-password", changePassword);
router.patch("/profile", updateProfile);

export default router;
