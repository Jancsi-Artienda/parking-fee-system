import apiClient from "./apiClient";

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

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

let reports = [];

const parkingReportService = {
  async getReports() {
    if (!import.meta.env.VITE_API_URL) {
      await delay(200);
      return [...reports];
    }

    const response = await apiClient.get("/reports", {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async addReport(payload) {
    if (!import.meta.env.VITE_API_URL) {
      await delay(200);
      const row = {
        id: Date.now(),
        ...payload,
        vehicleModel: payload.vehicleModel || "",
      };
      reports = [row, ...reports];
      return row;
    }

    const response = await apiClient.post("/reports", payload, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};

export default parkingReportService;
