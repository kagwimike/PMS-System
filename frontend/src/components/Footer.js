import React from "react";
import { Link } from "react-router-dom";
import "../styles/Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <h3>PMS Pro</h3>
          <p>Effortless Property Management for Everyone.</p>
        </div>

        <div className="footer-links">
          <h4>Quick Links</h4>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/properties">Properties</Link>
          <Link to="/contact">Contact</Link>
        </div>

        <div className="footer-contact">
          <h4>Contact Us</h4>
          <p>Email: support@pmspro.com</p>
          <p>Phone: +254 700 000 000</p>
          <p>Address: Nairobi, Kenya</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 PMS Pro. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
