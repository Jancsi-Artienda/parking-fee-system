import { createContext, useState } from "react";
import AuthService from "../../services/AuthService";

const AuthContext = createContext();

function readStoredUser() {
  try {
    const localUser = localStorage.getItem("user");
    if (localUser) {
      return JSON.parse(localUser);
    }

    const sessionUser = sessionStorage.getItem("user");
    if (sessionUser) {
      // Backward compatibility for older temporary sessions.
      const parsedSessionUser = JSON.parse(sessionUser);
      localStorage.setItem("user", JSON.stringify(parsedSessionUser));
      sessionStorage.removeItem("user");
      return parsedSessionUser;
    }
  } catch {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
  }

  return null;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readStoredUser());
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
    sessionStorage.removeItem("user");
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
    sessionStorage.removeItem("user");
    return updatedUser;
  };

  // LOGOUT
  const logout = () => {
    setUser(null);
    setAuthError("");
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
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
