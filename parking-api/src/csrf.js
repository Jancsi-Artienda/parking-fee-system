import { randomBytes } from "crypto";
import { parseCookies } from "./auth.js";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function getAllowedOrigins() {
  return (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function getRequestOrigin(req) {
  const origin = req.headers.origin;
  if (origin) return origin;
  const referer = req.headers.referer;
  if (!referer) return "";
  try {
    return new URL(referer).origin;
  } catch {
    return "";
  }
}

function isOriginAllowed(origin) {
  if (!origin) {
    return true;
  }

  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.length === 0) {
    return origin === "http://localhost:5173";
  }

  return allowedOrigins.includes(origin);
}

function csrfCookieOptions() {
  return {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

function createCsrfToken() {
  return randomBytes(32).toString("hex");
}

function setCsrfCookie(res, token) {
  res.cookie(CSRF_COOKIE_NAME, token, csrfCookieOptions());
}

function clearCsrfCookie(res) {
  res.clearCookie(CSRF_COOKIE_NAME, csrfCookieOptions());
}

function requireCsrf(req, res, next) {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const origin = getRequestOrigin(req);
  if (!isOriginAllowed(origin)) {
    return res.status(403).json({ message: "Blocked by CSRF origin policy." });
  }

  const cookies = parseCookies(req.headers.cookie || "");
  const cookieToken = cookies[CSRF_COOKIE_NAME] || "";
  const headerToken = String(req.headers[CSRF_HEADER_NAME] || "");

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ message: "CSRF token mismatch." });
  }

  return next();
}

export {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  createCsrfToken,
  setCsrfCookie,
  clearCsrfCookie,
  requireCsrf,
};
