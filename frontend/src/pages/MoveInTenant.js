import React, { useState } from "react";
import API from "../services/api";

const MoveInTenant = ({ unitId, unitNumber, onMoveInSuccess }) => {
  const [tenantEmail, setTenantEmail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [notes, setNotes] = useState("");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const payload = {
      unit: unitId,                  // The primary ID of the selected physical room
      tenant_email: tenantEmail,    // The exact text email the tenant provided
      start_date: startDate,
      end_date: endDate,
      rent_amount: rentAmount || null,       // Defaults to unit price if left blank
      deposit_amount: depositAmount || null,
      status: "ACTIVE",              // Forces the lease active and marks unit as OCCUPIED
      notes: notes
    };

    try {
      await API.post("leases/", payload);
      setSuccess(`Successfully moved tenant into Unit ${unitNumber}!`);
      
      // Clear Form Fields
      setTenantEmail("");
      setStartDate("");
      setEndDate("");
      setRentAmount("");
      setDepositAmount("");
      setNotes("");

      if (onMoveInSuccess) onMoveInSuccess(); // Refresh landlord data grids
    } catch (err) {
      console.error(err);
      // Handles the 404 error if the tenant email doesn't exist in the database
      setError(err.response?.data?.error || "Failed to process move-in operation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="move-in-card" style={{ background: "#fff", padding: "25px", borderRadius: "8px", border: "1px solid #e1e6eb" }}>
      <h3>Move New Tenant into Unit {unitNumber}</h3>
      
      {success && <p style={{ color: "green", fontWeight: "bold" }}>{success}</p>}
      {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "15px" }}>
        <div>
          <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>Tenant Registered Email:</label>
          <input 
            type="email" 
            placeholder="e.g. myke50994@gmail.com"
            value={tenantEmail}
            onChange={(e) => setTenantEmail(e.target.value)}
            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
            required 
          />
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>Lease Start Date:</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
              required 
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>Lease End Date:</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
              required 
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>Custom Rent (Optional):</label>
            <input 
              type="number" 
              placeholder="Leave blank to use unit base rent"
              value={rentAmount}
              onChange={(e) => setRentAmount(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>Security Deposit:</label>
            <input 
              type="number" 
              placeholder="Deposit Amount"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>Lease Notes:</label>
          <textarea 
            placeholder="Add specific terms or agreement references..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", height: "60px" }}
          />
        </div>

        <button 
          type="submit" 
          disabled={submitting}
          style={{ background: "#2563eb", color: "#fff", border: "none", padding: "10px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
        >
          {submitting ? "Processing Link..." : "Create Lease & Activate"}
        </button>
      </form>
    </div>
  );
};

export default MoveInTenant;