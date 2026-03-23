import { createElement, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./auth-context.js";
import { apiUrl } from "../utils/api.js";

const USER_URL = apiUrl("/api/auth/user");

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const storeTokenInLS = (serverToken, userData = null) => {
    if (!serverToken) return;
    localStorage.setItem("token", serverToken);
    setToken(serverToken);

    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    }
  };

  const logoutUser = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken("");
    setUser(null);
  };

  useEffect(() => {
    if (!token) return;

    const fetchUser = async () => {
      try {
        const response = await fetch(USER_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          logoutUser();
          return;
        }

        const data = await response.json();
        const loggedInUser = data?.user || null;
        setUser(loggedInUser);
        localStorage.setItem("user", JSON.stringify(loggedInUser));
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    fetchUser();
  }, [token]);

  const isLoggedIn = Boolean(token);

  const value = useMemo(
    () => ({
      token,
      user,
      isLoggedIn: Boolean(token),
      isBootstrapping: false,
      storeTokenInLS,
      storetokenInLS: storeTokenInLS,
      logoutUser,
      LogoutUser: logoutUser,
    }),
    [token, user]
  );

  return createElement(AuthContext.Provider, { value }, children);
};
