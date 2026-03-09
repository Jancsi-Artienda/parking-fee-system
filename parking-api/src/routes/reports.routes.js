import express from "express";
import {
  addReport,
  deleteReport,
  getReportCoverage,
  getReports,
  updateReportCoverage,
} from "../controller/reports.controller.js";
import { requireAuth } from "../auth.js";

const router = express.Router();

router.get("/", requireAuth, getReports);
router.post("/", requireAuth, addReport);
router.delete("/:transDate", requireAuth, deleteReport);
router.get("/coverage", requireAuth, getReportCoverage);
router.put("/coverage", requireAuth, updateReportCoverage);

export default router;
