import { useEffect, useState } from "react";
import { Box, Paper, Typography, Button } from "@mui/material";
import dayjs from "dayjs";
import { toast } from "sonner";
import Swal from "sweetalert2";
import AddReportModal from "../../components/Report/ReportModal";
import ParkingReportTable from "../../components/dashboard/ParkingReportTable";
import parkingReportService from "../../services/ParkingReportService";
import { useVehicles } from "../../context/vehicleContext/useVehicles";
import useAuth from "../../context/auth/useAuth";
import useParkingFeePDF from "../../hooks/useParkingFeePDF";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

export default function Report() {
  const { vehicles } = useVehicles();
  const { user } = useAuth();
  const { generatePDF, maxRows } = useParkingFeePDF();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [startDate, setStartDate] = useState(dayjs().startOf('month'));
  const [endDate, setEndDate] = useState(dayjs());
  const [coverageLoaded, setCoverageLoaded] = useState(false);
  const [coverageTouched, setCoverageTouched] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const buildRowSelectionKey = (row, index = 0) =>
    row?.id ?? `${index}-${row?.transDate || ""}-${row?.vehicleModel || ""}-${row?.amount || ""}`;

  const extractSelectedIds = (selectionModel) => {
    if (Array.isArray(selectionModel)) {
      return selectionModel;
    }

    if (selectionModel?.ids instanceof Set) {
      return Array.from(selectionModel.ids);
    }

    if (selectionModel && typeof selectionModel[Symbol.iterator] === "function") {
      return Array.from(selectionModel);
    }

    return [];
  };

  useEffect(() => {
    let isActive = true;

    const loadCoveragePreference = async () => {
      setCoverageLoaded(false);
      try {
        const data = await parkingReportService.getCoverage();
        if (!isActive) {
          return;
        }
        const savedStart = dayjs(data?.coverageFrom);
        const savedEnd = dayjs(data?.coverageTo);
        if (savedStart.isValid() && savedEnd.isValid() && !savedStart.isAfter(savedEnd, "day")) {
          setStartDate(savedStart);
          setEndDate(savedEnd);
        }
      } catch {
        // Keep default coverage when preference load fails.
      } finally {
        if (isActive) {
          setCoverageLoaded(true);
        }
      }
    };

    loadCoveragePreference();

    return () => {
      isActive = false;
    };
  }, [user?.id, user?.employeeId, user?.email]);

  useEffect(() => {
    if (!coverageLoaded || !coverageTouched) {
      return;
    }

    const normalizedStart = dayjs(startDate);
    const normalizedEnd = dayjs(endDate);

    if (
      !normalizedStart.isValid() ||
      !normalizedEnd.isValid() ||
      normalizedStart.isAfter(normalizedEnd, "day")
    ) {
      return;
    }

    const saveCoveragePreference = async () => {
      try {
        await parkingReportService.saveCoverage({
          coverageFrom: normalizedStart.format("YYYY-MM-DD"),
          coverageTo: normalizedEnd.format("YYYY-MM-DD"),
        });
      } catch {
        // Keep report flow usable even when preference save fails.
      }
    };

    saveCoveragePreference();
  }, [coverageLoaded, coverageTouched, startDate, endDate]);

  const handleExportPDF = () => {
    if (loading) {
      return;
    }

    if (!filteredRows.length) {
      toast.error("No reports to export.");
      return;
    }

    const normalizedRows = filteredRows.map((row) => {
      const parsedDate = dayjs(row.transDate);
      return {
        date: parsedDate.isValid() ? parsedDate.format("M/D/YYYY") : "",
        carModel: row.vehicleModel || "",
        amount: `PHP ${Number(row.amount || 0).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
      };
    });

    const coverageStart = dayjs(startDate);
    const coverageEnd = dayjs(endDate);
    let coverage = "N/A";
    if (coverageStart.isValid() && coverageEnd.isValid()) {
      coverage = coverageStart.isSame(coverageEnd, "day")
        ? coverageStart.format("MMMM D, YYYY")
        : `${coverageStart.format("MMMM D, YYYY")} - ${coverageEnd.format("MMMM D, YYYY")}`;
    }

    const preparedBy = user?.name || user?.username || user?.email || "N/A";

    generatePDF({
      preparedBy,
      coverage,
      dateSubmitted: dayjs().format("MMMM D, YYYY"),
      rows: normalizedRows,
    });

    if (filteredRows.length > maxRows) {
      toast.warning(`Exported first ${maxRows} rows only.`);
    } else {
      toast.success("Report PDF exported successfully.");
    }
  };

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await parkingReportService.getReports();
        const normalizedRows = Array.isArray(data)
          ? data
          : Array.isArray(data?.reports)
            ? data.reports
            : [];
        setRows(normalizedRows);
      } catch (err) {
        setError(err?.data?.message || "Failed to load reports.");
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const handleAddReport = async (payload) => {
    const coverageStart = startDate && dayjs(startDate).isValid() ? dayjs(startDate) : null;
    const coverageEnd = endDate && dayjs(endDate).isValid() ? dayjs(endDate) : null;
    const reportDate = dayjs(payload?.transDate);

    if (!coverageStart || !coverageEnd) {
      throw new Error("Select a valid coverage range before adding a report.");
    }

    if (coverageStart.isAfter(coverageEnd, "day")) {
      throw new Error("Coverage start date cannot be after coverage end date.");
    }

    if (!reportDate.isValid()) {
      throw new Error("Transaction date is required.");
    }

    if (reportDate.isBefore(coverageStart, "day") || reportDate.isAfter(coverageEnd, "day")) {
      throw new Error("Transaction date must be within the selected coverage range.");
    }

    const created = await parkingReportService.addReport({
      ...payload,
      coverageFrom: coverageStart.format("YYYY-MM-DD"),
      coverageTo: coverageEnd.format("YYYY-MM-DD"),
    });
    const createdDate = dayjs(created?.transDate);

    setRows((prev) => [
      {
        id: Date.now(),
        ...created,
      },
      ...prev,
    ]);

    if (
      createdDate.isValid() &&
      ((startDate && createdDate.isBefore(startDate, "day")) ||
        (endDate && createdDate.isAfter(endDate, "day")))
    ) {
      toast.info("Report added, but it is outside the selected coverage.");
    }
  };
  const filteredRows = (Array.isArray(rows) ? rows : []).filter((row) => {
    if (!row) return false;
    const rowDate = dayjs(row.transDate);
    return (
      (!startDate || rowDate.isAfter(startDate, 'day') || rowDate.isSame(startDate, 'day')) &&
      (!endDate || rowDate.isBefore(endDate, 'day') || rowDate.isSame(endDate, 'day'))
    );
  });

  useEffect(() => {
    if (!selectedRowIds.length) {
      return;
    }

    const visibleRowIds = new Set(
      (filteredRows || []).map((row, index) => String(buildRowSelectionKey(row, index)))
    );
    setSelectedRowIds((prev) =>
      (prev || []).filter((id) => visibleRowIds.has(String(id)))
    );
  }, [filteredRows, selectedRowIds.length]);

  const selectedReport = (filteredRows || []).find(
    (row, index) =>
      String(buildRowSelectionKey(row, index)) === String(selectedRowIds[0])
  );

  const handleDeleteSelected = async () => {
    if (!selectedReport || deleting) {
      return;
    }

    const confirmResult = await Swal.fire({
      title: "Delete selected report?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d32f2f",
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    setDeleting(true);
    try {
      await parkingReportService.deleteReport(selectedReport.transDate);
      setRows((prev) => prev.filter((row) => row.transDate !== selectedReport.transDate));
      setSelectedRowIds([]);
      toast.success("Report deleted successfully.");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete report.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper sx={{ width: "95%", p: 3, borderRadius: "15px" }} elevation={6}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", p: 1,gap: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 500 }}>
              Parking Fee Report
            </Typography>


            <Box sx={{ display: "flex", gap: 2, alignItems: "center", p: 1 }}>
              <Typography variant="body1" sx={{ p: 1 }}>
                Coverage:
              </Typography> 
              <DatePicker
                label="From"
                value={startDate}
                onChange={(newValue) => {
                  setCoverageTouched(true);
                  setStartDate(newValue);
                }}
                slotProps={{ textField: { size: 'small' } }}
              />
              <DatePicker
                label="To"
                value={endDate}
                onChange={(newValue) => {
                  setCoverageTouched(true);
                  setEndDate(newValue);
                }}
                slotProps={{ textField: { size: 'small' } }}
              />
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={handleDeleteSelected}
              disabled={loading || deleting || !selectedReport}
              sx={{ borderRadius: "10px", textTransform: "none" }}
            >
              {deleting ? "Deleting..." : "Delete Selected"}
            </Button>
            <Button
              variant="outlined"
              onClick={handleExportPDF}
              disabled={loading}
              sx={{ borderRadius: "10px", textTransform: "none" }}
            >
              Export PDF
            </Button>
            <Button
              variant="outlined"
              onClick={() => setOpenModal(true)}
              sx={{ borderRadius: "10px", textTransform: "none" }}
            >
              Add Report
            </Button>
          </Box>
        </Box>

        {error ? <Typography color="error">{error}</Typography> : null}

        <Box sx={{ width: "100%" }}>
          <ParkingReportTable
            rows={filteredRows}
            loading={loading}
            title={null}
            emptyMessage="No reports yet."
            withPaper={false}
            maxRows={15}
            selectedRowIds={selectedRowIds}
            onRowSelectionChange={(newSelectionModel) => {
              const nextSelection = extractSelectedIds(newSelectionModel);
              setSelectedRowIds(nextSelection.slice(0, 1));
            }}
          />
        </Box>

        <AddReportModal
          open={openModal}
          setOpen={setOpenModal}
          vehicles={vehicles}
          onAddReport={handleAddReport}
          existingReports={rows}
          coverageFrom={startDate}
          coverageTo={endDate}
        />
      </Paper>
    </LocalizationProvider>
  );
}
