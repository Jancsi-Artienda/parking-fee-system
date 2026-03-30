import express from "express";
import {
  addReport,
  deleteReport,
  getReportCoverage,
  getReports,
  markPrintedReports,
  updateReportCoverage,
} from "../controller/reports.controller.js";
import { requireAuth } from "../auth.js";
import { requireCsrf } from "../csrf.js";

const router = express.Router();

router.get("/", requireAuth, getReports);
router.post("/", requireAuth, requireCsrf, addReport);
router.delete("/:transDate", requireAuth, requireCsrf, deleteReport);
router.get("/coverage", requireAuth, getReportCoverage);
router.put("/coverage", requireAuth, requireCsrf, updateReportCoverage);
router.patch("/printed", requireAuth, requireCsrf, markPrintedReports);

export default router;
