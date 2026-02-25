import { Box, Typography, Button, Grid } from "@mui/material";
import { useState } from "react";
import VehicleCard from "../../components/vehicleComp/VehicleCard";
import AddVehicleModal from "../../components/vehicleComp/AddVehicleModal"
import { useVehicles } from "../../context/vehicleContext/useVehicles"
import Swal from "sweetalert2";

export default function Vehicle() {
  const { vehicles, loading, error, deleteVehicle } = useVehicles();
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleDeleteVehicle = async (id) => {
    const result = await Swal.fire({
      title: "Delete vehicle?",
      text: "This vehicle will be removed from your account.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d32f2f",
    });

    if (!result.isConfirmed) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteVehicle(id);
      await Swal.fire({
        title: "Deleted",
        text: "Vehicle removed successfully.",
        icon: "success",
        confirmButtonText: "OK",
      });
    } catch (err) {
      await Swal.fire({
        title: "Delete failed",
        text: err?.message || "Unable to delete vehicle.",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={400} color="#000">
            My Vehicle
          </Typography>
          <Typography color="text.secondary">
            Manage your Registered Vehicle
          </Typography>
        </Box>

        <Button
          variant="outlined"
          onClick={() => setOpen(true)}
          sx={{
            borderRadius: "20px",
            textTransform: "none",
            px: 3,
          }}
        >
          Add Vehicle
        </Button>
      </Box>

      {loading ? (
        <Typography>Loading vehicles...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Grid container spacing={3}>
          {vehicles.map((vehicle) => (
            <Grid item xs={12} sm={6} md={4} key={vehicle.id}>
              <VehicleCard
                vehicle={vehicle}
                onDelete={handleDeleteVehicle}
                deleting={deletingId === vehicle.id}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <AddVehicleModal open={open} setOpen={setOpen} />
    </Box>
  );
}
