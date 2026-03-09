import { createContext, useState } from "react";
import api from "../../services/api";
import {
  clearStoredUser,
  readStoredUser,
  storeUser,
  updateStoredUser,
} from "../../utils/authStorage";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readStoredUser());
  const [authError, setAuthError] = useState("");

  //const [loading, setLoading] = useState(false)
  // LOGIN
  const login = async (email, password, rememberMe = false) => {
    setAuthError("");
    const response = await api.login(email, password);

    // when backend is ready this will come from API
    const userData = response.data;

    setUser(userData);
    storeUser(userData, rememberMe);
  };

  // REGISTER
  const register = async (userData) => {
    setAuthError("");
    const response = await api.register(userData);
    return response.data;
  };

  // UPDATE PROFILE
  const updateProfile = async (profileData) => {
    setAuthError("");
    const response = await api.updateProfile(profileData);
    const updatedUser = { ...(user || {}), ...response.data };
    setUser(updatedUser);
    updateStoredUser(updatedUser);
    return updatedUser;
  };

  // LOGOUT
  const logout = () => {
    setUser(null);
    setAuthError("");
    clearStoredUser();
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
