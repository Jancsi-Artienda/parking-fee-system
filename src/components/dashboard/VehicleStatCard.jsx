import { Card, CardContent, Typography, Box } from "@mui/material";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";

export default function VehicleStatCard({ totalVehicles }) {
  return (
    <Card
      elevation={4}
      sx={{
        borderRadius: 3,
        minWidth: 250,
        transition: "0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
        },
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Registered Vehicles
            </Typography>

            <Typography variant="h4" fontWeight="bold">
              {totalVehicles}
            </Typography>
          </Box>

          <DirectionsCarIcon sx={{ fontSize: 40 }} color="primary" />
        </Box>
      </CardContent>
    </Card>
  );
}