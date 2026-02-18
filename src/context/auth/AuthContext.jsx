import { createContext, useState } from "react";
import AuthService from "../../services/AuthService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  })
  const [authError, setAuthError] = useState("");

  //const [loading, setLoading] = useState(false)
  // LOGIN
  const login = async (email, password) => {
    setAuthError("");
    const response = await AuthService.login(email, password);

    // when backend is ready this will come from API
    const userData = response.data;

    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  // REGISTER
  const register = async (userData) => {
    setAuthError("");
    const response = await AuthService.register(userData);
    return response.data;
  };

  // UPDATE PROFILE
  const updateProfile = async (profileData) => {
    setAuthError("");
    const response = await AuthService.updateProfile(profileData);
    const updatedUser = { ...(user || {}), ...response.data };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    return updatedUser;
  };

  // LOGOUT
  const logout = () => {
    setUser(null);
    setAuthError("");
    localStorage.removeItem("user");
  };

  const value = {
    user,
    authError,
    login,
    register,
    updateProfile,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export {AuthContext}
