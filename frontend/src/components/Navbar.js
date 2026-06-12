import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import Notifications from "../components/Notifications";
import "../styles/Navbar.css";

// ✅ FIX 1: Accept user context state directly as props from App.js
const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Auto-close navigation overlays when changing views
  useEffect(() => {
    setMenuOpen(false);
    setShowNotifications(false);
  }, [location.pathname]);

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

  const handleLogoutAction = () => {
    localStorage.clear();
    if (onLogout) onLogout(); // Clear App.js parent state layer instantly
    navigate("/");
  };

  // Safe normalized assessment string extraction
  const currentRole = user?.role ? user.role.toUpperCase() : "";

  return (
    <>
      <nav className="navbar">
        <div className="logo">
          <Link to="/">PMS Pro</Link>
        </div>

        {/* Public Navigation Links */}
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
        </div>

        {user && (
          <div className="nav-right">
            {/* Notification Bell */}
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

      {/* Sidebar Overlay Ledger Layout */}
      {user && (
        <div className={`sidebar ${menuOpen ? "active" : ""}`}>
          <div className="sidebar-content">
            <h4>Core</h4>
            <Link to="/properties">Properties</Link>
            <Link to="/leases">Leases</Link>

            {(currentRole === "OWNER" || currentRole === "ADMIN") && (
              <>
                <h4>Management</h4>
                <Link to="/properties/add">Add Property</Link>
                <Link to="/create-lease">Create Lease</Link>
              </>
            )}

{/* 💳 FINANCIALS ENGINE INTERACTIVE LINKS */}
<h4>Financials</h4>
{(() => {
  const currentRole = user?.role ? user.role.toUpperCase() : "";

  if (currentRole === "TENANT") {
    return (
      <>
        <Link to="/tenant/billing">My Invoices & Rent</Link>
        <Link to="/payment-history">Payment History</Link>
      </>
    );
  } else if (currentRole === "OWNER" || currentRole === "ADMIN") {
    return (
      <>
        <Link to="/owner/invoices">Global Invoices</Link>
        <Link to="/payment-history">Collected Payments</Link>
      </>
    );
  } else {
    // 🔓 FALLBACK: Force visibility for testing when role isn't matching perfectly
    return (
      <>
        <Link to="/tenant/billing" style={{ color: "#2563eb", fontWeight: "600" }}>
          👉 Open Test Billing (Tenant View)
        </Link>
        <span style={{ color: "#64748b", fontSize: "10px", display: "block", paddingLeft: "10px" }}>
          Session Key Data: {JSON.stringify(user)}
        </span>
      </>
    );
  }
})()}

            <h4>Inspections</h4>
            <Link to="/inspections">View Inspections</Link>

            {(currentRole === "OWNER" || currentRole === "ADMIN") && (
              <>
                <Link to="/create-inspection">New Inspection</Link>
                <Link to="/damage">Record Damage</Link>
                <Link to="/deposit-summary">Deposit Summary</Link>
              </>
            )}

            <h4>Maintenance</h4>
            <Link to="/maintenance">All Requests</Link>

            {(currentRole === "OWNER" || currentRole === "ADMIN") && (
              <>
                <Link to="/maintenance/new">New Request</Link>
                <Link to="/vendors">Vendors</Link>
              </>
            )}

            <h4>Company</h4>
            <Link to="/about">About PMS Pro</Link>
            <Link to="/contact">Contact</Link>

            <h4>Account</h4>
            <Link to={`/${user?.role?.toLowerCase() || ""}`}>
              Dashboard
            </Link>

            <button className="logout-btn" onClick={handleLogoutAction}>
              Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;