import { Typography, Box, Container } from "@mui/material";
import ParkingReportTable from "../../components/dashboard/ParkingReportTable";
import VehicleStatCard from "../../components/dashboard/VehicleStatCard";
import { useVehicles } from "../../context/vehicleContext/useVehicles";

export default function Dashboard() {
  const { vehicles, error } = useVehicles();
  const totalVehicles = vehicles.length;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 6 }}>
        <Typography
          variant="h4"
          fontWeight="bold"
          gutterBottom
          color="black"
        >
          Dashboard
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: 3,
            mb: 4,
            flexWrap: "wrap"
          }}
        >
          <VehicleStatCard totalVehicles={totalVehicles} />
        </Box>

        {error ? (
          <Typography color="error" mb={2}>
            {error}
          </Typography>
        ) : null}

        <ParkingReportTable />
      </Box>
    </Container>
  );
}
