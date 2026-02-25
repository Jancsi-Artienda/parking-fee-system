import express from "express";
import {
  forgotPassword,
  login,
  register,
  updateProfile,
} from "../controller/auth.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.patch("/profile", updateProfile);

export default router;
