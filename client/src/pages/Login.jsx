import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth-context.js";
import { apiUrl } from "../utils/api.js";

const URL = apiUrl("/api/auth/login");

export const Login = () => {
  const [user, setUser] = useState({
    email: "",
    password: "",
  });
  const [formError, setFormError] = useState("");
  const navigate = useNavigate();
  const { storeTokenInLS } = useAuth();

  const handleInput = (e) => {
    let name = e.target.name;
    let value = e.target.value;
    setUser({ ...user, [name]: value });
    if (formError) setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      const res_data = await response.json();
      if (response.ok) {
        alert(res_data.message || "Login successful!");
        storeTokenInLS(res_data.token);
        setUser({ email: "", password: "" });
        navigate("/");
      } else {
        setFormError(res_data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setFormError("Login failed. Please try again.");
    }
  };

  return (
    <div className="form-page">
      <div className="form-box">
        <h2>Welcome Back</h2>
        <p className="subtitle">Login to your account</p>
        
        {formError && <div className="error-msg">{formError}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={user.email}
              onChange={handleInput}
              placeholder="Enter email"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={user.password}
              onChange={handleInput}
              placeholder="Enter password"
              required
            />
          </div>
          <button type="submit" className="btn-submit">Login</button>
        </form>
        
        <div className="form-footer">
          Don't have account? <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
};
