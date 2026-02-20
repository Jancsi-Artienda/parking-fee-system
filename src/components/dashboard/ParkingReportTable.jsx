import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,

} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useVehicles } from "../../context/vehicleContext/useVehicles";

// Initial empty rows
const createInitialRows = () =>
  Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    parkingDate: null,
    vehicleId: "",
    amount: "",
  }));

export default function ParkingReportTable() {
  const { vehicles } = useVehicles();
  const [rows] = useState(createInitialRows());

  // Function to update the state when an input changes


  const columns = [
    {
      field: "parkingDate",
      headerName: "Date",
      flex: 1,
      headerAlign: "center",
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
      
        
        </Box>
      ),
    },
    {
      field: "vehicleId",
      headerName: "Vehicle",
      flex: 1.5,
      headerAlign: "center",
      align: "center",
      valueGetter: (value, row) => {
        
        const vehicle = vehicles.find((v) => v.id === value);
        return vehicle ? `${vehicle.type} - ${vehicle.name}` : "";
      },
    }, 
    { 
      field: "amount",
      headerName: "Amount",
      flex: 1,
      headerAlign: "center",
      align: "center",
      editable: true,
    }, 
  ];
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper sx={{ width: "100%", p: 3, borderRadius: "15px" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: "500" }}>
            Parking Fee Report
          </Typography>

          <Button
            variant="outlined"
            startIcon={<span>🖨️</span>}
            onClick={() => window.print()}
            sx={{
              borderRadius: "10px",
              color: "black",
              borderColor: "#7dc9ff",
              textTransform: "none",
            }}
          >
            Print
          </Button>
        </Box>

        <Box sx={{ height: 500, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            rowHeight={70}
            disableColumnSorting
            disableColumnMenu
            hideFooterPagination
            
            sx={{
              border: "none",
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#f5f5f5",
                fontWeight: "bold",
              },
            }}
          />
        </Box>
      </Paper>
    </LocalizationProvider>
  );
}