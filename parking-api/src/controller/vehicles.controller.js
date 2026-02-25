import pool from "../db.js";

async function getEmployeeContext(userId) {
  let rows;
  try {
    const [vehicleNumberRows] = await pool.query(
      `SELECT employee_id, vehicle_number
       FROM users
       WHERE usertable_id = ?
       LIMIT 1`,
      [userId]
    );
    rows = vehicleNumberRows;
  } catch (error) {
    if (error?.code !== "ER_BAD_FIELD_ERROR") {
      throw error;
    }

    const [vehicleLimitRows] = await pool.query(
      `SELECT employee_id, vehicle_limit AS vehicle_number
       FROM users
       WHERE usertable_id = ?
       LIMIT 1`,
      [userId]
    );
    rows = vehicleLimitRows;
  }

  if (rows.length === 0) {
    return null;
  }

  return {
    employeeId: Number(rows[0].employee_id),
    vehicleLimit: Number(rows[0].vehicle_number || 0),
  };
}

export async function getVehicles(req, res) {
  try {
    const context = await getEmployeeContext(req.user.id);
    if (!context || !Number.isInteger(context.employeeId) || context.employeeId <= 0) {
      return res.status(404).json({ message: "User record not found." });
    }

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
      ORDER BY ticket_num DESC`,
      [context.employeeId]
    );

    return res.json(
      rows.map((row) => ({
        id: row.ticket_num,
        type: row.vehicle || "",
        name: row.vehicle_model || "",
        plate: row.vehicle_plate || "",
        color: row.vehicle_color || "",
        registered: row.created_date ? new Date(row.created_date).toLocaleDateString() : "",
      }))
    );
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch vehicles.", detail: error.message });
  }
}

export async function addVehicle(req, res) {
  const { type = "", name = "", plate = "", color = "" } = req.body || {};
  const normalizedType = type.trim();
  const normalizedName = name.trim().toUpperCase();
  const normalizedPlate = plate.trim().toUpperCase();
  const normalizedColor = color.trim().toUpperCase();

  if (!normalizedType || !normalizedName || !normalizedPlate) {
    return res.status(400).json({ message: "Type, name, and plate are required." });
  }

  try {
    const context = await getEmployeeContext(req.user.id);
    if (!context || !Number.isInteger(context.employeeId) || context.employeeId <= 0) {
      return res.status(404).json({ message: "User record not found." });
    }
    const maxVehicles = context.vehicleLimit;

    const [countRows] = await pool.query(
      "SELECT COUNT(*) AS total FROM rfvehicle WHERE employee_id = ?",
      [context.employeeId]
    );
    const currentCount = Number(countRows[0]?.total || 0);

    if (maxVehicles > 0 && currentCount >= maxVehicles) {
      return res.status(400).json({
        message: `Vehicle limit reached (${maxVehicles}). You cannot add more vehicles.`,
      });
    }

    await pool.query(
      `INSERT INTO rfvehicle
      (employee_id, vehicle, vehicle_model, vehicle_plate, vehicle_color, created_date)
      VALUES (?, ?, ?, ?, ?, NOW())`,
      [context.employeeId, normalizedType, normalizedName, normalizedPlate, normalizedColor]
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
      LIMIT 1`,
      [context.employeeId]
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
    if (error?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Vehicle plate already exists for this user." });
    }
    return res.status(500).json({ message: "Failed to add vehicle.", detail: error.message });
  }
}

export async function deleteVehicle(req, res) {
  const ticketNum = Number(req.params.id);
  if (!Number.isInteger(ticketNum) || ticketNum <= 0) {
    return res.status(400).json({ message: "Invalid vehicle id." });
  }

  try {
    const context = await getEmployeeContext(req.user.id);
    if (!context || !Number.isInteger(context.employeeId) || context.employeeId <= 0) {
      return res.status(404).json({ message: "User record not found." });
    }

    const [result] = await pool.query(
      `DELETE FROM rfvehicle
       WHERE ticket_num = ? AND employee_id = ?
       LIMIT 1`,
      [ticketNum, context.employeeId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Vehicle not found." });
    }

    return res.json({ message: "Vehicle deleted successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete vehicle.", detail: error.message });
  }
}
