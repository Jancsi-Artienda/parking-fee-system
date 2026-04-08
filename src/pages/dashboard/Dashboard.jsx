import { useCallback, useEffect, useMemo, useState } from "react";
import ParkingReportTable from "../../components/dashboard/ParkingReportTable";
import VehicleStatCard from "../../components/dashboard/VehicleStatCard";
import TotalFeeStatCard from "../../components/dashboard/TotalFee";
import { useVehicles } from "../../context/vehicleContext/useVehicles";
import api from "../../services/api";


export default function Dashboard() {
  const { vehicles, error } = useVehicles();
  const [reportRows, setReportRows] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const totalVehicles = vehicles.length;

  const isUnprintedStatus = (status) =>
    status === false ||
    status === 0 ||
    status === "0" ||
    status === "false" ||
    status === "FALSE" ||
    status == null;

  const totalFee = useMemo(() => {
    const rows = Array.isArray(reportRows) ? reportRows : [];
    const unprintedRows = rows.filter((row) => isUnprintedStatus(row?.status));
    return unprintedRows.reduce(
      (sum, row) => sum + Number(row?.amount || 0),
      0
    );
  }, [reportRows]);

  const loadReports = useCallback(async () => {
    try {
      setReportLoading(true);
      setReportError("");

      const data = await api.getReports();
      const rows = Array.isArray(data) ? data : [];

      const visibleRows = rows.filter((row) => isUnprintedStatus(row?.status)).slice(0, 5);
      setReportRows(visibleRows);
    } catch (err) {
      setReportError(err?.response?.data?.message || "Failed to load dashboard reports.");
    } finally {
      setReportLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    const handlePrinted = () => {
      loadReports();
    };

    const handleStorage = (event) => {
      if (event.key === "reportsPrintedAt") {
        loadReports();
      }
    };

    window.addEventListener("reports:printed", handlePrinted);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("reports:printed", handlePrinted);
      window.removeEventListener("storage", handleStorage);
    };
  }, [loadReports]);

  return (
    <div className=" mx-auto px-4 mb-10 ">
      <div className=" mt-8 rounded-2xl ">
        
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-blue-50">
          Dashboard
        </h1>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <VehicleStatCard totalVehicles={totalVehicles} />
          <TotalFeeStatCard totalFee={totalFee} />
        </div>



        {error && (
          <p className="text-red-600 mb-4">{error}</p>
        )}

        {reportError && (
          <p className="text-red-600 mb-4">{reportError}</p>
        )}


        <div className="overflow-x-auto">
          <ParkingReportTable
            rows={reportRows}
            loading={reportLoading}
            title="RECENT REPORTS"
            emptyMessage="No reports yet."
          />
        </div>
      </div>
    </div>
  );
}
