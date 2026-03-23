import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiUrl } from "../utils/api.js";

const URL = apiUrl("/api/auth/register");

export const Register = () => {
  const [user, setUser] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
  });
  const [formError, setFormError] = useState("");
  const navigate = useNavigate();

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
        alert(res_data.message || "Registration successful!");
        setUser({ username: "", email: "", phone: "", password: "" });
        navigate("/login");
      } else {
        setFormError(res_data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Register error:", error);
      setFormError("Unable to connect. Make sure backend is running on port 5000.");
    }
  };

  return (
    <div className="form-page">
      <div className="form-box">
        <h2>Create Account</h2>
        <p className="subtitle">Join StayFinder today</p>
        
        {formError && <div className="error-msg">{formError}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={user.username}
              onChange={handleInput}
              placeholder="Enter username"
              required
            />
          </div>
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
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={user.phone}
              onChange={handleInput}
              placeholder="Enter phone"
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
              placeholder="Create password"
              required
            />
          </div>
          <button type="submit" className="btn-submit">Register</button>
        </form>
        
        <div className="form-footer">
          Already have account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
};
