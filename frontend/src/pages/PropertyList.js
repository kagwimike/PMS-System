import React, { useEffect, useState } from "react";
import API from "../services/api";
import "../styles/PropertyList.css";

const PropertyList = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProperties = async () => {
    try {
      const res = await API.get("properties/");
      setProperties(res.data);
      console.log("Properties:", res.data);
    } catch (err) {
      console.error("Error fetching properties:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  if (loading) return <p className="loading">Loading properties...</p>;

  return (
    <div className="property-container">
      <h2 className="page-title">My Properties</h2>

      {properties.length === 0 ? (
        <p>No properties found.</p>
      ) : (
        <div className="property-grid">
          {properties.map((property) => (
            <div key={property.id} className="property-card">
              
              {/* Image */}
              <img
                src={
                  property.images?.length
                    ? property.images[0].image
                    : "https://via.placeholder.com/400x250"
                }
                alt={property.name}
                className="property-image"
              />

              {/* Content */}
              <div className="property-content">
                <h3>{property.name}</h3>

                <span className={`status-badge ${property.status.toLowerCase()}`}>
                  {property.status}
                </span>

                <p className="location">
                  {property.city}, {property.country}
                </p>

                <p className="type">{property.property_type}</p>

                <p className="units">
                  Units: {property.total_units}
                </p>

                {property.pricing && (
                  <p className="price">
                    {property.pricing.currency}{" "}
                    {property.pricing.total_price}
                  </p>
                )}

                {/* Amenities */}
                <div className="amenities">
                  {property.amenities?.map((a) => (
                    <span key={a.id} className="amenity-badge">
                      {a.name}
                    </span>
                  ))}
                </div>

                <p className="description">
                  {property.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertyList;