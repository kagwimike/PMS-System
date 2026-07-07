// src/pages/DamageForm.js
import React, { useState, useEffect } from "react";
import API from "../services/api";
import "../styles/DamageForm.css";

const DamageForm = () => {
  const [inspections, setInspections] = useState([]);
  const [selectedInspection, setSelectedInspection] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [chargeTarget, setChargeTarget] = useState("TENANT_DEPOSIT");
  const [photo, setPhoto] = useState(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInspections = async () => {
      try {
        const res = await API.get("inspections/");
        if (Array.isArray(res.data)) {
          setInspections(res.data);
        } else if (res.data && Array.isArray(res.data.results)) {
          setInspections(res.data.results);
        } else {
          setInspections([]);
        }
      } catch (err) {
        console.error("Error loading inspection records:", err);
        setError("Could not sync inspection records.");
      }
    };
    fetchInspections();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInspection) {
      setError("Select an inspection first");
      return;
    }

    const formData = new FormData();
    formData.append("inspection", parseInt(selectedInspection, 10));
    formData.append("description", description);
    formData.append("cost", parseFloat(cost));
    formData.append("charge_target", chargeTarget);
    
    if (photo) {
      formData.append("photo", photo);
    }

    try {
      await API.post("damages/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess("Damage record successfully saved!");
      setError("");
      setDescription("");
      setCost("");
      setChargeTarget("TENANT_DEPOSIT");
      setPhoto(null);
      setSelectedInspection("");
    } catch (err) {
      console.error("Error logging damage:", err);
      
      if (err.response && err.response.data) {
        const serverErrors = err.response.data;
        if (typeof serverErrors === "object") {
          const errorLines = Object.entries(serverErrors).map(
            ([field, messages]) => `${field.toUpperCase()}: ${Array.isArray(messages) ? messages.join(" ") : messages}`
          );
          setError(`Validation Failed -> ${errorLines.join(" | ")}`);
        } else {
          setError(err.response.data.detail || "Database rejected form formatting.");
        }
      } else {
        setError("Failed to create damage record due to payload formatting.");
      }
      setSuccess("");
    }
  };

  return (
    <div className="damage-form-container" style={{ padding: "30px", maxWidth: "600px", margin: "0 auto" }}>
      <h2>Record Damage Entry</h2>
      {success && <p className="success-message" style={{ padding: "12px", background: "#dcfce7", color: "#166534", borderRadius: "6px" }}>{success}</p>}
      {error && <p className="error-message" style={{ padding: "12px", background: "#fee2e2", color: "#991b1b", borderRadius: "6px", fontWeight: "600" }}>{error}</p>}

      <form onSubmit={handleSubmit} className="damage-form" style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <label style={{ fontSize: "14px", fontWeight: "600" }}>Link to Completed Inspection Audit:</label>
          <select
            value={selectedInspection}
            onChange={(e) => setSelectedInspection(e.target.value)}
            required
            style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
          >
            <option value="">-- Choose Inspection Log Reference --</option>
            {inspections.map((i) => (
              <option key={i.id} value={i.id}>
                Unit {i.unit_number || "N/A"} - {i.inspection_type_display} ({i.date ? new Date(i.date).toLocaleDateString() : "No Date"})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <label style={{ fontSize: "14px", fontWeight: "600" }}>Damage Description:</label>
          <input
            type="text"
            placeholder="e.g., Cracked kitchen granite tile, broken smart lock casing"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
          >
          </input>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <label style={{ fontSize: "14px", fontWeight: "600" }}>Financial Allocation Target:</label>
          <select
            value={chargeTarget}
            onChange={(e) => setChargeTarget(e.target.value)}
            required
            style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
          >
            <option value="TENANT_DEPOSIT">Deduct from Security Deposit</option>
            <option value="DIRECT_BILL">Invoice Tenant Directly</option>
            <option value="LANDLORD_ACC">Landlord Expense (Wear & Tear)</option>
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <label style={{ fontSize: "14px", fontWeight: "600" }}>Estimated Repair Cost (KES):</label>
          <input
            type="number"
            placeholder="Amount"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            required
            style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <label style={{ fontSize: "14px", fontWeight: "600" }}>Upload Photographic Evidence:</label>
          <input
            type="file"
            onChange={(e) => setPhoto(e.target.files[0])}
            accept="image/*"
            style={{ padding: "5px" }}
          />
        </div>

        <button type="submit" style={{ padding: "12px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", fontSize: "16px", fontWeight: "600", cursor: "pointer", marginTop: "10px" }}>
          Log Damage Record
        </button>
      </form>
    </div>
  );
};

export default DamageForm;