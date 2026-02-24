import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import Notifications from "../components/Notifications";
import "../styles/Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const fetchUnreadCount = async () => {
    if (!token) return;
    try {
      const res = await api.get("notifications/");
      const unread = res.data.filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error fetching notifications", error);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchUnreadCount();

      const ws = new WebSocket(
        `ws://127.0.0.1:8000/ws/notifications/?token=${token}`
      );

      ws.onmessage = () => {
        fetchUnreadCount();
      };

      ws.onclose = () => console.log("WebSocket closed");
      ws.onerror = (e) => console.error("WebSocket error:", e);

      return () => ws.close();
    }
  }, [user, token]);

  return (
    <>
      <nav className="navbar">
        <div className="logo">
          <Link to="/">PMS Pro</Link>
        </div>

        {/* 🔹 Public Navigation Links */}
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
        </div>

        {user && (
          <div className="nav-right">
            {/* 🔔 Notification Bell */}
            <div
              className="bell-container"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              🔔
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </div>

            {/* Burger Menu */}
            <div className="burger" onClick={() => setMenuOpen(!menuOpen)}>
              ☰
            </div>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="notification-dropdown">
                <Notifications showDropdown={true} />
              </div>
            )}
          </div>
        )}

        {!user && (
          <div className="auth-links">
            <Link to="/login">Login</Link>
            <Link to="/register" className="register-btn">
              Register
            </Link>
          </div>
        )}
      </nav>

      {/* Sidebar */}
      {user && (
        <div className={`sidebar ${menuOpen ? "active" : ""}`}>
          <div className="sidebar-content">
            <h4>Core</h4>
            <Link to="/properties" onClick={() => setMenuOpen(false)}>
              Properties
            </Link>
            <Link to="/leases" onClick={() => setMenuOpen(false)}>
              Leases
            </Link>

            {(user.role === "OWNER" || user.role === "ADMIN") && (
              <>
                <h4>Management</h4>
                <Link to="/properties/add" onClick={() => setMenuOpen(false)}>
                  Add Property
                </Link>
                <Link to="/create-lease" onClick={() => setMenuOpen(false)}>
                  Create Lease
                </Link>
              </>
            )}

            <h4>Inspections</h4>
            <Link to="/inspections" onClick={() => setMenuOpen(false)}>
              View Inspections
            </Link>

            {(user.role === "OWNER" || user.role === "ADMIN") && (
              <>
                <Link to="/create-inspection" onClick={() => setMenuOpen(false)}>
                  New Inspection
                </Link>
                <Link to="/damage" onClick={() => setMenuOpen(false)}>
                  Record Damage
                </Link>
                <Link to="/deposit-summary" onClick={() => setMenuOpen(false)}>
                  Deposit Summary
                </Link>
              </>
            )}

            <h4>Maintenance</h4>
            <Link to="/maintenance" onClick={() => setMenuOpen(false)}>
              All Requests
            </Link>

            {(user.role === "OWNER" || user.role === "ADMIN") && (
              <>
                <Link to="/maintenance/new" onClick={() => setMenuOpen(false)}>
                  New Request
                </Link>
                <Link to="/vendors" onClick={() => setMenuOpen(false)}>
                  Vendors
                </Link>
              </>
            )}

            {/* 🔹 New Section */}
            <h4>Company</h4>
            <Link to="/about" onClick={() => setMenuOpen(false)}>
              About PMS Pro
            </Link>
            <Link to="/contact" onClick={() => setMenuOpen(false)}>
              Contact
            </Link>

            <h4>Account</h4>
            <Link
              to={`/${user.role.toLowerCase()}`}
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </Link>

            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar; 