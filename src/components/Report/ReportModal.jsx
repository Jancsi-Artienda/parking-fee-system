import { useEffect, useMemo, useRef, useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import dayjs from "dayjs";
import Swal from "sweetalert2";
import { X } from "lucide-react";
import { RefreshCw, Plus } from "lucide-react";

export default function AddReportModal({
  open,
  setOpen,
  vehicles,
  onAddReport,
  existingReports = [],
  coverageFrom = null,
  coverageTo = null,
}) {
  const [formData, setFormData] = useState({ vehicleId: "", amount: "50" });
  const [selectedDates, setSelectedDates] = useState([]);
  const [calendarValue, setCalendarValue] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");
  const submitLockRef = useRef(false);

  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  const hasSingleVehicle = safeVehicles.length === 1;
  const singleVehicle = hasSingleVehicle ? safeVehicles[0] : null;

  useEffect(() => {
    if (!open) return;
    if (hasSingleVehicle && singleVehicle?.id != null) {
      setFormData((prev) => ({ ...prev, vehicleId: String(singleVehicle.id) }));
    }
  }, [open, hasSingleVehicle, singleVehicle]);

  useEffect(() => {
  if (!open) return;

  window.history.pushState({ modalOpen: true }, "");


   {/* to prevent lose data in the back browser */}
  const handlePopState = () => {
    Swal.fire({
      title: "",
      text: "Are you sure you want to close? Your changes will be lost.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      confirmButtonColor: "#E60000",
      cancelButtonColor: "#1a3a5c",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        setLocalError("");
        setCalendarValue(null);
        setSelectedDates([]);
        setFormData({ vehicleId: "", amount: "50" });
        setOpen(false);
      } else {
        window.history.pushState({ modalOpen: true }, "");
      }
    });
  };

  window.addEventListener("popstate", handlePopState);

  return () => {
    window.removeEventListener("popstate", handlePopState);
  };
}, [open]);



  const usedDateKeys = useMemo(
    () =>
      new Set(
        existingReports
          .map((row) => row?.transDate)
          .filter(Boolean)
          .map((value) => dayjs(value).format("YYYY-MM-DD"))
      ),
    [existingReports]
  );

  const coverageStart = coverageFrom && dayjs(coverageFrom).isValid() ? dayjs(coverageFrom) : null;
  const coverageEnd = coverageTo && dayjs(coverageTo).isValid() ? dayjs(coverageTo) : null;
  const hasValidCoverage = !!coverageStart && !!coverageEnd && !coverageStart.isAfter(coverageEnd, "day");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isDateDisabled = (dateValue) =>
    usedDateKeys.has(dateValue.format("YYYY-MM-DD")) ||
    (hasValidCoverage &&
      (dateValue.isBefore(coverageStart, "day") || dateValue.isAfter(coverageEnd, "day")));

  const handleDateAdd = (newValue) => {
    if (!newValue || !newValue.isValid()) return;
    const dateStr = newValue.format("YYYY-MM-DD");
    if (selectedDates.includes(dateStr)) {
      handleDateRemove(dateStr);
      setCalendarValue(null);
      return;
    }
    if (isDateDisabled(newValue)) return;
    setLocalError("");
    setCalendarValue(newValue);
    setSelectedDates((prev) => [...prev, dateStr].sort());
  };

  const handleDateRemove = (dateStr) => {
    setSelectedDates((prev) => prev.filter((d) => d !== dateStr));
  };

  const HighlightedDay = (props) => {
    const { day, ...other } = props;
    const isSelected = selectedDates.includes(day.format("YYYY-MM-DD"));
    return (
      <PickersDay
        {...other}
        day={day}
        selected={isSelected}
        sx={{
          ...(isSelected && {
            backgroundColor: (theme) => theme.palette.primary.main,
            color: (theme) => theme.palette.primary.contrastText,
            "&:hover": { backgroundColor: (theme) => theme.palette.primary.dark },
          }),
        }}
      />
    );
  };

 const handleClose = () => {
    if (submitting) return;

    Swal.fire({
      title: "",
      text: "Are you sure you want to close? Your changes will be lost.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      confirmButtonColor: "#E60000",
      cancelButtonColor: "#1a3a5c",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        setLocalError("");
        setCalendarValue(null);
        setSelectedDates([]);
        setFormData({ vehicleId: "", amount: "50" });
        setOpen(false);
      }
    });
  };



const handleRefresh = async () => {
    const result = await Swal.fire({
      title: "Refresh Form?",
      text: "This will clear all your selected dates and inputs.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Refresh",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#6b7280",
      cancelButtonColor: "#1a3a5c",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      setFormData({ vehicleId: hasSingleVehicle ? String(singleVehicle.id) : "", amount: "50" });
      setSelectedDates([]);
      setCalendarValue(null);
      setLocalError("");
    }
  };


  const handleAddReport = async () => {
    if (submitLockRef.current || submitting) return;
    if (selectedDates.length === 0 || !formData.vehicleId || !formData.amount) {
      setLocalError("At least one date, vehicle, and amount are required.");
      return;
    }
    if (!hasValidCoverage) {
      setLocalError("Set a valid coverage range first.");
      return;
    }

    submitLockRef.current = true;
    setSubmitting(true);
    setLocalError("");

    try {
      await onAddReport({
        transDates: selectedDates,
        vehicleId: Number(formData.vehicleId),
        amount: Number(formData.amount),
      });
      setFormData({ vehicleId: "", amount: "50" });
      setSelectedDates([]);
      setCalendarValue(null);
      setOpen(false);
      await Swal.fire({
        title: "Reports Added",
        text: `${selectedDates.length} report records were saved successfully.`,
        icon: "success",
        confirmButtonText: "OK",
      });
    } catch (err) {
      const message = err?.data?.message || err?.message || "Failed to add reports.";
      setLocalError(message);
      await Swal.fire({
        title: "Add Reports Failed",
        text: message,
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setSubmitting(false);
      submitLockRef.current = false;
    }
  };

  if (!open) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={handleClose}
      >
        {/* Modal */}
        <div
          className="relative bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh] w-[700px]"
          onClick={(e) => e.stopPropagation()}
        >

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-2 shrink-0">
            <h2 className="text-lg font-bold text-gray-900"> + Add Report Record</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-4 px-6 pb-4 overflow-y-auto flex-1">

            {/* Calendar — must stay as MUI */}
            <DateCalendar
              value={calendarValue}
              onChange={handleDateAdd}
              shouldDisableDate={isDateDisabled}
              slots={{ day: HighlightedDay }}
            />

            <p className="text-sm text-gray-500">
              Click a date to select or unselect it.
            </p>

            {/* Selected Date Chips */}
            {selectedDates.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedDates.map((dateStr) => (
                  <span
                    key={dateStr}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-blue-700 border border-blue-400 rounded-full bg-blue-50"
                  >
                    {dayjs(dateStr).format("MMM D, YYYY")}
                    <button
                      type="button"
                      onClick={() => handleDateRemove(dateStr)}
                      className="text-blue-400 hover:text-blue-700 ml-1"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Vehicle — single or dropdown */}
            {hasSingleVehicle ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                <input
                  type="text"
                  readOnly
                  value={`${singleVehicle?.type || ""} - ${singleVehicle?.name || ""} (${singleVehicle?.plate || ""})`}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                <select
                  name="vehicleId"
                  value={formData.vehicleId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-900 text-gray-800"
                >
                  <option value="" disabled>Select a vehicle</option>
                  {safeVehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.type} - {vehicle.name} ({vehicle.plate})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                name="amount"
                min={1}
                value={formData.amount}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-900 text-gray-800"
              />
            </div>

            {/* Error */}
            {localError && (
              <p className="text-red-500 text-sm">{localError}</p>
            )}

          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 shrink-0">

            <button
              onClick={handleAddReport}
              disabled={submitting}
              className="px-6 py-2 text-sm text-white font-semibold rounded-xl bg-[#1a3a5c] hover:bg-[#142d47] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Adding..." : "Add Record"}
            </button>

            <button
              onClick={handleRefresh}
              className="flex items-center gap-1 px-3 py-2 text-sm border text-gray-600 bg-gray-100 rounded-xl  hover:bg-gray-200 transition-colors duration-150"
            >
              <RefreshCw size={16} />
              Refresh 
            </button>

            <button
              onClick={handleClose}
              disabled={submitting}
              className="flex items-center gap-1 px-3 py-2 text-sm border  text-white  bg-[#E60000] rounded-xl hover:bg-[#cc0000] transition-colors duration-150"
            >
              Cancel
            </button>

          </div>

        </div>
      </div>

    </LocalizationProvider>
  );
}