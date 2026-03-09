import express from "express";
import {
  addVehicle,
  deleteVehicle,
  getVehicles,
} from "../controller/vehicles.controller.js";
import { requireAuth } from "../auth.js";

const router = express.Router();

router.get("/", requireAuth, getVehicles);
router.post("/", requireAuth, addVehicle);
router.delete("/:id", requireAuth, deleteVehicle);

export default router;
