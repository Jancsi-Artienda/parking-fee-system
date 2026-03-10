import { Car } from "lucide-react";

export default function VehicleStatCard({ totalVehicles }) {
  return (
    <div className="pl-10  bg-white rounded-2xl shadow-md min-w-[250px] p-5 transition-transform duration-200 hover:-translate-y-1">
      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm text-gray-500 ">Registered Vehicles</p>
          <p className="text-4xl font-bold text-center mt-1">{totalVehicles}</p>
        </div>

        <Car size={50} className="text-black-600" />

      </div>
    </div>
  );
}