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
      setInspections(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching inspections:", err);
      setError("Failed to load inspections");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  if (loading) return <p>Loading inspections...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="inspections-dashboard">
      <h2>Inspections Dashboard</h2>
      {inspections.length === 0 ? (
        <p>No inspections yet.</p>
      ) : (
        <table className="inspections-table">
          <thead>
            <tr>
              <th>Unit</th>
              <th>Tenant</th>
              <th>Type</th>
              <th>Date</th>
              <th>Condition Score</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {inspections.map((i) => (
              <tr key={i.id}>
                <td>{i.lease.unit.unit_number}</td>
                <td>{i.lease.tenant.name}</td>
                <td>{i.inspection_type}</td>
                <td>{i.date}</td>
                <td>{i.condition_score}</td>
                <td>{i.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default InspectionsDashboard;
