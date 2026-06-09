// src/pages/InspectionForm.js
import React, { useState, useEffect } from "react";
import API from "../services/api";
import "../styles/InspectionForm.css";

const InspectionForm = () => {
  const [leases, setLeases] = useState([]);
  const [selectedLease, setSelectedLease] = useState("");
  const [inspectionType, setInspectionType] = useState("CHECKIN");
  const [sendTenantNotification, setSendTenantNotification] = useState(true); // Notification Toggle
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Modern Housing Feature Checklist State
  const [checklist, setChecklist] = useState({
    smart_locks_and_intercom: "GOOD",
    hvac_and_thermostat: "GOOD",
    kitchen_appliances: "GOOD",
    plumbing_and_water_pressure: "GOOD",
    electrical_outlets_and_lighting: "GOOD",
    walls_flooring_and_paint: "GOOD",
    windows_and_blinds: "GOOD",
    smoke_detectors_and_safety: "GOOD",
  });

  useEffect(() => {
    const fetchLeases = async () => {
      try {
        const res = await API.get("leases/");
        if (Array.isArray(res.data)) {
          setLeases(res.data);
        } else if (res.data && Array.isArray(res.data.results)) {
          setLeases(res.data.results);
        } else {
          setLeases([]);
        }
      } catch (err) {
        console.error("Error fetching leases:", err);
        setError("Could not sync active lease profiles.");
      }
    };
    fetchLeases();
  }, []);

  const calculateConditionScore = () => {
    const items = Object.values(checklist);
    const goodCount = items.filter((status) => status === "GOOD").length;
    const fairCount = items.filter((status) => status === "FAIR").length;
    const totalScore = ((goodCount * 100) + (fairCount * 50)) / items.length;
    return Math.round(totalScore);
  };

  const handleChecklistChange = (item, value) => {
    setChecklist((prev) => ({ ...prev, [item]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLease) {
      setError("Please select a lease");
      return;
    }

    // 1. AUTOMATIC USER DETECTION: Pull current user info from session storage
    const userString = localStorage.getItem("user"); 
    let authenticatedInspector = "Logged-In Landlord";
    
    if (userString) {
      try {
        const userData = JSON.parse(userString);
        // Fallback checks depending on if your auth system uses 'name', 'username', or 'first_name'
        authenticatedInspector = userData.name || userData.username || `${userData.first_name} ${userData.last_name}` || "Property Manager";
      } catch (e) {
        console.error("Failed to parse user profile from cache:", e);
      }
    }

    const score = calculateConditionScore();
    const dynamicNotes = `Score: ${score}%. Smart Lock: ${checklist.smart_locks_and_intercom}. HVAC: ${checklist.hvac_and_thermostat}. Plumbing: ${checklist.plumbing_and_water_pressure}. Finishes: ${checklist.walls_flooring_and_paint}. Comments: ${notes}`;

    const leaseIdInt = parseInt(selectedLease, 10);
    const activeLeaseObj = leases.find(l => l.id === leaseIdInt);

    const payload = {
      lease: leaseIdInt, 
      inspection_type: inspectionType,
      inspector_name: authenticatedInspector, // Automatically bound behind the scenes
      notes: dynamicNotes.substring(0, 254), 
      condition_score: score,
      date: new Date().toISOString().split("T")[0],
      trigger_tenant_notification: sendTenantNotification, // Sends boolean flag to your Django signal pipeline
    };

    if (activeLeaseObj?.unit?.id) payload.unit = activeLeaseObj.unit.id;
    if (activeLeaseObj?.unit?.property?.id) payload.property = activeLeaseObj.unit.property.id;

    try {
      await API.post("inspections/", payload);

      setSuccess(`Inspection logged successfully by ${authenticatedInspector}! Score: ${score}% ${sendTenantNotification ? "(Tenant Notified)" : ""}`);
      setError("");
      setSelectedLease("");
      setNotes("");
    } catch (err) {
      console.error("Error creating inspection:", err);
      if (err.response && err.response.data) {
        const serverData = err.response.data;
        if (typeof serverData === "object") {
          const errorLines = Object.entries(serverData).map(
            ([field, messages]) => `${field.toUpperCase()}: ${Array.isArray(messages) ? messages.join(" ") : messages}`
          );
          setError(`Validation Failed -> ${errorLines.join(" | ")}`);
        } else {
          setError(err.response.data.detail || "Database rejected form fields.");
        }
      } else {
        setError("Failed to compile payload variables safely.");
      }
      setSuccess("");
    }
  };

  const checklistLabels = {
    smart_locks_and_intercom: "Smart Locks & Intercom System",
    hvac_and_thermostat: "HVAC, AC Filters & Smart Thermostat",
    kitchen_appliances: "Kitchen Appliances (Oven, Range, Fridge)",
    plumbing_and_water_pressure: "Plumbing, Drains & Water Pressure",
    electrical_outlets_and_lighting: "Electrical Outlets, USB Ports & Fixtures",
    walls_flooring_and_paint: "Structural Finishes (Walls & Floors)",
    windows_and_blinds: "Windows, Seals & Blinds",
    smoke_detectors_and_safety: "Smoke Detectors & Safety Systems",
  };

  return (
    <div className="inspection-form-container" style={{ padding: "30px", maxWidth: "700px", margin: "0 auto" }}>
      <h2>Create Modern Property Inspection</h2>
      <p style={{ color: "#64748b", marginTop: "-10px", marginBottom: "25px" }}>
        Owner Walkthrough Hub — Automatically attributes records to your manager session.
      </p>

      {success && <p className="success-message" style={{ padding: "12px", background: "#dcfce7", color: "#166534", borderRadius: "6px" }}>{success}</p>}
      {error && <p className="error-message" style={{ padding: "12px", background: "#fee2e2", color: "#991b1b", borderRadius: "6px", fontWeight: "600" }}>{error}</p>}

      <form onSubmit={handleSubmit} className="inspection-form" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Core Metadata Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600" }}>Select Active Lease Context:</label>
            <select value={selectedLease} onChange={(e) => setSelectedLease(e.target.value)} required style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
              <option value="">-- Choose Tenant / Unit --</option>
              {leases.map((l) => (
                <option key={l.id} value={l.id}>
                  Unit {l.unit?.unit_number} - {l.tenant?.first_name} {l.tenant?.last_name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600" }}>Inspection Schedule Phase:</label>
            <select value={inspectionType} onChange={(e) => setInspectionType(e.target.value)} style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
              <option value="CHECKIN">Move-In (Check-In Audit)</option>
              <option value="CHECKOUT">Move-Out (Check-Out Assessment)</option>
            </select>
          </div>
        </div>

        {/* --- DYNAMIC NOTIFICATION DISPATCH SWITCH --- */}
        <div style={{ padding: "12px 15px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <label style={{ fontSize: "14px", fontWeight: "600", display: "block", color: "#1e293b" }}>Dispatch Tenant Report Notification</label>
            <span style={{ fontSize: "12px", color: "#64748b" }}>Automate systemic email alerts containing score metrics directly to tenant upon submission.</span>
          </div>
          <input
            type="checkbox"
            checked={sendTenantNotification}
            onChange={(e) => setSendTenantNotification(e.target.checked)}
            style={{ width: "18px", height: "18px", cursor: "pointer" }}
          />
        </div>

        <hr style={{ border: "0", borderTop: "1px solid #e2e8f0", margin: "10px 0" }} />

        {/* Checklist */}
        <div>
          <h3 style={{ fontSize: "16px", marginBottom: "15px", color: "#1e293b" }}>Modern Unit Fixtures Checklist</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {Object.keys(checklist).map((item) => (
              <div key={item} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #f1f5f9" }}>
                <span style={{ fontSize: "14px", color: "#334155", fontWeight: "500" }}>{checklistLabels[item]}</span>
                <div style={{ display: "flex", gap: "8px" }}>
                  {["GOOD", "FAIR", "POOR"].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleChecklistChange(item, status)}
                      style={{
                        padding: "5px 12px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        borderRadius: "4px",
                        border: "1px solid",
                        cursor: "pointer",
                        borderColor: checklist[item] === status ? "transparent" : "#cbd5e1",
                        background: checklist[item] === status 
                          ? (status === "GOOD" ? "#22c55e" : status === "FAIR" ? "#eab308" : "#ef4444") 
                          : "#fff",
                        color: checklist[item] === status ? "#fff" : "#475569"
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "15px", background: "#eff6ff", borderRadius: "6px", border: "1px solid #bfdbfe", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "14px", fontWeight: "600", color: "#1e40af" }}>Calculated Structural Condition Score:</span>
          <strong style={{ fontSize: "18px", color: "#1e40af" }}>{calculateConditionScore()}%</strong>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <label style={{ fontSize: "14px", fontWeight: "600" }}>Structural Observations & Comments:</label>
          <textarea
            placeholder="Type additional observation comments here..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontFamily: "inherit" }}
          />
        </div>

        <button type="submit" style={{ padding: "12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", fontSize: "16px", fontWeight: "600", cursor: "pointer", marginTop: "10px" }}>
          Submit Verified Inspection Audit
        </button>
      </form>
    </div>
  );
};

export default InspectionForm;