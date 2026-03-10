import { useState } from "react";
import VehicleCard from "../../components/vehicleComp/VehicleCard";
import AddVehicleModal from "../../components/vehicleComp/AddVehicleModal";
import { useVehicles } from "../../context/vehicleContext/useVehicles";
import Swal from "sweetalert2";

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
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-normal text-black">My Vehicle</h1>
          <p className="text-gray-500 mt-1">Manage your Registered Vehicle</p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="border border-gray-400 text-gray-700 rounded-full px-6 py-2 hover:bg-gray-50 hover:border-gray-600 transition-colors"
        >
          Add Vehicle
        </button>
      </div>

      {/* States */}
      {loading && (
        <p className="text-gray-600">Loading vehicles...</p>
      )}

      {!loading && error && (
        <p className="text-red-600">{error}</p>
      )}

      {/* Vehicle Grid */}
      {!loading && (
        vehicles.length > 0 ? (
          <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
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

      <AddVehicleModal open={open} setOpen={setOpen} />
    </div>
  );
}