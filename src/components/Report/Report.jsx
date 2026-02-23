import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  InputAdornment
} from "@mui/material";
import { useState } from "react";
import { useVehicles } from "../../context/vehicleContext/useVehicles";

export default function AddVehicleModal({ open, setOpen }) {
  const { addVehicle } = useVehicles();

  // 1. Simplified state to only include what you need
  const [formData, setFormData] = useState({
    date: "",
    name: "", // This is the Car Model
    amount: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddVehicle = async () => {
    // 2. Validation for the three fields
    if (!formData.date || !formData.name || !formData.amount) {
      alert("Please fill in all fields");
      return;
    }

    await addVehicle(formData);

    // 3. Reset form
    setFormData({
      date: "",
      name: "",
      amount: ""
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold" }}>Add Vehicle Record</DialogTitle>

      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 2 }}>
          
          {/* DATE FIELD */}
          <TextField 
            label="Date" 
            name="date" 
            type="date"
            value={formData.date} 
            onChange={handleChange} 
            fullWidth 
            InputLabelProps={{ shrink: true }} 
          />
          
          {/* CAR MODEL FIELD */}
          <TextField 
            label="Car Model" 
            name="name" 
            placeholder="e.g. Toyota Vios"
            value={formData.name} 
            onChange={handleChange} 
            fullWidth 
          />
          
          {/* AMOUNT FIELD */}
          <TextField 
            label="Amount" 
            name="amount" 
            type="number"
            value={formData.amount} 
            onChange={handleChange} 
            fullWidth 
            InputProps={{
              startAdornment: <InputAdornment position="start">₱</InputAdornment>,
            }}
          />

        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={() => setOpen(false)} 
          sx={{ textTransform: "none", color: "gray" }}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleAddVehicle} 
          sx={{ 
            textTransform: "none", 
            borderRadius: "8px",
            px: 4,
            backgroundColor: "#1976d2" 
          }}
        >
          Add Record
        </Button>
      </DialogActions>
    </Dialog>
  );
}