import apiClient from "./apiClient";

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

let vehicles = [
  {
    id: 1,
    type: "Motorcycle",
    name: "NMAX",
    plate: "NPH 1234",
    color: "Blue",
    registered: "02/09/2026",
  },
];

export const vehicleService = {
  async getVehicles() {
    if (!import.meta.env.VITE_API_URL) {
      await delay(300);
      return [...vehicles];
    }

    const response = await apiClient.get("/vehicles");
    return response.data;
  },

  async addVehicle(data) {
    if (!import.meta.env.VITE_API_URL) {
      await delay(300);

      const newVehicle = {
        id: Date.now(),
        ...data,
        registered: new Date().toLocaleDateString(),
      };

      vehicles = [...vehicles, newVehicle];
      return newVehicle;
    }

    const response = await apiClient.post("/vehicles", data);
    return response.data;
  },
};
