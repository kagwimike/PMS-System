import React from "react";
import { Link } from "react-router-dom";
import "../styles/Footer.css";

const PRODUCT_LINKS = [
  { to: "/properties", label: "Properties" },
  { to: "/maintenance", label: "Maintenance" },
  { to: "/vendors", label: "Vendors" },
];

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-grid">
        {/* Brand Section */}
        <div className="footer-section brand">
          <h3>PMS Pro</h3>
          <p>Effortless property and maintenance management for owners, vendors, and tenants.</p>
          <div className="footer-actions">
            <Link to="/login" className="btn btn-primary">Sign In</Link>
            <Link to="/register" className="btn btn-ghost">Create account</Link>
          </div>
        </div>

        {/* Links Section */}
        <div className="footer-section">
          <h4>Product</h4>
          <nav className="footer-nav">
            {PRODUCT_LINKS.map(({ to, label }) => (
              <Link key={to} to={to}>{label}</Link>
            ))}
          </nav>
        </div>

        {/* Contact Section */}
        <div className="footer-section">
          <h4>Contact</h4>
          <address className="footer-contact">
            <a href="mailto:support@pmspro.com">support@pmspro.com</a>
            <a href="tel:+254700000000">+254 700 000 000</a>
            <span>Nairobi, Kenya</span>
          </address>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} PMS Pro. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;