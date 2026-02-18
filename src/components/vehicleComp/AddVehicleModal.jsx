import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box
} from "@mui/material";
import { useState } from "react";
import { useVehicles } from "../../context/vehicleContext/useVehicles";

export default function AddVehicleModal({ open, setOpen }) {
  const { addVehicle } = useVehicles();

  const [formData, setFormData] = useState({
    type: "",
    name: "",
    plate: "",
    color: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddVehicle = async () => {
    if (!formData.type || !formData.name || !formData.plate) return;

    await addVehicle(formData);

    setFormData({
      type: "",
      name: "",
      plate: "",
      color: ""
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Add new Vehicle</DialogTitle>

      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField label="Vehicle Type" name="type" value={formData.type} onChange={handleChange} fullWidth />
          <TextField label="Vehicle Model" name="name" value={formData.name} onChange={handleChange} fullWidth />
          <TextField label="Vehicle Plate No." name="plate" value={formData.plate} onChange={handleChange} fullWidth />
          <TextField label="Vehicle Color" name="color" value={formData.color} onChange={handleChange} fullWidth />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => setOpen(false)} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleAddVehicle} sx={{ textTransform: "none", borderRadius: "8px" }}>
          Add Vehicle
        </Button>
      </DialogActions>
    </Dialog>
  );
}
