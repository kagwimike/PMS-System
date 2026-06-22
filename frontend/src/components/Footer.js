import React from "react";
import { Link } from "react-router-dom";
import "../styles/Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <h3>PMS Pro</h3>
          <p>Effortless property and maintenance management for owners, vendors, and tenants.</p>
          <div className="footer-cta">
            <Link to="/login" className="footer-cta-button">Sign In</Link>
            <Link to="/register" className="footer-cta-ghost">Create account</Link>
          </div>
        </div>

        <div className="footer-links">
          <h4>Product</h4>
          <Link to="/properties">Properties</Link>
          <Link to="/maintenance">Maintenance</Link>
          <Link to="/vendors">Vendors</Link>
        </div>

        <div className="footer-contact">
          <h4>Contact</h4>
          <p>Email: support@pmspro.com</p>
          <p>Phone: +254 700 000 000</p>
          <p>Nairobi, Kenya</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 PMS Pro. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
