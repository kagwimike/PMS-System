import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/Auth.css";
import { GoogleLogin } from "@react-oauth/google";

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ---------------------------
  // Standard login
  // ---------------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await API.post("accounts/login/", { username, password });
      const { access, refresh, user } = res.data;

      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      localStorage.setItem("user", JSON.stringify(user));

      if (onLoginSuccess) onLoginSuccess();
      redirectByRole(user.role);
    } catch (err) {
      setError("Invalid username or password");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");

    try {
      const res = await API.post("accounts/auth/google/", {
        token: credentialResponse.credential,
      });

      const { access, refresh, user } = res.data;
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      localStorage.setItem("user", JSON.stringify(user));

      if (onLoginSuccess) onLoginSuccess();
      redirectByRole(user.role);
    } catch (err) {
      console.error("Google Auth Backend Verification Error:", err);
      if (err.response && err.response.data) {
        setError(`Backend Error: ${err.response.data.detail || err.response.data.message || "Unauthorized"}`);
      } else {
        setError("Google login failed verification on backend");
      }
    }
  };

  const redirectByRole = (role) => {
    const upperRole = role?.toUpperCase();
    if (upperRole === "ADMIN") navigate("/admin");
    else if (upperRole === "OWNER" || upperRole === "LANDLORD") navigate("/owner");
    else if (upperRole === "TENANT") navigate("/tenant");
    else navigate("/");
  };

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div className="auth-hero-copy">
          <span className="brand-pill">PMS</span>
          <h1>Welcome back</h1>
          <p>Sign in to manage properties, tenants, maintenance requests, and payments from one modern dashboard.</p>
        </div>
      </div>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Sign in to your account</h2>
            <p className="subtitle">Secure access for managers, owners, and tenants.</p>
          </div>

          {error && <div className="message error">{error}</div>}

          <form className="auth-form" onSubmit={handleLogin}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button type="submit" className="primary-btn">Login</button>
          </form>

          <div className="divider">OR</div>

          <div className="google-btn-wrapper">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google login initialization failed")}
            />
          </div>

          <div className="form-footer">
            <span>New here? <Link to="/register">Create an account</Link></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;