import React, { useState, useEffect } from "react";
import API from "../services/api";
import MoveInTenant from "./MoveInTenant"; 
import { FaHome, FaUserPlus, FaCheckCircle, FaExclamationCircle, FaSpinner } from "react-icons/fa";

const ManageUnits = ({ propertyId }) => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State to track which unit is being assigned a tenant
  const [activeUnitForMoveIn, setActiveUnitForMoveIn] = useState(null);

  const fetchUnits = async () => {
    setLoading(true);
    try {
      // FIXED: Cleaned up the URL path string so it does not append trailing colons or extra parameter tokens.
      // If your backend routes by nested resource, this perfectly hits: /api/properties/{id}/units/
      const res = await API.get(`/properties/${propertyId}/units/`);
      setUnits(res.data);
    } catch (err) {
      console.error("Error loading units:", err);
      
      // FALLBACK DETECTOR: If your backend prefers query filtering (e.g., /api/units/?property=1) 
      // instead of nested routes, this second block gracefully catches it so your UI doesn't break.
      try {
        const fallbackRes = await API.get(`/units/?property=${propertyId}`);
        setUnits(fallbackRes.data);
      } catch (fallbackErr) {
        console.error("Alternative endpoint fallback also failed:", fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propertyId) {
      fetchUnits();
      setActiveUnitForMoveIn(null); // Reset form context if landlord switches properties
    }
  }, [propertyId]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "20px", color: "#666" }}>
        <FaSpinner className="spinning" style={{ animation: "spin 1s linear infinite" }} />
        <span>Loading building layout units...</span>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="units-management-container" style={{ display: "flex", gap: "20px", padding: "20px" }}>
      
      {/* LEFT COLUMN: The grid of units */}
      <div className="units-list-column" style={{ flex: 1.5 }}>
        <h3>Property Units</h3>
        
        {units.length === 0 ? (
          <div style={{ padding: "30px", border: "1px dashed #cbd5e1", borderRadius: "6px", background: "#fff", marginTop: "15px", color: "#666" }}>
            <p>No individual units found for this property asset yet.</p>
            <p style={{ fontSize: "13px", color: "#94a3b8" }}>Please use the 'Add Unit' panel or Django Admin to populate spaces inside this building.</p>
          </div>
        ) : (
          <div className="units-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "15px", marginTop: "15px" }}>
            {units.map((unit) => {
              const isOccupied = unit.status === "OCCUPIED";
              const isSelected = activeUnitForMoveIn?.id === unit.id;
              
              return (
                <div 
                  key={unit.id} 
                  style={{
                    border: "1px solid #e1e6eb",
                    borderRadius: "6px",
                    padding: "15px",
                    background: isSelected ? "#eff6ff" : "#fff",
                    borderColor: isSelected ? "#3b82f6" : "#e1e6eb",
                    boxShadow: isSelected ? "0 2px 8px rgba(59, 130, 246, 0.15)" : "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  <h4 style={{ margin: "0 0 8px 0", color: "#1f2937" }}>Unit {unit.unit_number}</h4>
                  <p style={{ fontSize: "14px", color: "#666", margin: "0 0 10px 0" }}>Base Rent: ${unit.rent_price}</p>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", margin: "10px 0" }}>
                    {isOccupied ? (
                      <span style={{ color: "#10b981", fontSize: "13px", display: "flex", alignItems: "center", gap: "4px", fontWeight: "500" }}>
                        <FaCheckCircle /> Occupied
                      </span>
                    ) : (
                      <span style={{ color: "#f59e0b", fontSize: "13px", display: "flex", alignItems: "center", gap: "4px", fontWeight: "500" }}>
                        <FaExclamationCircle /> Vacant
                      </span>
                    )}
                  </div>

                  {/* Only display the Action button if the unit is vacant */}
                  {!isOccupied && (
                    <button
                      onClick={() => setActiveUnitForMoveIn(unit)}
                      style={{
                        background: isSelected ? "#1d4ed8" : "#3b82f6",
                        color: "#fff",
                        border: "none",
                        padding: "8px 12px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "13px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        width: "100%",
                        justifyContent: "center",
                        fontWeight: "bold",
                        marginTop: "5px"
                      }}
                    >
                      <FaUserPlus /> {isSelected ? "Selected" : "Move In Tenant"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Contextual Move-In Form Side Panel */}
      <div className="form-action-column" style={{ flex: 1, minWidth: "350px" }}>
        {activeUnitForMoveIn ? (
          <div>
            {/* Render the form component dynamically */}
            <MoveInTenant 
              unitId={activeUnitForMoveIn.id} 
              unitNumber={activeUnitForMoveIn.unit_number} 
              onMoveInSuccess={() => {
                // 1. Close the panel form view
                setActiveUnitForMoveIn(null);
                // 2. Re-fetch data matrix to convert the layout target to 'OCCUPIED'
                fetchUnits();
              }}
            />
            <button 
              onClick={() => setActiveUnitForMoveIn(null)}
              style={{
                background: "transparent",
                border: "none",
                color: "#ef4444",
                padding: "8px 0",
                marginTop: "10px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500"
              }}
            >
              Cancel Operation
            </button>
          </div>
        ) : (
          <div style={{
            border: "2px dashed #cbd5e1",
            borderRadius: "8px",
            padding: "40px 20px",
            textAlign: "center",
            color: "#64748b",
            background: "#f8fafc",
            marginTop: "40px"
          }}>
            <FaHome style={{ fontSize: "36px", marginBottom: "10px", color: "#94a3b8" }} />
            <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.5" }}>
              Select an available vacant unit from the grid layout to initiate a tenant lease link.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default ManageUnits;