// src/pages/InspectionForm.js
import React, { useState, useEffect } from "react";
import API from "../services/api";
import "../styles/InspectionForm.css";

const InspectionForm = () => {
  const [leases, setLeases] = useState([]);
  const [selectedLease, setSelectedLease] = useState("");
  const [inspectionType, setInspectionType] = useState("CHECKIN");
  const [notes, setNotes] = useState("");
  const [conditionScore, setConditionScore] = useState(100);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLeases = async () => {
      try {
        const res = await API.get("leases/");
        setLeases(res.data);
      } catch (err) {
        console.error("Error fetching leases:", err);
      }
    };
    fetchLeases();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLease) {
      setError("Please select a lease");
      return;
    }

    try {
      await API.post("inspections/", {
        lease: selectedLease,
        inspection_type: inspectionType,
        notes,
        condition_score: conditionScore,
      });
      setSuccess("Inspection created successfully!");
      setError("");
      setSelectedLease("");
      setNotes("");
      setConditionScore(100);
    } catch (err) {
      console.error("Error creating inspection:", err);
      setError(err.response?.data?.detail || "Failed to create inspection");
      setSuccess("");
    }
  };

  return (
    <div className="inspection-form-container">
      <h2>Create Inspection</h2>

      {success && <p className="success-message">{success}</p>}
      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit} className="inspection-form">
        <select
          value={selectedLease}
          onChange={(e) => setSelectedLease(e.target.value)}
          required
        >
          <option value="">Select Lease</option>
          {leases.map((l) => (
            <option key={l.id} value={l.id}>
              {l.unit.unit_number} - {l.tenant.name}
            </option>
          ))}
        </select>

        <select
          value={inspectionType}
          onChange={(e) => setInspectionType(e.target.value)}
        >
          <option value="CHECKIN">Check-in</option>
          <option value="CHECKOUT">Check-out</option>
        </select>

        <input
          type="number"
          placeholder="Condition Score (0-100)"
          value={conditionScore}
          onChange={(e) => setConditionScore(e.target.value)}
          min={0}
          max={100}
          required
        />

        <textarea
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <button type="submit">Create Inspection</button>
      </form>
    </div>
  );
};

export default InspectionForm;
