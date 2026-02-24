import React from "react";
import "../styles/About.css";

const About = () => {
  return (
    <section className="about-section">
      <div className="about-container">
        <div className="about-text">
          <h2>About PMS Pro</h2>
          <p>
            PMS Pro is a comprehensive property management system designed for
            property owners, tenants, and managers. Track properties, leases,
            inspections, and maintenance requests—all in one place.
          </p>
          <p>
            With real-time notifications, easy reporting, and intuitive
            dashboards, PMS Pro simplifies property management so you can focus
            on what matters most: running your properties efficiently.
          </p>
        </div>
        <div className="about-image">
          {/* <img
            src="/images/about-illustration.png"
            alt="Property Management Illustration"
          /> */}
        </div>
      </div>
    </section>
  );
};

export default About; 