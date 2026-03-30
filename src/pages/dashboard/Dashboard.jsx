import { useEffect, useState } from "react";
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
    <div className=" mx-auto px-4 mb-10 ">
      <div className=" mt-8 rounded-2xl ">
        
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-blue-50">
          Dashboard
        </h1>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <VehicleStatCard totalVehicles={totalVehicles} />
          <TotalFeeStatCard totalFee={totalVehicles} />
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