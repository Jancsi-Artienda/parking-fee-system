import dayjs from "dayjs";

const delay = (ms) => new Promise((res) => setTimeout(res,ms));

const toApiDate = (value) => {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : "";
}

let reports = [];

let vehicles = [
    {
        id: 1,
        type: "Motor",
        name: "NMAX",
        plate: "NPH 1234",
        color: "Blue",
        limit: 1,
        registered: "02/09/2026"
    }
]


const API_BASE_URL = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;

  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  const config = {
    method: options.method || "GET",
    credentials: "include",
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (error) {
    const networkError = new Error(
      "Network error. Check API URL, server status, and CORS settings."
    );
    networkError.status = 0;
    networkError.cause = error;
    throw networkError;
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const backendMessage =
      data && typeof data === "object" && typeof data.message === "string"
        ? data.message
        : "API request failed";
    const error = new Error(backendMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return { data };
}

const apiClient = {
  get(path, options) {
    return request(path, { ...options, method: "GET" });
  },
  post(path, body, options) {
    return request(path, { ...options, method: "POST", body });
  },
  put(path, body, options) {
    return request(path, { ...options, method: "PUT", body });
  },
  patch(path, body, options) {
    return request(path, { ...options, method: "PATCH", body });
  },
  delete(path, options) {
    return request(path, { ...options, method: "DELETE" });
  },
};

const api = {
  //Authentication
  async login(email, password, rememberMe = false) {
    if (!import.meta.env.VITE_API_URL) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: {
              id: 1,
              username: "test_user",
              email,
              name: "Test User",
            },
          });
        }, 500);
      });
    } 

    return apiClient.post("/auth/login", { email, password, rememberMe });
  },

  async logout() {
    if (!import.meta.env.VITE_API_URL) {
      return { data: { message: "Logged out successfully." } };
    }

    return apiClient.post("/auth/logout", {});
  },

  async register(userData) {
    if (!import.meta.env.VITE_API_URL) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: {
              message: "User registered successfully",
            },
          });
        }, 500);
      });
    }

    return apiClient.post("/auth/register", userData);
  },

  async updateProfile(profileData) {
    if (!import.meta.env.VITE_API_URL) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: {
              ...profileData,
            },
          });
        }, 500);
      });
    }

    return apiClient.patch("/auth/profile", profileData);
  },

  async forgotPassword(email) {
    if (!import.meta.env.VITE_API_URL) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: {
              message: "If an account exists for this email, a reset link has been sent.",
            },
          });
        }, 500);
      });
    }

    return apiClient.post("/auth/forgot-password", { email });
  },

  async changePassword(payload) {
    if (!import.meta.env.VITE_API_URL) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: {
              message: "Password updated successfully.",
            },
          });
        }, 500);
      });
    }

    return apiClient.post("/auth/change-password", payload);
  },


  //vehicle

  async getVehicles() {
    if (!import.meta.env.VITE_API_URL) {
        await delay(300);
        return[...vehicles];
    } 

    const response = await apiClient.get("/vehicles");
    return response.data;
  },

  async addVehicle(data){
    if(!import.meta.env.VITE_API_URL){
        await delay(300);

        if(vehicles.length >= 1){
            const error = new Error("Vehicle limit reached.");
            error.status = 400;
            throw error;
        }

        const newVehicle = {
            id: Date.now(),
            ...data,
            limit: 1,
            registered: new Date().toLocaleDateString()
        };

        vehicles = [...vehicles, newVehicle];
        return newVehicle;
    }

    const response = await apiClient.post("/vehicles", data);
    return response.data;
  },


  async deleteVehicle(id){
    if(!import.meta.env.VITE_API_URL){
        await delay(300);
        vehicles = vehicles.filter((item) => item.id !== id);
        return {id};
    }

    await apiClient.delete(`/vehicles/${id}`);
    return {id};
  },

  //ParkingReportService

  async getCoverage() {
    if(!import.meta.env.VITE_API_URL) {
      await delay(100);
      return {coverageFrom: "", coverageTo: ""};
    }

    const response = await apiClient.get("/reports/coverage");
    return response.data;
  },

  async saveCoverage({coverageFrom, coverageTo}) {
    if (!import.meta.env.VITE_API_URL) {
      await delay(100);
      return {coverageFrom, coverageTo};
    }

    const response = await apiClient.put(
      "/reports/coverage",
      {coverageFrom, coverageTo}
    );
    return response.data;
  },

  async getReports() {
    if(!import.meta.env.VITE_API_URL) {
      await delay(200);
      return [...reports];
    }

    const response = await apiClient.get("/reports");
    if (Array.isArray(response.data)){
      return response.data;
    }

    if (Array.isArray(response.data?.reports)){
      return response.data.reports;
    }
    return [];
  },

  async addReport(payload) {
    if (!import.meta.env.VITE_API_URL) {
      await delay(200);
      const row = {
        id: Date.now(),
        ...payload,
        vehicleModel: payload.vehicleModel || "",
      };
      reports = [row,...reports];
      return row;
    }
    const response = await apiClient.post("/reports", payload);
    return response.data;
  },

  async deleteReport(transDate) {
    const normalizeDate = toApiDate(transDate);
    if(!normalizeDate) {
      throw new Error("Transaction date is required.");
    } 

    if (!import.meta.env.VITE_API_URL) {
      await delay(200);
      reports = reports.filter((row) => toApiDate(row.transDate) !== normalizeDate);
      return {message: "Report deleted successfully."};
    } 

    const response = await apiClient.delete(`/reports/${encodeURIComponent(normalizeDate)}`);
    return response.data;
  }


};

export default api
