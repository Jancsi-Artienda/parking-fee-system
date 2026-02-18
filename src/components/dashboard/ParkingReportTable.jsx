import { useState } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  Typography,
  Button
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers";
import { Print } from "@mui/icons-material";
import { useVehicles } from "../../context/vehicleContext/useVehicles";

const createInitialRows = () =>
  Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    parkingDate: null,
    vehicleId: "",
    amount: null
  }));

export default function ParkingReportTable() {
  const { vehicles } = useVehicles();
  const [rows, setRows] = useState(createInitialRows());

  const updateRow = (rowId, changes) => {
    setRows(prev =>
      prev.map(row =>
        row.id === rowId ? { ...row, ...changes } : row
      )
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper
        elevation={6}
        sx={{
          width: "100%",
          maxWidth: 1100,
          minHeight: 450,
          p: 3,
          display: "flex",
          flexDirection: "column",
          borderRadius: 3,
        }}
      >
        <Typography variant="h6" mb={2}>
          Parking Fee Report
        </Typography>

        <TableContainer
          sx={{
            maxHeight: 360,
            border: "1px solid #dddddd",
            borderRadius: 2,
            flexGrow: 1,
            overflowY: "auto",
            mt: 1,
          }}
        >
          <Table stickyHeader sx={{ tableLayout: "fixed" }}>
            <TableHead>
              <TableRow>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", width: "30%" }}
                >
                  Date
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", width: "45%" }}
                >
                  Vehicle
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", width: "25%" }}
                >
                  Amount
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <DatePicker
                      value={row.parkingDate}
                      onChange={(date) =>
                        updateRow(row.id, { parkingDate: date })
                      }
                      slotProps={{
                        textField: { size: "small", fullWidth: true },
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <Select
                      fullWidth
                      size="small"
                      value={row.vehicleId}
                      displayEmpty
                      onChange={(e) =>
                        updateRow(row.id, { vehicleId: e.target.value })
                      }
                    >
                      <MenuItem value="">
                        <em>Select Vehicle</em>
                      </MenuItem>
                      {vehicles.map((v) => (
                        <MenuItem key={v.id} value={v.id}>
                          {v.type} - {v.name} ({v.plate})
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>

                  <TableCell align="center" />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box display="flex" justifyContent="flex-end" mt={2}>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={() => window.print()}
          >
            Print
          </Button>
        </Box>
      </Paper>
    </LocalizationProvider>
  );
}
