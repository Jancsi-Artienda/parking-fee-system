import apiClient from "./apiClient";

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

    return apiClient.patch("/auth/profile", profileData);
  },
};

export default AuthService;
