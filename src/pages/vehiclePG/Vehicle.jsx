import { useState } from "react";
import VehicleCard from "../../components/vehicleComp/VehicleCard";
import AddVehicleModal from "../../components/vehicleComp/AddVehicleModal";
import { useVehicles } from "../../context/vehicleContext/useVehicles";
import Swal from "sweetalert2";
import { Plus } from "lucide-react";

export default function Vehicle() {
  const { vehicles, loading, error, deleteVehicle } = useVehicles();
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleDeleteVehicle = async (id) => {
    const result = await Swal.fire({
      title: "Delete vehicle?",
      text: "This vehicle will be removed from your account.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d32f2f",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    setDeletingId(id);
    try {
      await deleteVehicle(id);
      await Swal.fire({
        title: "Deleted",
        text: "Vehicle removed successfully.",
        icon: "success",
        confirmButtonText: "OK",
      });
    } catch (err) {
      await Swal.fire({
        title: "Delete failed",
        text: err?.message || "Unable to delete vehicle.",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white h-full w-full flex flex-col">
      <div className="p-8 flex flex-col flex-1 min-h-0">

        {/* Header */}
        <div className="flex justify-between items-center mb-8 flex-shrink-0">
          <div>
            <h1 className="text-3xl font-normal text-black">My Vehicle</h1>
            <p className="text-gray-500 mt-1">Manage your Registered Vehicle</p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center justify-center gap-1 px-4 py-2 text-sm border border-blue-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors duration-150"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Vehicle</span>
            <span className="sm:hidden text-sm font-medium">Add</span>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl border border-gray-100 bg-gray-100 p-6">
          {loading && (
            <p className="text-gray-600">Loading vehicles...</p>
          )}

          {!loading && error && (
            <p className="text-red-600">{error}</p>
          )}

          {/* Vehicle Grid */}
          {!loading && (
            vehicles.length > 0 ? (
              <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
                {vehicles.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    onDelete={handleDeleteVehicle}
                    deleting={deletingId === vehicle.id}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No vehicles added yet.</p>
            )
          )}
        </div>
        <AddVehicleModal open={open} setOpen={setOpen} />
      </div>
    </div>
  );
}