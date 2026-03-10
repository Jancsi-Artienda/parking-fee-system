import Swal from "sweetalert2";
import { useRef, useState } from "react";
import { useVehicles } from "../../context/vehicleContext/useVehicles";
import { X } from "lucide-react";

const VEHICLE_TYPE_OPTIONS = ["Car", "Motorcycle"];
const UPPERCASE_FIELDS = new Set(["name", "plate", "color"]);
const VEHICLE_LIMIT_ERROR_REGEX =
  /(vehicle\s*limit|limit\s*reached|max(?:imum)?\s*vehicles?|cannot\s*add\s*more\s*vehicles?|no\s*more\s*vehicles?)/i;

export default function AddVehicleModal({ open, setOpen }) {
  const { addVehicle, vehicles } = useVehicles();

  const [formData, setFormData] = useState({
    type: "",
    name: "",
    plate: "",
    color: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");
  const submitLockRef = useRef(false);

  const isLimitReached = Array.isArray(vehicles) && vehicles.length >= 1;

  const handleChange = (e) => {
    const { name, value } = e.target;
    const normalizedValue = UPPERCASE_FIELDS.has(name) ? value.toUpperCase() : value;
    if (localError) setLocalError("");
    setFormData({ ...formData, [name]: normalizedValue });
  };

  const handleClose = () => {
    if (submitting) return;
    setLocalError("");
    setOpen(false);
  };

  const handleAddVehicle = async () => {
    if (submitLockRef.current || submitting) return;

    if (!formData.type.trim() || !formData.name.trim() || !formData.plate.trim()) {
      setLocalError("Type, model, and plate are required.");
      return;
    }

    const normalizedPlate = formData.plate.trim().toUpperCase();
    submitLockRef.current = true;
    setSubmitting(true);
    setLocalError("");

    try {
      await addVehicle({
        type: formData.type.trim(),
        name: formData.name.trim().toUpperCase(),
        plate: normalizedPlate,
        color: formData.color.trim().toUpperCase(),
      });
      setFormData({ type: "", name: "", plate: "", color: "" });
      setOpen(false);
      void Swal.fire({
        title: "Vehicle Added",
        text: "Your vehicle was added successfully.",
        icon: "success",
        confirmButtonText: "OK",
      });
    } catch (err) {
      const message = err?.message || "Failed to add vehicle.";
      const isVehicleLimitError = VEHICLE_LIMIT_ERROR_REGEX.test(message);
      if (isVehicleLimitError) {
        setLocalError("");
        setOpen(false);
        await Swal.fire({
          title: "Vehicle Limit Reached",
          text: message,
          icon: "warning",
          confirmButtonText: "OK",
        });
      } else {
        setLocalError(message);
        await Swal.fire({
          title: "Add Vehicle Failed",
          text: message,
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } finally {
      setSubmitting(false);
      submitLockRef.current = false;
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Add New Vehicle</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4 px-6 pb-4 overflow-y-auto flex-1">

          {/* Vehicle Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-900 text-gray-800"
            >
              <option value="" disabled>Select type</option>
              {VEHICLE_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* Vehicle Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Model
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. NMAX"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-900 text-gray-800 placeholder-gray-400"
            />
          </div>

          {/* Plate Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Plate No.
            </label>
            <input
              type="text"
              name="plate"
              value={formData.plate}
              onChange={handleChange}
              placeholder="e.g. ABC 1234"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-900 text-gray-800 placeholder-gray-400"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Color
            </label>
            <input
              type="text"
              name="color"
              value={formData.color}
              onChange={handleChange}
              placeholder="e.g. BLACK"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-900 text-gray-800 placeholder-gray-400"
            />
          </div>

          {/* Limit Warning */}
          {isLimitReached && (
            <p className="text-yellow-600 text-sm font-medium">
              Vehicle limit reached. You can only register 1 vehicle. Delete your existing vehicle to register a new one.
            </p>
          )}

          {/* Error */}
          {localError && (
            <p className="text-red-500 text-sm">{localError}</p>
          )}

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={handleClose}
            disabled={submitting}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAddVehicle}
            disabled={submitting || isLimitReached}
            className="px-6 py-2 text-sm text-white font-semibold rounded-xl bg-[#1a237e] hover:bg-[#0d47a1] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Adding..." : "Add Vehicle"}
          </button>
        </div>

      </div>
    </div>
  );
}