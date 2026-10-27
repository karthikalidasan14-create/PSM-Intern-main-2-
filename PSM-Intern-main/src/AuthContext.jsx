import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AuthAPI } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("psm_user");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });
  
  const [token, setToken] = useState(() => localStorage.getItem("psm_token"));

  useEffect(() => {
    if (!token) return;
    AuthAPI.me()
      .then((profile) => {
        setUser(profile);
        localStorage.setItem("psm_user", JSON.stringify(profile));
      })
      .catch(() => {
        logout();
      });
  }, [token]);

  function login(accessToken, profile) {
    localStorage.setItem("psm_token", accessToken);
    localStorage.setItem("psm_user", JSON.stringify(profile));
    setToken(accessToken);
    setUser(profile);
  }

  function logout() {
    localStorage.removeItem("psm_token");
    localStorage.removeItem("psm_user");
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      token,
      login,
      logout,
      isAdmin: user?.role === "admin",
      isStaff: Boolean(user),
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
