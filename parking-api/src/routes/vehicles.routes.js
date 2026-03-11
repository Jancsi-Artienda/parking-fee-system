import express from "express";
import {
  addVehicle,
  deleteVehicle,
  getVehicles,
} from "../controller/vehicles.controller.js";
import { requireAuth } from "../auth.js";
import { requireCsrf } from "../csrf.js";

const router = express.Router();

router.get("/", requireAuth, getVehicles);
router.post("/", requireAuth, requireCsrf, addVehicle);
router.delete("/:id", requireAuth, requireCsrf, deleteVehicle);

export default router;
