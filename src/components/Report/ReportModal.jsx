import { useEffect, useMemo, useRef, useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import dayjs from "dayjs";
import Swal from "sweetalert2";
import { X } from "lucide-react";
import { RefreshCw, } from "lucide-react";


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


    {/* to prevent lose data in the back browser */ }
    const handlePopState = () => {
      Swal.fire({
        title: "",
        text: "Are you sure you want to close? Your changes will be lost.",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes",
        cancelButtonText: "No",
        confirmButtonColor: "#1a3a5c",
        cancelButtonColor: "#E60000",
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
      confirmButtonColor: "#1a3a5c",
      cancelButtonColor: "#E60000",
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
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      confirmButtonColor: "#1a3a5c",
      cancelButtonColor: "#E60000",
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
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        {/* Modal box */}
        <div
          className="bg-white rounded-2xl overflow-hidden w-full max-w-4xl"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-medium text-gray-900">+ Add Report Record</h2>
          </div>

          {/* Body */}
          <div className="flex flex-col md:flex-row max-h-[80vh]">

            {/* Left panel — Calendar */}
            <div className="w-full md:w-100 bg-gray-50 flex flex-col shrink-0 p-1">
              <DateCalendar
                value={calendarValue}
                onChange={handleDateAdd}
                shouldDisableDate={isDateDisabled}
                slots={{ day: HighlightedDay }}

              />

            </div>

            {/* Right panel — Form + chips */}
            <div className="flex-1 flex flex-col p-5 overflow-y-auto bg-gray-50">
              <p className="text-sm text-gray-500 mb-4">
                Fill in the details and select dates to log parking records.
              </p>

              <div className="flex flex-col gap-4 flex-1">

                {/* Vehicle */}
                {!hasSingleVehicle ? (
                  <div>
                    <label className="text-sm text-gray-500">Vehicle</label>
                    <select
                      name="vehicleId"
                      value={formData.vehicleId}
                      onChange={handleChange}
                      className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">Select vehicle</option>
                      {safeVehicles.map((v) => (
                        <option key={v.id} value={String(v.id)}>
                          {v.type} / {v.model} / {v.plateNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm text-gray-500">Vehicle</label>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {singleVehicle.type} / {singleVehicle.model} / {singleVehicle.plateNumber}
                    </p>
                  </div>
                )}

                {/* Amount */}
                <div>
                  <label className="text-sm text-gray-500">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* Selected dates */}
                <div>
                  
                  <p className="text-xs text-blue-600 text-center ">
                    Click a date to select or unselect it.
                  </p>
                  <label className="text-sm text-gray-500">Selected Dates</label>
                  {selectedDates.length === 0 ? (
                    <p className="text-sm text-gray-400 mt-1">No dates selected yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">
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
                </div>

                {/* Summary row */}
                {selectedDates.length > 0 && (
                  <div className="flex justify-between text-sm pt-3 border-t border-gray-100">
                    <span className="font-medium text-gray-900">Total Records</span>
                    <span className="font-medium text-gray-900">{selectedDates.length} day(s)</span>
                  </div>
                )}

                {/* Error */}
                {localError && (
                  <p className="text-sm text-red-500">{localError}</p>
                )}
              </div>

              {/* Footer buttons */}
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-1 px-3 py-2 text-sm border text-white rounded-xl  bg-[#1a3a5c] hover:bg-[#cc0000]"
                >
                  <RefreshCw size={15} />

                </button>
                <button
                  onClick={handleClose}
                  disabled={submitting}
                  className="flex-1 py-2 text-sm rounded-xl border border-gray-200 text-white bg-[#E60000] hover:bg-[#cc0000] "
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddReport}
                  disabled={submitting}
                  className="flex-1 py-2 text-sm font-medium rounded-xl bg-[#1a3a5c] text-white hover:bg-[#142d47] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Adding..." : "Add Record"}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>


    </LocalizationProvider>
  );
}