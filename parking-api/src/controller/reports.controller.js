import pool from "../db.js";

async function getTableColumns(tableName) {
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?`,
    [tableName]
  );

  return new Set(rows.map((row) => String(row.COLUMN_NAME || "").toLowerCase()));
}

async function getVarcharLength(tableName, columnName) {
  const [rows] = await pool.query(
    `SELECT CHARACTER_MAXIMUM_LENGTH AS maxLength
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?
     LIMIT 1`,
    [tableName, columnName]
  );

  const maxLength = Number(rows[0]?.maxLength);
  return Number.isInteger(maxLength) && maxLength > 0 ? maxLength : null;
}

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
    const tempTicketColumns = await getTableColumns("temp_ticket");
    const hasCoverageFrom = tempTicketColumns.has("coverage_from");
    const hasCoverageTo = tempTicketColumns.has("coverage_to");
    const hasTempName = tempTicketColumns.has("temp_name");
    const hasCreatedDate = tempTicketColumns.has("created_date");

    const [rows] = await pool.query(
      `SELECT
        trans_date,
        ${hasCoverageFrom ? "coverage_from" : "NULL AS coverage_from"},
        ${hasCoverageTo ? "coverage_to" : "NULL AS coverage_to"},
        vehicle_model,
        amount,
        ${hasTempName ? "temp_name" : "NULL AS temp_name"},
        ${hasCreatedDate ? "created_date" : "NULL AS created_date"}
      FROM temp_ticket
      WHERE employee_id = ?
      ORDER BY ${hasCreatedDate ? "created_date DESC," : ""} trans_date DESC`,
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
    const tempTicketColumns = await getTableColumns("temp_ticket");
    const vehicleModelMaxLength = await getVarcharLength("temp_ticket", "vehicle_model");
    const hasCoverageFrom = tempTicketColumns.has("coverage_from");
    const hasCoverageTo = tempTicketColumns.has("coverage_to");
    const hasTempName = tempTicketColumns.has("temp_name");
    const hasCreatedDate = tempTicketColumns.has("created_date");

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
    const composedVehicleModel = [vehicleType, vehicleName, vehiclePlate].filter(Boolean).join(" / ");
    const vehicleModel =
      vehicleModelMaxLength && composedVehicleModel.length > vehicleModelMaxLength
        ? composedVehicleModel.slice(0, vehicleModelMaxLength)
        : composedVehicleModel;

    const insertColumns = ["employee_id"];
    const insertValues = ["?"];
    const insertParams = [employeeId];

    if (hasCoverageFrom) {
      insertColumns.push("coverage_from");
      insertValues.push("?");
      insertParams.push(coverageFrom || null);
    }

    if (hasCoverageTo) {
      insertColumns.push("coverage_to");
      insertValues.push("?");
      insertParams.push(coverageTo || null);
    }

    insertColumns.push("trans_date", "vehicle_model", "amount");
    insertValues.push("?", "?", "?");
    insertParams.push(transDate, vehicleModel, parsedAmount);

    if (hasTempName) {
      insertColumns.push("temp_name");
      insertValues.push("?");
      insertParams.push(tempName.trim());
    }

    if (hasCreatedDate) {
      insertColumns.push("created_date");
      insertValues.push("NOW()");
    }

    await pool.query(
      `INSERT INTO temp_ticket (${insertColumns.join(", ")})
       VALUES (${insertValues.join(", ")})`,
      insertParams
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
    if (error?.code === "ER_BAD_FIELD_ERROR") {
      return res.status(500).json({
        message: "Report table schema is incompatible. Please run the latest migration.",
        detail: error.message,
      });
    }
    if (error?.code === "ER_DATA_TOO_LONG") {
      return res.status(400).json({
        message: `A report field exceeded allowed length: ${error.message}`,
        detail: error.message,
      });
    }
    if (error?.code === "ER_NO_DEFAULT_FOR_FIELD") {
      return res.status(500).json({
        message: `Database schema requires an additional field: ${error.message}`,
        detail: error.message,
      });
    }
    if (error?.code === "ER_BAD_NULL_ERROR") {
      return res.status(500).json({
        message: `A required report column cannot be null: ${error.message}`,
        detail: error.message,
      });
    }
    if (error?.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        message: `Foreign key validation failed while creating report: ${error.message}`,
        detail: error.message,
      });
    }
    return res.status(500).json({ message: "Failed to create report.", detail: error.message });
  }
}
