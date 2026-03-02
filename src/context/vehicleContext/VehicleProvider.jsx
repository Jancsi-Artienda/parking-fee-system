import { useEffect, useState } from "react";
import { VehicleContext } from "./VehicleContext";
import { vehicleService } from "../../services/VehicleService";
import useAuth from "../auth/useAuth";

export function VehicleProvider({ children }) {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const token = user?.token || null;

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!token && import.meta.env.VITE_API_URL) {
        setVehicles([]);
        setError("");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await vehicleService.getVehicles();
        setVehicles(Array.isArray(data) ? [...data] : []);
      } catch (err) {
        setError(err?.data?.message || "Failed to load vehicles.");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [token]);

  const addVehicle = async (vehicleData) => {
    setError("");

    try {
      const newVehicle = await vehicleService.addVehicle(vehicleData);
      setVehicles(prev => [...prev, newVehicle]);
      return newVehicle;
    } catch (err) {
      const message = err?.data?.message || "Failed to add vehicle.";
      setError(message);
      throw new Error(message);
    }
  };

  const deleteVehicle = async (id) => {
    setError("");

    try {
      await vehicleService.deleteVehicle(id);
      setVehicles((prev) => prev.filter((vehicle) => vehicle.id !== id));
    } catch (err) {
      const message = err?.data?.message || "Failed to delete vehicle.";
      setError(message);
      throw new Error(message);
    }
  };

  return (
    <VehicleContext.Provider value={{ vehicles, loading, error, addVehicle, deleteVehicle }}>
      {children}
    </VehicleContext.Provider>
  );
}
