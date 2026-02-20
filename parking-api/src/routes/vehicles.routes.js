import express from "express";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import { getJwtSecret } from "../jwt.js";

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
    req.user = {
      id: Number(payload.sub),
      email: payload.email,
    };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token." });
  }
}

router.get("/", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        ticket_num,
        vehicle,
        vehicle_model,
        vehicle_plate,
        vehicle_color,
        created_date
      FROM rfvehicle
      WHERE employee_id = ?
      ORDER BY ticket_num DESC`
      ,
      [req.user.id]
    );

    return res.json(
      rows.map((row) => ({
        id: row.ticket_num,
        type: row.vehicle || "",
        name: row.vehicle_model || "",
        plate: row.vehicle_plate || "",
        color: row.vehicle_color || "",
        registered: row.created_date
          ? new Date(row.created_date).toLocaleDateString()
          : "",
      }))
    );
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch vehicles.", detail: error.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  const { type = "", name = "", plate = "", color = "" } = req.body || {};

  if (!type.trim() || !name.trim() || !plate.trim()) {
    return res.status(400).json({ message: "Type, name, and plate are required." });
  }

  try {
    await pool.query(
      `INSERT INTO rfvehicle
      (employee_id, vehicle, vehicle_model, vehicle_plate, vehicle_color, created_date)
      VALUES (?, ?, ?, ?, ?, NOW())`,
      [req.user.id, type.trim(), name.trim(), plate.trim(), color.trim()]
    );

    const [rows] = await pool.query(
      `SELECT
        ticket_num,
        vehicle,
        vehicle_model,
        vehicle_plate,
        vehicle_color,
        created_date
      FROM rfvehicle
      WHERE employee_id = ?
      ORDER BY ticket_num DESC
      LIMIT 1`
      ,
      [req.user.id]
    );

    const row = rows[0];
    return res.status(201).json({
      id: row.ticket_num,
      type: row.vehicle || "",
      name: row.vehicle_model || "",
      plate: row.vehicle_plate || "",
      color: row.vehicle_color || "",
      registered: row.created_date ? new Date(row.created_date).toLocaleDateString() : "",
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to add vehicle.", detail: error.message });
  }
});

export default router;
