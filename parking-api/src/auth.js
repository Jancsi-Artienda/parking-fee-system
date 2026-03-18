import jwt from "jsonwebtoken";
import { getJwtSecret } from "./jwt.js";

const AUTH_COOKIE_NAME = "access_token";

function parseCookies(cookieHeader = "") {
  const cookies = {};
  if (!cookieHeader) return cookies;

  for (const entry of cookieHeader.split(";")) {
    const [rawKey, ...rawValue] = entry.trim().split("=");
    if (!rawKey) continue;
    cookies[rawKey] = decodeURIComponent(rawValue.join("=") || "");
  }

  return cookies;
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  const cookies = parseCookies(req.headers.cookie || "");
  return cookies[AUTH_COOKIE_NAME] || "";
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

export { AUTH_COOKIE_NAME, getBearerToken, requireAuth, parseCookies };
