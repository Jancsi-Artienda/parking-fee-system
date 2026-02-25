import { Card, Typography, Button, CardContent } from "@mui/material";

export default function VehicleCard({ vehicle, onDelete, deleting }) {
  return (
    <Card
      elevation={6}
      sx={{
        backgroundColor: "#ffffff",
        borderRadius: "16px",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={600} mb={2} color="#000">
          {vehicle.name}
        </Typography>

        <Typography variant="body2" color="#000" mb={1}>
          Vehicle type: {vehicle.type}
        </Typography>

        <Typography variant="body2" color="#000" mb={1}>
          Plate No: {vehicle.plate}
        </Typography>

        <Typography variant="body2" color="#000" mb={1}>
          Color: {vehicle.color}
        </Typography>

        <Typography variant="body2" mb={2} color="#000">
          Registered: {vehicle.registered}
        </Typography>

        <Button
          size="small"
          onClick={() => onDelete?.(vehicle.id)}
          disabled={deleting}
          sx={{
            backgroundColor: "#E60000",
            color: "#fff",
            borderRadius: "12px",
            textTransform: "none",
            "&:hover": {
              backgroundColor: "#cc0000",
            },
          }}
        >
          {deleting ? "Deleting..." : "Delete"}
        </Button>
      </CardContent>
    </Card>
  );
}
