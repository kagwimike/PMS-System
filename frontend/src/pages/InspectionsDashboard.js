// src/pages/InspectionsDashboard.js
import React, { useState, useEffect } from "react";
import API from "../services/api";
import "../styles/InspectionsDashboard.css";

const InspectionsDashboard = () => {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInspections = async () => {
    try {
      const res = await API.get("inspections/");
      
      // Safe array formatting for DRF paginated wrappers
      if (Array.isArray(res.data)) {
        setInspections(res.data);
      } else if (res.data && Array.isArray(res.data.results)) {
        setInspections(res.data.results);
      } else {
        setInspections([]);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching inspections:", err);
      setError("Failed to load inspections data log.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  if (loading) return <p className="loading">Loading inspections record tree...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="inspections-dashboard" style={{ padding: "20px" }}>
      <h2>Inspections Dashboard</h2>
      {inspections.length === 0 ? (
        <p style={{ color: "#64748b", fontStyle: "italic" }}>No inspections recorded yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="inspections-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", background: "#f8fafc" }}>
                <th style={{ padding: "12px 8px" }}>Unit</th>
                <th style={{ padding: "12px 8px" }}>Tenant</th>
                <th style={{ padding: "12px 8px" }}>Type</th>
                <th style={{ padding: "12px 8px" }}>Date</th>
                <th style={{ padding: "12px 8px" }}>Condition Score</th>
                <th style={{ padding: "12px 8px" }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {inspections.map((i) => (
                <tr key={i.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  {/* Optional chaining safely prevents crashes if a lease row gets orphaned */}
                  <td style={{ padding: "12px 8px", fontWeight: "600" }}>
                    Unit {i.lease?.unit?.unit_number || "N/A"}
                  </td>
                  <td style={{ padding: "12px 8px" }}>
                    {i.lease?.tenant?.first_name || ""} {i.lease?.tenant?.last_name || "Unknown Tenant"}
                  </td>
                  <td style={{ padding: "12px 8px" }}>
                    <span style={{
                      padding: "3px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold",
                      background: i.inspection_type === "CHECKIN" ? "#dcfce7" : "#fee2e2",
                      color: i.inspection_type === "CHECKIN" ? "#166534" : "#991b1b"
                    }}>
                      {i.inspection_type}
                    </span>
                  </td>
                  <td style={{ padding: "12px 8px" }}>
                    {i.date ? new Date(i.date).toLocaleDateString() : "N/A"}
                  </td>
                  <td style={{ padding: "12px 8px", fontWeight: "600" }}>
                    {i.condition_score}/100
                  </td>
                  <td style={{ padding: "12px 8px", color: "#475569", fontSize: "13px" }}>
                    {i.notes || <span style={{ fontStyle: "italic", color: "#94a3b8" }}>No structural notes</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InspectionsDashboard;