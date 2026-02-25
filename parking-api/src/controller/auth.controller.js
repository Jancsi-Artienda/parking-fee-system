import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import pool from "../db.js";
import { getJwtSecret } from "../jwt.js";

const GMAIL_REGEX = /^[^\s@]+@gmail\.com$/i;

function splitFullName(name = "") {
  const trimmed = name.trim();
  if (!trimmed) {
    return { firstName: "", lastName: "" };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

async function hasContactNumberColumn() {
  const [rows] = await pool.query(
    `SELECT 1
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'users'
       AND COLUMN_NAME = 'contact_number'
     LIMIT 1`
  );

  return rows.length > 0;
}

async function hasVehicleNumberColumn() {
  const [rows] = await pool.query(
    `SELECT 1
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'users'
       AND COLUMN_NAME = 'vehicle_number'
     LIMIT 1`
  );

  return rows.length > 0;
}

export async function register(req, res) {
  const {
    firstName = "",
    lastName = "",
    email = "",
    contactNumber = "",
    username = "",
    password = "",
    confirmPassword = "",
    vehicleNumber = "",
  } = req.body || {};

  const normalized = {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim().toLowerCase(),
    contactNumber: contactNumber.trim(),
    username: username.trim(),
    password,
    confirmPassword,
    vehicleNumber: String(vehicleNumber).trim(),
  };

  if (
    !normalized.firstName ||
    !normalized.lastName ||
    !normalized.email ||
    !normalized.contactNumber ||
    !normalized.username ||
    !normalized.password ||
    !normalized.confirmPassword ||
    !normalized.vehicleNumber
  ) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (normalized.password !== normalized.confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  if (!GMAIL_REGEX.test(normalized.email)) {
    return res.status(400).json({ message: "Email must be a valid @gmail.com address." });
  }

  if (!/^\d{11}$/.test(normalized.contactNumber)) {
    return res.status(400).json({ message: "Contact number must be exactly 11 digits." });
  }

  const parsedVehicleNumber = Number(normalized.vehicleNumber);
  if (!Number.isInteger(parsedVehicleNumber) || parsedVehicleNumber < 1) {
    return res.status(400).json({ message: "Number of vehicles must be at least 1." });
  }

  try {
    const canStoreContactNumber = await hasContactNumberColumn();
    const canStoreVehicleNumber = await hasVehicleNumberColumn();

    const [existing] = await pool.query(
      "SELECT usertable_id FROM users WHERE company_email = ? OR username = ? LIMIT 1",
      [normalized.email, normalized.username]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: "Email or username already exists." });
    }

    const [employeeIdRows] = await pool.query(
      "SELECT COALESCE(MAX(employee_id), 0) + 1 AS nextEmployeeId FROM users"
    );
    const nextEmployeeId = employeeIdRows[0].nextEmployeeId;

    const passwordHash = await bcrypt.hash(normalized.password, 10);

    if (canStoreContactNumber && canStoreVehicleNumber) {
      await pool.query(
        `INSERT INTO users
        (employee_id, username, password, last_name, first_name, company_email, job_role, contact_number, vehicle_number, created_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          nextEmployeeId,
          normalized.username,
          passwordHash,
          normalized.lastName,
          normalized.firstName,
          normalized.email,
          "Employee",
          normalized.contactNumber,
          parsedVehicleNumber,
        ]
      );
    } else if (canStoreContactNumber) {
      await pool.query(
        `INSERT INTO users
        (employee_id, username, password, last_name, first_name, company_email, job_role, contact_number, created_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          nextEmployeeId,
          normalized.username,
          passwordHash,
          normalized.lastName,
          normalized.firstName,
          normalized.email,
          "Employee",
          normalized.contactNumber,
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO users
        (employee_id, username, password, last_name, first_name, company_email, job_role, created_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          nextEmployeeId,
          normalized.username,
          passwordHash,
          normalized.lastName,
          normalized.firstName,
          normalized.email,
          "Employee",
        ]
      );
    }

    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed.", detail: error.message });
  }
}

export async function login(req, res) {
  const { email = "", password = "" } = req.body || {};

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const canReadContactNumber = await hasContactNumberColumn();
    const canReadVehicleNumber = await hasVehicleNumberColumn();
    const selectQuery = canReadContactNumber
      ? `SELECT usertable_id, employee_id, username, first_name, last_name, company_email, contact_number, ${
          canReadVehicleNumber ? "vehicle_number," : ""
        } password
         FROM users
         WHERE company_email = ?
         LIMIT 1`
      : `SELECT usertable_id, employee_id, username, first_name, last_name, company_email, ${
          canReadVehicleNumber ? "vehicle_number," : ""
        } password
         FROM users
         WHERE company_email = ?
         LIMIT 1`;

    const [rows] = await pool.query(selectQuery, [normalizedEmail]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { sub: user.usertable_id, employeeId: user.employee_id, email: user.company_email },
      getJwtSecret(),
      { expiresIn: "7d" }
    );

    return res.json({
      id: user.usertable_id,
      employeeId: user.employee_id,
      username: user.username || "",
      name: `${user.first_name} ${user.last_name}`.trim(),
      email: user.company_email,
      contactNumber: user.contact_number || "",
      vehicleNumber: canReadVehicleNumber ? Number(user.vehicle_number || 0) : null,
      token,
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed.", detail: error.message });
  }
}

export async function forgotPassword(req, res) {
  const { email = "" } = req.body || {};
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return res.status(400).json({ message: "Email is required." });
  }

  if (!GMAIL_REGEX.test(normalizedEmail)) {
    return res.status(400).json({ message: "Email must be a valid @gmail.com address." });
  }

  try {
    const [rows] = await pool.query(
      "SELECT usertable_id FROM users WHERE company_email = ? LIMIT 1",
      [normalizedEmail]
    );

    if (rows.length > 0) {
      const resetToken = randomBytes(24).toString("hex");
      await pool.query(
        "UPDATE users SET reset_token = ? WHERE company_email = ? LIMIT 1",
        [resetToken, normalizedEmail]
      );
    }

    return res.json({
      message: "If an account exists for this email, a reset link has been sent.",
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to process forgot password.", detail: error.message });
  }
}

export async function updateProfile(req, res) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  let payload;
  try {
    payload = jwt.verify(token, getJwtSecret());
  } catch {
    return res.status(401).json({ message: "Invalid token." });
  }

  const { username = "", name = "", email = "", contactNumber = "" } = req.body || {};

  const normalizedUsername = username.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedContactNumber = contactNumber.trim();
  const { firstName, lastName } = splitFullName(name);

  if (!normalizedUsername || !name.trim() || !normalizedEmail || !normalizedContactNumber) {
    return res.status(400).json({ message: "Username, name, email, and contact number are required." });
  }

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(normalizedUsername)) {
    return res.status(400).json({ message: "Username must be 3-20 characters using letters, numbers, or underscore." });
  }

  if (!GMAIL_REGEX.test(normalizedEmail)) {
    return res.status(400).json({ message: "Email must be a valid @gmail.com address." });
  }

  if (!/^\d{11}$/.test(normalizedContactNumber)) {
    return res.status(400).json({ message: "Contact number must be exactly 11 digits." });
  }

  try {
    const userId = Number(payload.sub);
    const canStoreContactNumber = await hasContactNumberColumn();

    const [existingEmail] = await pool.query(
      "SELECT usertable_id FROM users WHERE company_email = ? AND usertable_id <> ? LIMIT 1",
      [normalizedEmail, userId]
    );

    if (existingEmail.length > 0) {
      return res.status(409).json({ message: "Email already exists." });
    }

    const [existingUsername] = await pool.query(
      "SELECT usertable_id FROM users WHERE username = ? AND usertable_id <> ? LIMIT 1",
      [normalizedUsername, userId]
    );

    if (existingUsername.length > 0) {
      return res.status(409).json({ message: "Username already exists." });
    }

    if (canStoreContactNumber) {
      await pool.query(
        `UPDATE users
         SET username = ?, first_name = ?, last_name = ?, company_email = ?, contact_number = ?
         WHERE usertable_id = ?
         LIMIT 1`,
        [normalizedUsername, firstName, lastName, normalizedEmail, normalizedContactNumber, userId]
      );
    } else {
      await pool.query(
        `UPDATE users
         SET username = ?, first_name = ?, last_name = ?, company_email = ?
         WHERE usertable_id = ?
         LIMIT 1`,
        [normalizedUsername, firstName, lastName, normalizedEmail, userId]
      );
    }

    return res.json({
      id: userId,
      username: normalizedUsername,
      name: `${firstName} ${lastName}`.trim(),
      email: normalizedEmail,
      contactNumber: normalizedContactNumber,
    });
  } catch (error) {
    return res.status(500).json({ message: "Profile update failed.", detail: error.message });
  }
}
