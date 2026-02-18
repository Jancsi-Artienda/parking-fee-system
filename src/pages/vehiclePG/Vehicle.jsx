import { Box, Typography, Button, Grid } from "@mui/material";
import { useState } from "react";
import VehicleCard from "../../components/vehicleComp/VehicleCard";
import AddVehicleModal from "../../components/vehicleComp/AddVehicleModal"
import { useVehicles } from "../../context/vehicleContext/useVehicles"

export default function Vehicle() {
  const { vehicles, loading, error } = useVehicles();
  const [open, setOpen] = useState(false);

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
              <VehicleCard vehicle={vehicle} />
            </Grid>
          ))}
        </Grid>
      )}

      <AddVehicleModal open={open} setOpen={setOpen} />
    </Box>
  );
}
