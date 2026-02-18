import { useContext } from "react";
import { VehicleContext } from "./VehicleContext";

export function useVehicles() {
  return useContext(VehicleContext);
}
