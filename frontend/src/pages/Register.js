import React, { useState } from "react";
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
  const [showPassword, setShowPassword] = useState(false); // toggle password visibility

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("accounts/register/", formData);
      setMessage("✅ Registration successful! You can now login.");
    } catch (error) {
      // Log full backend error to console
      console.log("Backend validation errors:", error.response?.data);

      // Show user-friendly message
      if (error.response?.data) {
        // Combine all error messages from backend
        const errors = Object.entries(error.response.data)
          .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
          .join(" | ");
        setMessage(`❌ Registration failed: ${errors}`);
      } else {
        setMessage("❌ Registration failed. Please try again.");
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

          <select name="role" onChange={handleChange}>
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