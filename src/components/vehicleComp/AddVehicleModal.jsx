import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import Swal from "sweetalert2";
import { useRef, useState } from "react";
import { useVehicles } from "../../context/vehicleContext/useVehicles";

const VEHICLE_TYPE_OPTIONS = ["Car", "Motorcycle"];
const UPPERCASE_FIELDS = new Set(["name", "plate", "color"]);
const PLATE_REGEX = /^[A-Z0-9]{8}$/;

export default function AddVehicleModal({ open, setOpen }) {
  const { addVehicle } = useVehicles();

  const [formData, setFormData] = useState({
    type: "",
    name: "",
    plate: "",
    color: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");
  const submitLockRef = useRef(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const normalizedValue = UPPERCASE_FIELDS.has(name) ? value.toUpperCase() : value;

    if (localError) {
      setLocalError("");
    }
    setFormData({
      ...formData,
      [name]: normalizedValue
    });
  };

  const handleClose = () => {
    if (submitting) return;
    setLocalError("");
    setOpen(false);
  };

  const handleAddVehicle = async () => {
    if (submitLockRef.current || submitting) {
      return;
    }

    if (!formData.type.trim() || !formData.name.trim() || !formData.plate.trim()) {
      setLocalError("Type, model, and plate are required.");
      return;
    }

    const normalizedPlate = formData.plate.trim().toUpperCase();
    if (!PLATE_REGEX.test(normalizedPlate)) {
      setLocalError("Plate number must be exactly 8 characters.");
      return;
    }

    submitLockRef.current = true;
    setSubmitting(true);
    setLocalError("");
    try {
      await addVehicle({
        type: formData.type.trim(),
        name: formData.name.trim().toUpperCase(),
        plate: normalizedPlate,
        color: formData.color.trim().toUpperCase(),
      });
      setFormData({
        type: "",
        name: "",
        plate: "",
        color: "",
      });
      setOpen(false);
      void Swal.fire({
        title: "Vehicle Added",
        text: "Your vehicle was added successfully.",
        icon: "success",
        confirmButtonText: "OK",
      });
    } catch (err) {
      const message = err?.message || "Failed to add vehicle.";
      setLocalError(message);
      await Swal.fire({
        title: "Add Vehicle Failed",
        text: message,
        icon: "error",
        confirmButtonText: "Ok"
      });
    } finally {
      setSubmitting(false);
      submitLockRef.current = false;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add new Vehicle</DialogTitle>

      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel id="vehicle-type-label">Vehicle Type</InputLabel>
            <Select
              labelId="vehicle-type-label"
              label="Vehicle Type"
              name="type"
              value={formData.type}
              onChange={handleChange}
            >
              {VEHICLE_TYPE_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Vehicle Model" name="name" value={formData.name} onChange={handleChange} fullWidth />
          <TextField
            label="Vehicle Plate No."
            name="plate"
            value={formData.plate}
            onChange={handleChange}
            fullWidth
            inputProps={{ maxLength: 8 }}
          />
          <TextField label="Vehicle Color" name="color" value={formData.color} onChange={handleChange} fullWidth />
          {localError ? <Typography color="error">{localError}</Typography> : null}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} sx={{ textTransform: "none" }} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleAddVehicle}
          disabled={submitting}
          sx={{ textTransform: "none", borderRadius: "8px" }}
        >
          {submitting ? "Adding..." : "Add Vehicle"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
