import React from "react";
import "../styles/Home.css";

const Home = () => {
  return (
    <div className="home-wrapper">
      
      {/* HERO SECTION */}
      <section className="hero">
        <h1>
          Welcome to <span className="highlight">PMS Pro</span>
        </h1>

        <p className="hero-subtext">
          The smarter way to manage apartments, hotels, and Airbnbs.
          Automate bookings, leases, payments, and maintenance —
          all from one powerful platform.
        </p>

        <div className="hero-buttons">
          <a href="/register" className="primary-btn">
            Get Started
          </a>
          <a href="/login" className="secondary-btn">
            Login
          </a>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="features">
        <h2>Main Features</h2>

        <div className="feature-grid">

          <div className="feature-card">
            <h3>🏢 Property Management</h3>
            <p>
              List apartments, hotels, and Airbnbs with full unit control
              and real-time availability tracking.
            </p>
          </div>

          <div className="feature-card">
            <h3>📅 Smart Bookings</h3>
            <p>
              Automated reservations with real-time availability
              and double-booking prevention.
            </p>
          </div>

          <div className="feature-card">
            <h3>💳 Payments & Escrow</h3>
            <p>
              Secure rent collection, deposits, refunds,
              and split payouts for owners.
            </p>
          </div>

          <div className="feature-card">
            <h3>🛠 Maintenance Tracking</h3>
            <p>
              Tenants submit repair requests with photos.
              Owners assign vendors and track work orders.
            </p>
          </div>

          <div className="feature-card">
            <h3>📄 Lease Management</h3>
            <p>
              Draft digital leases, track renewals,
              and automate rent reminders.
            </p>
          </div>

          <div className="feature-card">
            <h3>📊 Financial Insights</h3>
            <p>
              Track expenses, calculate NOI,
              and generate financial reports.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
};

export default Home;
