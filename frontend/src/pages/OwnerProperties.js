import React, { useEffect, useState } from "react";
import API from "../services/api";

const OwnerProperties = () => {
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await API.get("properties/");
      setProperties(res.data);
    } catch (error) {
      console.error("Error fetching properties", error);
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>My Properties</h2>

      {properties.length === 0 && <p>No properties yet.</p>}

      <div style={{ display: "grid", gap: "20px" }}>
        {properties.map((property) => (
          <div
            key={property.id}
            style={{
              border: "1px solid #ddd",
              padding: "20px",
              borderRadius: "8px",
            }}
          >
            <h3>{property.name}</h3>
            <p>Type: {property.property_type}</p>
            <p>Status: {property.status}</p>
            <p>City: {property.city}</p>

            {property.pricing && (
              <p>Base Price: {property.pricing.base_price}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OwnerProperties;
