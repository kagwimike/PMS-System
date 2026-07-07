import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/Auth.css";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "GUEST",
    phone: "",
  });

  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await API.post("accounts/register/", formData);
      setMessage("✅ Registration successful! You can now login.");
      setFormData({ username: "", email: "", password: "", role: "GUEST", phone: "" });
      setShowPassword(false);
    } catch (error) {
      if (error.response) {
        console.error("Backend validation errors:", error.response.data);
        if (typeof error.response.data === "object") {
          const errors = Object.entries(error.response.data)
            .map(([field, msgs]) => {
              const messageText = Array.isArray(msgs) ? msgs.join(", ") : msgs;
              return `${field}: ${messageText}`;
            })
            .join(" | ");
          setMessage(`❌ Registration failed: ${errors}`);
        } else {
          setMessage(`❌ Registration failed: ${error.response.statusText}`);
        }
      } else if (error.request) {
        console.error("Network Error Details:", error.request);
        setMessage(
          "❌ Network error: Please verify your backend is available and your CORS settings are correct."
        );
      } else {
        console.error("Error setting up request:", error.message);
        setMessage(`❌ Error: ${error.message}`);
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>
        {message && <p className="message">{message}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="phone"
            placeholder="Phone"
            onChange={handleChange}
          />

          <select name="role" onChange={handleChange} value={formData.role}>
            <option value="GUEST">Guest</option>
            <option value="TENANT">Tenant</option>
            <option value="OWNER">Owner</option>
          </select>

          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              onChange={handleChange}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button type="submit">Register</button>
        </form>
      </div>
    </div>
  );
};

export default Register;