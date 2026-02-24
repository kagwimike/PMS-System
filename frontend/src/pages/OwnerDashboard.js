import React, { useEffect, useState } from "react";
import API from "../services/api";
import { Link } from "react-router-dom";
import "../styles/OwnerDashboard.css";

const OwnerDashboard = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await API.get("properties/");
        setProperties(res.data); // backend queryset already filters by owner
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch properties");
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  return (
    <div className="owner-dashboard-container">
      <h2>Your Properties</h2>
      <Link to="/owner/add-property" className="add-property-btn">
        + Add New Property
      </Link>

      {loading && <p>Loading...</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="properties-grid">
        {properties.length === 0 && !loading && <p>No properties found.</p>}
        {properties.map((prop) => (
          <div key={prop.id} className="property-card">
            <h3>{prop.name}</h3>
            <p>Type: {prop.property_type}</p>
            <p>
              Location: {prop.city}, {prop.country}
            </p>
            <p>Total Units: {prop.total_units}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OwnerDashboard;
