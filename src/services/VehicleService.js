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

function getAuthHeaders() {
  try {
    const rawUser = localStorage.getItem("user");
    const parsedUser = rawUser ? JSON.parse(rawUser) : null;
    const token = parsedUser?.token;

    if (!token) {
      return {};
    }

    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}

export const vehicleService = {
  async getVehicles() {
    if (!import.meta.env.VITE_API_URL) {
      await delay(300);
      return [...vehicles];
    }

    const response = await apiClient.get("/vehicles", {
      headers: getAuthHeaders(),
    });
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

    const response = await apiClient.post("/vehicles", data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async deleteVehicle(id) {
    if (!import.meta.env.VITE_API_URL) {
      await delay(300);
      vehicles = vehicles.filter((item) => item.id !== id);
      return { id };
    }

    await apiClient.delete(`/vehicles/${id}`, {
      headers: getAuthHeaders(),
    });
    return { id };
  },
};
