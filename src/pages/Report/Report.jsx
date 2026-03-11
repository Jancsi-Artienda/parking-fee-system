import { useEffect, useMemo, useState, useCallback } from "react";
import dayjs from "dayjs";
import Swal from "sweetalert2";
import { toastError, toastSuccess, toastWarning } from "../../utils/swalToast";
import AddReportModal from "../../components/Report/ReportModal";
import ParkingReportTable from "../../components/dashboard/ParkingReportTable";
import api from "../../services/api";
import { useVehicles } from "../../context/vehicleContext/useVehicles";
import useAuth from "../../context/auth/useAuth";
import useParkingFeePDF from "../../hooks/useParkingFeePDF";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { RefreshCw, Plus } from "lucide-react";

export default function Report() {
  const { vehicles } = useVehicles();
  const { user } = useAuth();
  const { generatePDF, maxRows } = useParkingFeePDF();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [startDate, setStartDate] = useState(dayjs().startOf("month"));
  const [endDate, setEndDate] = useState(dayjs());
  const [coverageLoaded, setCoverageLoaded] = useState(false);
  const [coverageTouched, setCoverageTouched] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const MIN_COVERAGE_DAYS = 14;

  const getMinCoverageTo = useCallback((from) => {
    const d = dayjs(from);
    return d.isValid() ? d.startOf("day").add(MIN_COVERAGE_DAYS, "day") : null;
  }, []);

  const isCoverageValid = useCallback(
    (from, to) => {
      const start = dayjs(from);
      const end = dayjs(to);
      if (!start.isValid() || !end.isValid()) return false;
      return !end.isBefore(getMinCoverageTo(start), "day");
    },
    [getMinCoverageTo]
  );

  useEffect(() => {
    let isActive = true;
    const loadCoveragePreference = async () => {
      setCoverageLoaded(false);
      try {
        const data = await api.getCoverage();
        if (!isActive) return;
        const savedStart = dayjs(data?.coverageFrom);
        const savedEnd = dayjs(data?.coverageTo);
        if (savedStart.isValid() && savedEnd.isValid() && !savedStart.isAfter(savedEnd, "day") && isCoverageValid(savedStart, savedEnd)) {
          setStartDate(savedStart);
          setEndDate(savedEnd);
        }
      } catch (err) {
        setError(err?.data?.message || "Invalid Coverage.");
      } finally {
        if (isActive) setCoverageLoaded(true);
      }
    };
    loadCoveragePreference();
    return () => { isActive = false; };
  }, [user?.id, user?.employeeId, user?.email, isCoverageValid]);

  useEffect(() => {
    if (!coverageLoaded || !coverageTouched) return;
    const normalizedStart = dayjs(startDate);
    const normalizedEnd = dayjs(endDate);
    if (!normalizedStart.isValid() || !normalizedEnd.isValid() || normalizedStart.isAfter(normalizedEnd, "day")) return;
    if (!isCoverageValid(normalizedStart, normalizedEnd)) return;
    const saveCoveragePreference = async () => {
      try {
        await api.saveCoverage({
          coverageFrom: normalizedStart.format("YYYY-MM-DD"),
          coverageTo: normalizedEnd.format("YYYY-MM-DD"),
        });
      } catch (err) {
        setError(err?.data?.message || "Failed to load coverage.");
      }
    };
    saveCoveragePreference();
  }, [coverageLoaded, coverageTouched, startDate, endDate, isCoverageValid]);

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await api.getReports();
        const normalizedRows = Array.isArray(data) ? data : Array.isArray(data?.reports) ? data.reports : [];
        setRows(normalizedRows);
      } catch (err) {
        setError(err?.data?.message || "Failed to load reports.");
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, []);

  const handleExportPDF = () => {
    if (loading) return;
    if (!filteredRows.length) { toast.error("No reports to export."); return; }
    const normalizedRows = filteredRows.map((row) => {
      const parsedDate = dayjs(row.transDate);
      return {
        date: parsedDate.isValid() ? parsedDate.format("M/D/YYYY") : "",
        carModel: row.vehicleModel || "",
        amount: `PHP ${Number(row.amount || 0).toLocaleString("en-US")}`,
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
    const printableFilteredRows = filteredRows.slice(0, maxRows);
    const totalAmountValue = printableFilteredRows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const totalAmount = `PHP ${totalAmountValue.toLocaleString("en-US")}`;
    generatePDF({ preparedBy, coverage, dateSubmitted: dayjs().format("MMMM D, YYYY"), rows: normalizedRows, totalAmount });
    if (filteredRows.length > maxRows) {
      toastWarning(`Exported first ${maxRows} rows only.`);
    } else {
      toastSuccess("Report PDF exported successfully.");
    }
  };

  const handleAddReport = async (payload) => {
    const { transDates, vehicleId, amount } = payload;
    const coverageStart = startDate && dayjs(startDate).isValid() ? dayjs(startDate) : null;
    const coverageEnd = endDate && dayjs(endDate).isValid() ? dayjs(endDate) : null;
    if (!coverageStart || !coverageEnd) throw new Error("Select a valid coverage range before adding a report.");
    if (coverageStart.isAfter(coverageEnd, "day")) throw new Error("Coverage start date cannot be after coverage end date.");
    if (!Array.isArray(transDates) || transDates.length === 0) throw new Error("At least one transaction date is required.");
    if (!isCoverageValid(coverageStart, coverageEnd)) throw new Error("Coverage must be at least 15 days ahead");
    const createdReports = [];
    for (const dateStr of transDates) {
      const reportDate = dayjs(dateStr);
      if (!reportDate.isValid()) continue;
      if (reportDate.isBefore(coverageStart, "day") || reportDate.isAfter(coverageEnd, "day")) continue;
      const created = await api.addReport({
        transDate: dateStr,
        vehicleId,
        amount,
        coverageFrom: coverageStart.format("YYYY-MM-DD"),
        coverageTo: coverageEnd.format("YYYY-MM-DD"),
      });
      createdReports.push(created);
    }
    setRows((prev) => [
      ...createdReports.map((r) => ({ id: Date.now() + Math.random(), ...r })),
      ...prev,
    ]);
  };

  const filteredRows = useMemo(() => {
    const baseRows = Array.isArray(rows) ? rows : [];
    const filtered = baseRows.filter((row) => {
      if (!row) return false;
      const rowDate = dayjs(row.transDate);
      return (
        (!startDate || rowDate.isAfter(startDate, "day") || rowDate.isSame(startDate, "day")) &&
        (!endDate || rowDate.isBefore(endDate, "day") || rowDate.isSame(endDate, "day"))
      );
    });

    return filtered
      .map((row, index) => ({
        row,
        index,
        time: dayjs(row?.transDate).isValid() ? dayjs(row.transDate).valueOf() : Number.NEGATIVE_INFINITY,
      }))
      .sort((a, b) => {
        if (a.time !== b.time) return a.time - b.time; // oldest first
        return a.index - b.index; // stable for same date
      })
      .map((item) => item.row);
  }, [rows, startDate, endDate]);

  const handleDeleteReport = async (reportRow) => {
    if (!reportRow || deleting) return;
    const confirmResult = await Swal.fire({
      title: "Delete selected report?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d32f2f",
    });
    if (!confirmResult.isConfirmed) return;
    setDeleting(true);
    try {
      await api.deleteReport(reportRow.transDate);
      const targetDate = dayjs(reportRow.transDate).isValid()
        ? dayjs(reportRow.transDate).format("YYYY-MM-DD")
        : String(reportRow.transDate || "");
      setRows((prev) =>
        prev.filter((row) => {
          const rowDate = dayjs(row?.transDate).isValid()
            ? dayjs(row.transDate).format("YYYY-MM-DD")
            : String(row?.transDate || "");
          return rowDate !== targetDate;
        })
      );
      toastSuccess("Report deleted successfully.");
    } catch (err) {
      toastError(err?.data?.message || "Failed to delete report.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="w-[95%] p-6 rounded-2xl shadow-lg bg-white">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col gap-2 p-1">

            <h2 className="text-xl font-medium text-gray-900">Parking Fee Report</h2>

            {/* Coverage + Actions */}
            <div className="flex flex-wrap gap-3 items-center p-1">

              <span className="text-sm text-gray-700 font-medium">Coverage:</span>

              {/* DatePickers — must stay as MUI */}
              <DatePicker
                label="From"
                value={startDate}
                onChange={(newValue) => {
                  setCoverageTouched(true);
                  setStartDate(newValue);
                  if (newValue && dayjs(newValue).isValid()) {
                    const minTo = getMinCoverageTo(newValue);
                    if (!endDate || !dayjs(endDate).isValid() || dayjs(endDate).isBefore(minTo, "day")) {
                      setEndDate(minTo);
                    }
                  }
                }}
                slotProps={{ textField: { size: "small" } }}
              />

              <DatePicker
                label="To"
                minDate={getMinCoverageTo(startDate)}
                value={endDate}
                onChange={(newValue) => {
                  setCoverageTouched(true);
                  if (!startDate || !dayjs(startDate).isValid()) { setEndDate(newValue); return; }
                  const minTo = getMinCoverageTo(startDate);
                  if (newValue && dayjs(newValue).isValid() && dayjs(newValue).isBefore(minTo, "day")) {
                    toast.error("Coverage must be at least 15 days after");
                    return;
                  }
                  setEndDate(newValue);
                }}
                slotProps={{ textField: { size: "small" } }}
              />

              {/* Add Button */}
              <button
                onClick={() => setOpenModal(true)}
                className="flex items-center gap-1 px-3 py-2 text-sm border border-blue-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors duration-150"
              >
                <Plus size={16} />
                Add
              </button>

              {/* Refresh Button */}
              <button
                onClick={() => setOpenModal(false)}
                className="flex items-center gap-1 px-3 py-2 text-sm border border-blue-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors duration-150"
              >
                <RefreshCw size={16} />
                Refresh
              </button>

            </div>
          </div>
        </div>

        {/* Error */}
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        {/* Table */}
        <div className="w-full">
          <ParkingReportTable
            rows={filteredRows}
            loading={loading}
            title={null}
            emptyMessage="No reports yet."
            withPaper={false}
            maxRows={15}
            onDeleteRow={handleDeleteReport}
          />
        </div>

        {/* Modal */}
        <AddReportModal
          open={openModal}
          setOpen={setOpenModal}
          vehicles={vehicles}
          onAddReport={handleAddReport}
          existingReports={rows}
          coverageFrom={startDate}
          coverageTo={endDate}
        />

        {/* Export PDF */}
        <div className="flex w-full mt-4">
          <button
            onClick={handleExportPDF}
            disabled={loading}
            className="ml-auto px-5 py-2 text-sm text-white font-medium rounded-xl bg-green-600 hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export PDF
          </button>
        </div>

      </div>
    </LocalizationProvider>
  );
}
