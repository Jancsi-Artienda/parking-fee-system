import { useEffect, useState } from "react";
import { VehicleContext } from "./VehicleContext";
import { vehicleService } from "../../services/VehicleService";

export function VehicleProvider({ children }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await vehicleService.getVehicles();
        setVehicles([...data]);
      } catch (err) {
        setError(err?.data?.message || "Failed to load vehicles.");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

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

  return (
    <VehicleContext.Provider value={{ vehicles, loading, error, addVehicle }}>
      {children}
    </VehicleContext.Provider>
  );
}
