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
  async getCoverage() {
    if (!import.meta.env.VITE_API_URL) {
      await delay(100);
      return { coverageFrom: "", coverageTo: "" };
    }

    const response = await apiClient.get("/reports/coverage", {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async saveCoverage({ coverageFrom, coverageTo }) {
    if (!import.meta.env.VITE_API_URL) {
      await delay(100);
      return { coverageFrom, coverageTo };
    }

    const response = await apiClient.put(
      "/reports/coverage",
      { coverageFrom, coverageTo },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

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

  async deleteReport(transDate) {
    if (!transDate) {
      throw new Error("Transaction date is required.");
    }

    if (!import.meta.env.VITE_API_URL) {
      await delay(200);
      reports = reports.filter((row) => row.transDate !== transDate);
      return { message: "Report deleted successfully." };
    }

    const response = await apiClient.delete(`/reports/${encodeURIComponent(transDate)}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};

export default parkingReportService;
