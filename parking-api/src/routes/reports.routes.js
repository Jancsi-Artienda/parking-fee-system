import express from "express";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../jwt.js";
import { addReport, getReports } from "../controller/reports.controller.js";

const router = express.Router();

function getBearerToken(req) {
  const authHeader = req.headers.authorization || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
}

function requireAuth(req, res, next) {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    const employeeId = Number(payload.employeeId);
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      return res.status(401).json({ message: "Invalid token payload. Please log in again." });
    }
    req.user = {
      id: Number(payload.sub),
      employeeId,
      email: payload.email,
    };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token." });
  }
}

router.get("/", requireAuth, getReports);
router.post("/", requireAuth, addReport);

export default router;
