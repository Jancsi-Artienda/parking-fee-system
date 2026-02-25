import pool from "../db.js";

async function getEmployeeIdByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT employee_id
     FROM users
     WHERE usertable_id = ?
     LIMIT 1`,
    [userId]
  );

  if (rows.length === 0) {
    return null;
  }

  const employeeId = Number(rows[0].employee_id);
  return Number.isInteger(employeeId) && employeeId > 0 ? employeeId : null;
}

export async function getReports(req, res) {
  try {
    const employeeId = await getEmployeeIdByUserId(req.user.id);
    if (!employeeId) {
      return res.status(404).json({ message: "User record not found." });
    }

    const [rows] = await pool.query(
      `SELECT
        trans_date,
        coverage_from,
        coverage_to,
        vehicle_model,
        amount,
        temp_name,
        created_date
      FROM temp_ticket
      WHERE employee_id = ?
      ORDER BY created_date DESC, trans_date DESC`,
      [employeeId]
    );

    return res.json(
      rows.map((row, index) => ({
        id: `${employeeId}-${index + 1}-${row.created_date || row.trans_date || Date.now()}`,
        transDate: row.trans_date || "",
        coverageFrom: row.coverage_from || "",
        coverageTo: row.coverage_to || "",
        vehicleModel: row.vehicle_model || "",
        amount: Number(row.amount || 0),
        tempName: row.temp_name || "",
        createdDate: row.created_date || "",
      }))
    );
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch reports.", detail: error.message });
  }
}

export async function addReport(req, res) {
  const {
    vehicleId = "",
    transDate = "",
    amount = "",
    tempName = "",
    coverageFrom = null,
    coverageTo = null,
  } = req.body || {};

  if (!String(vehicleId).trim() || !String(transDate).trim() || amount === "") {
    return res.status(400).json({ message: "Vehicle, date, and amount are required." });
  }

  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ message: "Amount must be greater than 0." });
  }

  try {
    const employeeId = await getEmployeeIdByUserId(req.user.id);
    if (!employeeId) {
      return res.status(404).json({ message: "User record not found." });
    }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM temp_ticket
       WHERE employee_id = ?`,
      [employeeId]
    );
    const reportCount = Number(countRows[0]?.total || 0);
    if (reportCount >= 15) {
      return res.status(400).json({
        message: "Report limit reached (15). You cannot add more reports.",
      });
    }

    const [duplicateRows] = await pool.query(
      `SELECT 1
       FROM temp_ticket
       WHERE employee_id = ?
         AND DATE(trans_date) = DATE(?)
       LIMIT 1`,
      [employeeId, transDate]
    );

    if (duplicateRows.length > 0) {
      return res.status(409).json({ message: "A report for this date already exists." });
    }

    const [vehicleRows] = await pool.query(
      `SELECT vehicle, vehicle_model, vehicle_plate
       FROM rfvehicle
       WHERE ticket_num = ? AND employee_id = ?
       LIMIT 1`,
      [Number(vehicleId), employeeId]
    );

    if (vehicleRows.length === 0) {
      return res.status(404).json({ message: "Selected vehicle was not found." });
    }

    const vehicleType = (vehicleRows[0].vehicle || "").trim();
    const vehicleName = (vehicleRows[0].vehicle_model || "").trim();
    const vehiclePlate = (vehicleRows[0].vehicle_plate || "").trim();
    const vehicleModel = [vehicleType, vehicleName, vehiclePlate].filter(Boolean).join(" / ");

    await pool.query(
      `INSERT INTO temp_ticket
      (employee_id, coverage_from, coverage_to, trans_date, vehicle_model, amount, temp_name, created_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        employeeId,
        coverageFrom || null,
        coverageTo || null,
        transDate,
        vehicleModel,
        parsedAmount,
        tempName.trim(),
      ]
    );

    return res.status(201).json({
      transDate,
      coverageFrom: coverageFrom || "",
      coverageTo: coverageTo || "",
      vehicleModel,
      amount: parsedAmount,
      tempName: tempName.trim(),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create report.", detail: error.message });
  }
}
