import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import vehicleRoutes from "./routes/vehicles.routes.js";
import reportRoutes from "./routes/reports.routes.js";
import pool from "./db.js";
import { getJwtSecret } from "./jwt.js";


dotenv.config();
getJwtSecret();

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: false,
  })
);
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.json({ status: "ok", db: "connected" });
  } catch (error) {
    return res.status(500).json({ status: "error", db: "disconnected", detail: error.message });
  }
});

app.use("/auth", authRoutes);
app.use("/vehicles", vehicleRoutes);
app.use("/reports", reportRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.listen(port, () => {
  console.log(`Parking API running on http://localhost:${port}`);
});
