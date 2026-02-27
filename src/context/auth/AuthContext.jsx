import { createContext, useState } from "react";
import AuthService from "../../services/AuthService";

const AuthContext = createContext();

function readStoredUser() {
  try {
    const localUser = localStorage.getItem("user");
    if (localUser) {
      return { user: JSON.parse(localUser), storage: "local" };
    }

    const sessionUser = sessionStorage.getItem("user");
    if (sessionUser) {
      return { user: JSON.parse(sessionUser), storage: "session" };
    }
  } catch {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
  }

  return { user: null, storage: "local" };
}

export const AuthProvider = ({ children }) => {
  const [{ user: initialUser, storage: initialStorage }] = useState(() => [readStoredUser()]);
  const [user, setUser] = useState(initialUser);
  const [storageType, setStorageType] = useState(initialStorage);
  const [authError, setAuthError] = useState("");

  //const [loading, setLoading] = useState(false)
  // LOGIN
  const login = async (email, password, options = {}) => {
    const rememberMe = options.rememberMe !== false;
    setAuthError("");
    const response = await AuthService.login(email, password);

    // when backend is ready this will come from API
    const userData = response.data;

    setUser(userData);
    const nextStorage = rememberMe ? "local" : "session";
    setStorageType(nextStorage);

    if (rememberMe) {
      localStorage.setItem("user", JSON.stringify(userData));
      sessionStorage.removeItem("user");
    } else {
      sessionStorage.setItem("user", JSON.stringify(userData));
      localStorage.removeItem("user");
    }
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
    if (storageType === "session") {
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
    } else {
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
    return updatedUser;
  };

  // LOGOUT
  const logout = () => {
    setUser(null);
    setAuthError("");
    setStorageType("local");
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
