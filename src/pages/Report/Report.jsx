import { useEffect, useState } from "react";
import { Box, Paper, Typography, Button } from "@mui/material";
import dayjs from "dayjs";
import { toast } from "sonner";
import AddReportModal from "../../components/Report/ReportModal";
import ParkingReportTable from "../../components/dashboard/ParkingReportTable";
import parkingReportService from "../../services/ParkingReportService";
import { useVehicles } from "../../context/vehicleContext/useVehicles";
import useAuth from "../../context/auth/useAuth";
import useParkingFeePDF from "../../hooks/useParkingFeePDF";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
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

  const handleExportPDF = () => {
    if (loading) {
      return;
    }

    if (!rows.length) {
      toast.error("No reports to export.");
      return;
    }

    const normalizedRows = rows.map((row) => {
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

    const validDates = rows
      .map((row) => dayjs(row.transDate))
      .filter((dateValue) => dateValue.isValid())
      .sort((a, b) => a.valueOf() - b.valueOf());

    let coverage = "N/A";
    if (validDates.length === 1) {
      coverage = validDates[0].format("MMMM D, YYYY");
    } else if (validDates.length > 1) {
      coverage = `${validDates[0].format("MMMM D, YYYY")} - ${validDates[
        validDates.length - 1
      ].format("MMMM D, YYYY")}`;
    }

    const preparedBy = user?.name || user?.username || user?.email || "N/A";

    generatePDF({
      preparedBy,
      coverage,
      dateSubmitted: dayjs().format("MMMM D, YYYY"),
      rows: normalizedRows,
    });

    if (rows.length > maxRows) {
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
        setRows(data);
      } catch (err) {
        setError(err?.data?.message || "Failed to load reports.");
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const handleAddReport = async (payload) => {
    const created = await parkingReportService.addReport(payload);
    setRows((prev) => [
      {
        id: Date.now(),
        ...created,
      },
      ...prev,
    ]);
  };
  const filteredRows = rows.filter((row) => {
    const rowDate = dayjs(row.transDate);
    return (
      (!startDate || rowDate.isAfter(startDate, 'day') || rowDate.isSame(startDate, 'day')) &&
      (!endDate || rowDate.isBefore(endDate, 'day') || rowDate.isSame(endDate, 'day'))
    );
  });

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
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ textField: { size: 'small' } }}
              />
              <DatePicker
                label="To"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { size: 'small' } }}
              />
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5 }}>
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
            rows={rows}
            loading={loading}
            title={null}
            emptyMessage="No reports yet."
            withPaper={false}
            maxRows={15}
          />
        </Box>

        <AddReportModal
          open={openModal}
          setOpen={setOpenModal}
          vehicles={vehicles}
          onAddReport={handleAddReport}
          existingReports={rows}
        />
      </Paper>
    </LocalizationProvider>
  );
}
