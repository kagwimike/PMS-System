import React, { useState } from "react";
import API from "../services/api";
import "../styles/Auth.css";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

const Login = () => {
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
    try {
      const res = await API.post("accounts/login/", { username, password });
      const { access, refresh, user } = res.data;

      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      localStorage.setItem("user", JSON.stringify(user));

      redirectByRole(user.role);
    } catch (err) {
      setError("Invalid username or password");
    }
  };

  // ---------------------------
  // Google OAuth2 login
  // ---------------------------
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await API.post("accounts/login/google/", {
        access_token: credentialResponse.credential,
      });

      const { access, refresh, user } = res.data;

      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      localStorage.setItem("user", JSON.stringify(user));

      redirectByRole(user.role);
    } catch (err) {
      setError("Google login failed");
    }
  };

  const redirectByRole = (role) => {
    const upperRole = role.toUpperCase();
    if (upperRole === "ADMIN") navigate("/admin");
    else if (upperRole === "OWNER") navigate("/owner");
    else if (upperRole === "TENANT") navigate("/tenant");
    else navigate("/");
  };

  return (
    <div className="auth-container">
      <h2>PMS Login</h2>
      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        {/* Password with toggle */}
        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Hide" : "Show"}
          </span>
        </div>

        <button type="submit">Login</button>
      </form>

      <div className="divider">OR</div>

      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={() => setError("Google login failed")}
      />
    </div>
  );
};

export default Login;