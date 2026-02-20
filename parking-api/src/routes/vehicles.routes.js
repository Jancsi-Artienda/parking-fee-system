import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/", async (_req, res) => {
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
      ORDER BY ticket_num DESC`
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

router.post("/", async (req, res) => {
  const { type = "", name = "", plate = "", color = "" } = req.body || {};

  if (!type.trim() || !name.trim() || !plate.trim()) {
    return res.status(400).json({ message: "Type, name, and plate are required." });
  }

  try {
    await pool.query(
      `INSERT INTO rfvehicle
      (employee_id, vehicle, vehicle_model, vehicle_plate, vehicle_color, created_date)
      VALUES (?, ?, ?, ?, ?, NOW())`,
      [0, type.trim(), name.trim(), plate.trim(), color.trim()]
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
      ORDER BY ticket_num DESC
      LIMIT 1`
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
