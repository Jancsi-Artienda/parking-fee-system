

export default function VehicleCard({ vehicle, onDelete, deleting }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6">

      <h2 className="text-xl font-semibold text-black mb-3">
        {vehicle.name}
      </h2>

      <p className="text-sm text-black mb-1">Vehicle type: {vehicle.type}</p>
      <p className="text-sm text-black mb-1">Plate No: {vehicle.plate}</p>
      <p className="text-sm text-black mb-1">Color: {vehicle.color}</p>
      <p className="text-sm text-black mb-4">Registered: {vehicle.registered}</p>

      <button
        onClick={() => onDelete?.(vehicle.id)}
        disabled={deleting}
        className=" px-4 py-2 text-sm text-white font-medium rounded-xl bg-[#E60000] hover:bg-[#cc0000] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {deleting ? "Deleting..." : "Delete"}
      </button>

    </div>
  );
}