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

const AuthService = {
  async login(email, password) {
    if (!import.meta.env.VITE_API_URL) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: {
              id: 1,
              email,
              name: "Test User",
            },
          });
        }, 500);
      });
    }

    return apiClient.post("/auth/login", { email, password });
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

    return apiClient.patch("/auth/profile", profileData, {
      headers: getAuthHeaders(),
    });
  },
};

export default AuthService;
