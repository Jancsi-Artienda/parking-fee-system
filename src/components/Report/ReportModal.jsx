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
} from "@mui/material";
import { useMemo, useRef, useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import Swal from "sweetalert2";

export default function AddReportModal({
  open,
  setOpen,
  vehicles,
  onAddReport,
  existingReports = [],
}) {
  const [formData, setFormData] = useState({
    transDate: "",
    vehicleId: "",
    amount: "50",
  });
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");
  const submitLockRef = useRef(false);

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

  const selectedDate = formData.transDate ? dayjs(formData.transDate) : null;
  const isDuplicateDate =
    !!selectedDate &&
    selectedDate.isValid() &&
    usedDateKeys.has(selectedDate.format("YYYY-MM-DD"));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

    if (!formData.transDate || !formData.vehicleId || !formData.amount) {
      setLocalError("Date, vehicle, and amount are required.");
      return;
    }
    if (isDuplicateDate) {
      setLocalError("A report with this date already exists.");
      return;
    }

    submitLockRef.current = true;
    setSubmitting(true);
    setLocalError("");

    try {
      await onAddReport({
        transDate: formData.transDate,
        vehicleId: Number(formData.vehicleId),
        amount: Number(formData.amount)
      });
      setFormData({
        transDate: "",
        vehicleId: "",
        amount: "50",
      });
      setOpen(false);

      await Swal.fire({
        title: "Report Added",
        text: "Your report record was saved successfully.",
        icon: "success",
        confirmButtonText: "OK",
      });
    } catch (err) {
      const message = err?.data?.message || err?.message || "Failed to add report.";
      setLocalError(message);
      await Swal.fire({
        title: "Add Report Failed",
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
            <DatePicker
              label="Transaction Date"
              value={selectedDate}
              onChange={(newValue) => {
                setFormData((prev) => ({
                  ...prev,
                  transDate: newValue && newValue.isValid() ? newValue.format("YYYY-MM-DD") : "",
                }));
              }}
              shouldDisableDate={(dateValue) =>
                usedDateKeys.has(dateValue.format("YYYY-MM-DD"))
              }
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: isDuplicateDate,
                  helperText: isDuplicateDate ? "This date already has a report." : "",
                },
              }}
            />

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
            disabled={submitting || isDuplicateDate}
            sx={{ textTransform: "none", borderRadius: "8px" }}
          >
            {submitting ? "Adding..." : "Add Record"}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
