import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth-context.js";

export const Logout = () => {
  const { logoutUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    logoutUser();
    navigate("/login", {
      replace: true,
      state: {
        flashMessage: "Logged out successfully.",
        flashTone: "success",
      },
    });
  }, [logoutUser, navigate]);

  return null;
};
