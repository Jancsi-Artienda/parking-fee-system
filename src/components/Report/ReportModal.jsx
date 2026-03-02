import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Chip,
  Stack,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import dayjs from "dayjs";
import Swal from "sweetalert2";

export default function AddReportModal({
  open,
  setOpen,
  vehicles,
  onAddReport,
  existingReports = [],
  coverageFrom = null,
  coverageTo = null,
}) {
  const [formData, setFormData] = useState({
    vehicleId: "",
    amount: "50",
  });
  const [selectedDates, setSelectedDates] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");
  const submitLockRef = useRef(false);
  const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
  const hasSingleVehicle = safeVehicles.length === 1;
  const singleVehicle = hasSingleVehicle ? safeVehicles[0] : null;

  useEffect(() => {
    if (!open) {
      return;
    }

    if (hasSingleVehicle && singleVehicle?.id != null) {
      setFormData((prev) => ({ ...prev, vehicleId: String(singleVehicle.id) }));
    }
  }, [open, hasSingleVehicle, singleVehicle]);

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

  const coverageStart =
    coverageFrom && dayjs(coverageFrom).isValid() ? dayjs(coverageFrom) : null;
  const coverageEnd =
    coverageTo && dayjs(coverageTo).isValid() ? dayjs(coverageTo) : null;
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
      return;
    }
    if (isDateDisabled(newValue)) return;
    setLocalError("");
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
        sx={{
          ...(isSelected && {
            backgroundColor: (theme) => theme.palette.primary.main,
            color: (theme) => theme.palette.primary.contrastText,
            "&:hover": {
              backgroundColor: (theme) => theme.palette.primary.dark,
            },
          }),
        }}
      />
    );
  };

  const handleClose = () => {
    if (submitting) return;
    setLocalError("");
    setOpen(false);
  };

  const handleAddReport = async () => {
    if (submitLockRef.current || submitting) {
      return;
    }

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
        amount: Number(formData.amount)
      });
      setFormData({
        vehicleId: "",
        amount: "50",
      });
      setSelectedDates([]);
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

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: "bold" }}>Add Report Record</DialogTitle>

        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <DateCalendar
              onChange={handleDateAdd}
              shouldDisableDate={isDateDisabled}
              slots={{ day: HighlightedDay }}
            />
            <Typography variant="body2" color="text.secondary">
              Click a date to select or unselect it.
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {selectedDates.map((dateStr) => {
                return (
                  <Chip
                    key={dateStr}
                    label={dayjs(dateStr).format("MMM D, YYYY")}
                    onDelete={() => handleDateRemove(dateStr)}
                    color="primary"
                    variant="outlined"
                  />
                );
              })}
            </Box>

            {hasSingleVehicle ? (
              <TextField
                label="Vehicle"
                value={`${singleVehicle?.type || ""} - ${singleVehicle?.name || ""} (${singleVehicle?.plate || ""})`}
                fullWidth
                InputProps={{ readOnly: true }}
              />
            ) : (
              <FormControl fullWidth>
                <InputLabel id="vehicle-select-label">Vehicle</InputLabel>
                <Select
                  labelId="vehicle-select-label"
                  label="Vehicle"
                  name="vehicleId"
                  value={formData.vehicleId}
                  onChange={handleChange}
                >
                  {vehicles.map((vehicle) => (
                    <MenuItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.type} - {vehicle.name} ({vehicle.plate})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              label="Amount"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleChange}
              fullWidth
              inputProps={{ min: 1 }}
            />

            {localError ? <Typography color="error">{localError}</Typography> : null}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={submitting} sx={{ textTransform: "none", color: "gray" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddReport}
            disabled={submitting}
            sx={{ textTransform: "none", borderRadius: "8px" }}
          >
            {submitting ? "Adding..." : "Add Record"}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
