import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./auth-context.js";
import { API } from "../utils/api.js";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const syncUserInLS = useCallback((userData) => {
    if (!userData) {
      localStorage.removeItem("user");
      setUser(null);
      return;
    }

    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }, []);

  const storeTokenInLS = useCallback((serverToken, userData = null) => {
    if (!serverToken) return;
    localStorage.setItem("token", serverToken);
    setToken(serverToken);

    if (userData) {
      syncUserInLS(userData);
    }
  }, [syncUserInLS]);

  const logoutUser = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken("");
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchUser = async () => {
      try {
        const { data } = await API.get("/auth/user");
        const loggedInUser = data?.user || null;
        syncUserInLS(loggedInUser);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        logoutUser();
      }
    };

    fetchUser();
  }, [logoutUser, syncUserInLS, token]);

  const isLoggedIn = Boolean(token);

  const value = useMemo(
    () => ({
      token,
      user,
      isLoggedIn,
      isBootstrapping: false,
      storeTokenInLS,
      syncUserInLS,
      logoutUser,
    }),
    [token, user, isLoggedIn, logoutUser, storeTokenInLS, syncUserInLS]
  );

  return createElement(AuthContext.Provider, { value }, children);
};
