import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/auth/AuthContext";
import { VehicleProvider } from "./context/vehicleContext/VehicleProvider";
import { Toaster } from "sonner";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <VehicleProvider>
        <App />
        <Toaster position="top-center" richColors />
      </VehicleProvider>
    </AuthProvider>
  </StrictMode>
);
