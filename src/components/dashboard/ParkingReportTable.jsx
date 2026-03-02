import { useMemo } from "react";
import { Box, Button, Paper, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import dayjs from "dayjs";

function formatReportDate(value) {
  if (!value) return "";

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = dayjs(value, "YYYY-MM-DD", true);
    return parsed.isValid() ? parsed.format("M/D/YYYY") : value;
  }

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("M/D/YYYY") : "";
}

export default function ParkingReportTable({
  rows = [],
  loading = false,
  title = "Parking Fee Report",
  emptyMessage = "No reports found.",
  withPaper = true,
  maxRows,
  onRowSelectionChange,
  onDeleteRow,
}) {
  const hasControlledSelection = typeof onRowSelectionChange === "function";

  const normalizedRows = useMemo(
    () =>
      (rows || [])
        .filter(Boolean)
        .map((row, index) => ({
          ...row,
          _rowId:
            row.id ??
            `${index}-${row.transDate || ""}-${row.vehicleModel || ""}-${row.amount || ""}`,
        })),
    [rows]
  );
  const displayRows = useMemo(() => {
    if (!Number.isInteger(maxRows) || maxRows <= 0) {
      return normalizedRows;
    }
    return normalizedRows.slice(0, maxRows);
  }, [normalizedRows, maxRows]);

  const columns = useMemo(() => {
    const baseColumns = [
      {
        field: "transDate",
        headerName: "Date",
        flex: 1,
        headerAlign: "center",
        align: "center",
        valueGetter: (_value, row) => formatReportDate(row.transDate),
      },
      {
        field: "vehicleModel",
        headerName: "Vehicle Model",
        flex: 1.2,
        headerAlign: "center",
        align: "center",
      },
      {
        field: "amount",
        headerName: "Amount",
        flex: 1,
        headerAlign: "center",
        align: "center",
        valueGetter: (value) => `PHP ${Number(value || 0).toLocaleString()}`,
      },
    ];

    if (typeof onDeleteRow !== "function") {
      return baseColumns;
    }

    return [
      ...baseColumns,
      {
        field: "__actions",
        headerName: "",
        width: 130,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        align: "right",
        renderCell: (params) => (
          <Button
            size="small"
            color="error"
            variant="outlined"
            className="row-delete-btn"
            onClick={(event) => {
              event.stopPropagation();
              onDeleteRow(params.row);
            }}
            sx={{ textTransform: "none", minWidth: 96 }}
          >
            Delete
          </Button>
        ),
      },
    ];
  }, [onDeleteRow]);

  const gridContent = (
    <>
      {title ? (
        <Typography variant="h5" sx={{ fontWeight: 500, mb: 3 }}>
          {title}
        </Typography>
      ) : null}

      <Box sx={{ height: 500, width: "100%" }}>
        <DataGrid
          rows={displayRows}
          columns={columns}
          loading={loading}
          rowHeight={70}
          getRowId={(row) => row._rowId}
          disableColumnSorting
          disableColumnMenu
          hideFooterPagination
          localeText={{ noRowsLabel: emptyMessage }}
          {...(hasControlledSelection
            ? {
                onRowSelectionModelChange: onRowSelectionChange,
              }
            : {})}
          sx={{
            border: "none",
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#f5f5f5",
              fontWeight: "bold",
            },
            "& .row-delete-btn": {
              opacity: 0,
              pointerEvents: "none",
              transition: "opacity 0.18s ease",
            },
            "& .MuiDataGrid-row:hover .row-delete-btn": {
              opacity: 1,
              pointerEvents: "auto",
            },
            "& .MuiDataGrid-row.Mui-selected .row-delete-btn": {
              opacity: 1,
              pointerEvents: "auto",
            },
          }}
        />
      </Box>
    </>
  );

  if (!withPaper) {
    return gridContent;
  }

  return (
    <Paper sx={{ width: "95%", p: 3, borderRadius: "15px" }} elevation={6}>
      {gridContent}
    </Paper>
  );
}

