import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import Notifications from "../components/Notifications";
import "../styles/Navbar.css";

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("access_token");

  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const currentRole = user?.role?.toUpperCase() || "";

  useEffect(() => {
    setMenuOpen(false);
    setShowNotifications(false);
  }, [location.pathname]);

  const fetchUnreadCount = async () => {
    if (!token) return;

    try {
      const res = await api.get("notifications/");
      setUnreadCount(
        res.data.filter((notification) => !notification.read).length
      );
    } catch (error) {
      console.error("Notification Error:", error);
    }
  };

  useEffect(() => {
    if (!user || !token) return;

    fetchUnreadCount();

    const ws = new WebSocket(
      `ws://127.0.0.1:8000/ws/notifications/?token=${token}`
    );

    ws.onmessage = () => fetchUnreadCount();

    ws.onerror = (error) =>
      console.error("WebSocket Error:", error);

    return () => ws.close();
  }, [user, token]);

  const closeSidebar = () => {
    setMenuOpen(false);
  };

  const toggleSidebar = () => {
    setShowNotifications(false);
    setMenuOpen((prev) => !prev);
  };

  const toggleNotifications = () => {
    setMenuOpen(false);
    setShowNotifications((prev) => !prev);
  };

  const handleLogout = () => {
    localStorage.clear();

    if (onLogout) {
      onLogout();
    }

    navigate("/");
  };

  return (
    <>
      <nav className="navbar">
        <div className="logo">
          <Link to="/">PMS Pro</Link>
        </div>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
        </div>

        {user ? (
          <div className="nav-right">

            <div
              className="bell-container"
              onClick={toggleNotifications}
            >
              🔔

              {unreadCount > 0 && (
                <span className="notification-badge">
                  {unreadCount}
                </span>
              )}
            </div>

            <div
              className="burger"
              onClick={toggleSidebar}
            >
              ☰
            </div>

            {showNotifications && (
              <div className="notification-dropdown">
                <Notifications showDropdown />
              </div>
            )}
          </div>
        ) : (
          <div className="auth-links">
            <Link to="/login">Login</Link>

            <Link
              to="/register"
              className="register-btn"
            >
              Register
            </Link>
          </div>
        )}
      </nav>

      {user && menuOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
        />
      )}

      {user && (
        <aside
          className={`sidebar ${
            menuOpen ? "active" : ""
          }`}
        >
          <div className="sidebar-content">

            <div className="sidebar-user">
              <div className="avatar">
                {user?.username?.charAt(0)?.toUpperCase()}
              </div>

              <div>
                <h3>{user?.username}</h3>
                <span>{currentRole}</span>
              </div>
            </div>

            <h4>Core</h4>

            <Link
              to="/properties"
              onClick={closeSidebar}
            >
              Properties
            </Link>

            <Link
              to="/leases"
              onClick={closeSidebar}
            >
              Leases
            </Link>

            {(currentRole === "OWNER" ||
              currentRole === "ADMIN") && (
              <>
                <h4>Management</h4>

                <Link
                  to="/properties/add"
                  onClick={closeSidebar}
                >
                  Add Property
                </Link>

                <Link
                  to="/create-lease"
                  onClick={closeSidebar}
                >
                  Create Lease
                </Link>
              </>
            )}

            <h4>Financials</h4>

            {currentRole === "TENANT" ? (
              <>
                <Link
                  to="/tenant/billing"
                  onClick={closeSidebar}
                >
                  My Invoices & Rent
                </Link>

                <Link
                  to="/payment-history"
                  onClick={closeSidebar}
                >
                  Payment History
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/owner/invoices"
                  onClick={closeSidebar}
                >
                  Global Invoices
                </Link>

                <Link
                  to="/payment-history"
                  onClick={closeSidebar}
                >
                  Collected Payments
                </Link>
              </>
            )}

            <h4>Inspections</h4>

            <Link
              to="/inspections"
              onClick={closeSidebar}
            >
              View Inspections
            </Link>

            {(currentRole === "OWNER" ||
              currentRole === "ADMIN") && (
              <>
                <Link
                  to="/create-inspection"
                  onClick={closeSidebar}
                >
                  New Inspection
                </Link>

                <Link
                  to="/damage"
                  onClick={closeSidebar}
                >
                  Record Damage
                </Link>

                <Link
                  to="/deposit-summary"
                  onClick={closeSidebar}
                >
                  Deposit Summary
                </Link>
              </>
            )}

            <h4>Maintenance</h4>

            <Link
              to="/maintenance"
              onClick={closeSidebar}
            >
              All Requests
            </Link>

            {(currentRole === "OWNER" ||
              currentRole === "ADMIN") && (
              <>
                <Link
                  to="/maintenance/new"
                  onClick={closeSidebar}
                >
                  New Request
                </Link>

                <Link
                  to="/vendors"
                  onClick={closeSidebar}
                >
                  Vendors
                </Link>
              </>
            )}

            <h4>Company</h4>

            <Link
              to="/about"
              onClick={closeSidebar}
            >
              About PMS Pro
            </Link>

            <Link
              to="/contact"
              onClick={closeSidebar}
            >
              Contact
            </Link>

            <h4>Account</h4>

            <Link
              to={`/${user?.role?.toLowerCase()}`}
              onClick={closeSidebar}
            >
              Dashboard
            </Link>

            <button
              className="logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>

          </div>
        </aside>
      )}
    </>
  );
};

export default Navbar;