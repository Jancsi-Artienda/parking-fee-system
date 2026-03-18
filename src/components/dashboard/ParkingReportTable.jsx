import { useMemo } from "react";
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
    if (!Number.isInteger(maxRows) || maxRows <= 0) return normalizedRows;
    return normalizedRows.slice(0, maxRows);
  }, [normalizedRows, maxRows]);

  const columns = useMemo(() => {
    const baseColumns = [
      {
        field: "transDate",
        headerName: "Date",
        flex: 1,
        minWidth: 90,          
        resizable: false,
        headerAlign: "center",
        align: "center",
        valueGetter: (_value, row) => formatReportDate(row.transDate),
      },
      {
        field: "vehicleModel",
        headerName: "Vehicle Model",
        flex: 1.2,
        minWidth: 110,       
        resizable: false,
        headerAlign: "center",
        align: "center",
      },
      {
        field: "amount",
        headerName: "Amount",
        flex: 1,
        minWidth: 90,          
        resizable: false,
        headerAlign: "center",
        align: "center",
        valueGetter: (value) => `PHP ${Number(value || 0).toLocaleString()}`,
      },
    ];

    if (typeof onDeleteRow !== "function") return baseColumns;

    return [
      ...baseColumns,
      {
        field: "__actions",
        headerName: "",
        width: 130,
        resizable: false,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        align: "right",
        renderCell: (params) => (
          <button
            className="row-delete-btn px-4 py-1 text-sm text-red-500 border border-red-500 rounded-lg hover:bg-red-50 transition-colors duration-150"
            onClick={(event) => {
              event.stopPropagation();
              onDeleteRow(params.row);
            }}
          >
            Delete
          </button>
        ),
      },
    ];
  }, [onDeleteRow]);

  const gridContent = (
    <>
      {title && (
        <h2 className="text-lg md:text-xl font-medium mb-4 md:mb-6">{title}</h2>
       
      )}

      <div className="overflow-x-auto">
        <div className="min-w-[320px] h-[500px]">
          
          <DataGrid
            rows={displayRows}
            columns={columns}
            loading={loading}
            rowHeight={70}
            getRowId={(row) => row._rowId}
            disableColumnResize
            disableColumnSorting
            disableColumnMenu
            hideFooterPagination
            localeText={{ noRowsLabel: emptyMessage }}
            {...(hasControlledSelection
              ? { onRowSelectionModelChange: onRowSelectionChange }
              : {})}
            sx={{
              border: "none",
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#f5f5f5",
                fontWeight: "bold",
              },
              "& .MuiDataGrid-columnSeparator": {
                pointerEvents: "none",
                opacity: 0,
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
        </div>
      </div>
    </>
  );

  if (!withPaper) return gridContent;

  return (
   
    <div className="w-full p-4 md:p-6 rounded-2xl shadow-lg bg-white">
      {gridContent}
    </div>
  );
}
