import { Typography, Box, Container } from "@mui/material";
import { useEffect, useState } from "react";
import ParkingReportTable from "../../components/dashboard/ParkingReportTable";
import VehicleStatCard from "../../components/dashboard/VehicleStatCard";
import { useVehicles } from "../../context/vehicleContext/useVehicles";
import parkingReportService from "../../services/ParkingReportService";

export default function Dashboard() {
  const { vehicles, error } = useVehicles();
  const [reportRows, setReportRows] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const totalVehicles = vehicles.length;

  useEffect(() => {
    const loadReports = async () => {
      setReportLoading(true);
      setReportError("");

      try {
        const data = await parkingReportService.getReports();
        setReportRows(data.slice(0, 5));
      } catch (err) {
        setReportError(err?.data?.message || "Failed to load dashboard reports.");
      } finally {
        setReportLoading(false);
      }
    };

    loadReports();
  }, []);

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

        {reportError ? (
          <Typography color="error" mb={2}>
            {reportError}
          </Typography>
        ) : null}

        <ParkingReportTable
          rows={reportRows}
          loading={reportLoading}
          title="Recent Parking Reports"
          emptyMessage="No reports yet."
        />
      </Box>
    </Container>
  );
}
