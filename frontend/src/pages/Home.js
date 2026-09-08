import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";
import dashboardMockup from "../assets/dashboard_mockup.jpg"; // Generated mock dashboard image

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-wrapper">
      
      {/* Pangoni-style Landing Navbar */}
      <nav className="landing-navbar">
        <a href="/" className="landing-nav-logo">PMS Pro</a>
        <div className="landing-nav-links">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#blog">Blog</a>
          <a href="#contact">Contact</a>
        </div>
      </nav>

      {/* HERO SECTION (SPLIT LAYOUT) */}
      <section className="hero-split" id="home">
        <div className="hero-left">
          <h1>
            The modern standard for <span className="highlight">Property Management</span>
          </h1>
          <p>
            Connect owners, managers, and tenants in one seamless, financial-first ecosystem. Manage leases, collect rent automatically via M-Pesa, and streamline maintenance requests.
          </p>
          <div className="hero-buttons">
            <button className="primary-cta" onClick={() => navigate("/register")}>
              Create a Workspace
            </button>
            <button className="primary-cta" style={{ background: '#f1f5f9', color: '#0f172a', boxShadow: 'none' }} onClick={() => navigate("/login")}>
              Tenant Portal
            </button>
          </div>
        </div>
        
        <div className="hero-right">
          <img src={dashboardMockup} alt="PMS Pro Dashboard Interface" className="dashboard-mockup" />
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="features" id="features">
        <h2>Everything you need to scale</h2>

        <div className="feature-grid">
          <div className="feature-item">
            <h4>📱 Native M-Pesa Integration</h4>
            <p>
              Automated STK pushes and C2B callbacks. Rent payments are reconciled against invoices instantly without manual ledger entries.
            </p>
          </div>

          <div className="feature-item">
            <h4>📄 Bulletproof Leases</h4>
            <p>
              Strict domain enforcement: a unit cannot have two active leases. Automated unit status transitions from Vacant to Occupied.
            </p>
          </div>

          <div className="feature-item">
            <h4>💰 Immutable Financials</h4>
            <p>
              Payments are never deleted. Full audit trails for deposits, partial payments, and arrears aging.
            </p>
          </div>

          <div className="feature-item">
            <h4>🛠 Vendor Routing</h4>
            <p>
              Tenants report issues; managers assign vendors. Status is tracked transparently until the tenant verifies the fix.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
