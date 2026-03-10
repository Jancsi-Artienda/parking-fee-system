import { useEffect, useState } from "react";
import ParkingReportTable from "../../components/dashboard/ParkingReportTable";
import VehicleStatCard from "../../components/dashboard/VehicleStatCard";
import { useVehicles } from "../../context/vehicleContext/useVehicles";
import api from "../../services/api";

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
        const data = await api.getReports();
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mt-8 mb-12 rounded-2xl">

        <h1 className="text-3xl font-bold mb-6 text-indigo-900">
          Dashboard
        </h1>

        <div className="flex flex-wrap gap-6 mb-8">
          <VehicleStatCard totalVehicles={totalVehicles} />
        </div>

        {error && (
          <p className="text-red-600 mb-4">{error}</p>
        )}

        {reportError && (
          <p className="text-red-600 mb-4">{reportError}</p>
        )}

        <ParkingReportTable
          rows={reportRows}
          loading={reportLoading}
          title="Recent Parking Reports"
          emptyMessage="No reports yet."
        />
      </div>
    </div>
  );
}