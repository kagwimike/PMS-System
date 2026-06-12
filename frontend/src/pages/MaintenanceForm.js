import React, { useState, useEffect } from "react";
import API from "../services/api";
import "../styles/Maintenance.css";

const MaintenanceForm = () => {
  // 🚨 1. GET THE LOGGED-IN USER PROFILE & CHECK ROLE PRIVILEGES
  const user = JSON.parse(localStorage.getItem("user"));
  const isTenant = user?.role === "TENANT";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  const [tenantLease, setTenantLease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false); // Added submission loading state
  
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // 🚨 2. BAIL OUT EARLY IF USER IS NOT A TENANT
    if (!isTenant) {
      setLoading(false);
      return;
    }

    const fetchTenantLeaseData = async () => {
      try {
        const res = await API.get("leases/tenant/");
        
        if (res.data && res.data.length > 0) {
          // Find their active lease assignment row
          const activeLeaseRow = res.data.find((l) => l.status === "ACTIVE");
          if (activeLeaseRow) {
            setTenantLease(activeLeaseRow);
          }
        }
      } catch (err) {
        console.error("Error retrieving tenant lease details:", err);
        setError("Could not load your property assignment profile details.");
      } finally {
        setLoading(false);
      }
    };
    fetchTenantLeaseData();
  }, [isTenant]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Safety guard protections
    if (!isTenant) {
      setError("Unauthorized. Owners/Admins cannot submit tenant maintenance claims.");
      return;
    }

    if (!tenantLease) {
      setError("Filing failed. You must have an active linked lease property profile to submit tasks.");
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError("Please complete all requested data fields.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    // 🛠️ Defensively extract the primary keys depending on if your serializer is nested or flat
    const propertyId = tenantLease.unit?.property?.id || tenantLease.property?.id || tenantLease.property;
    const unitId = tenantLease.unit?.id || tenantLease.unit;

    try {
      // Send payload securely to the ViewSet requests endpoint router mapping
      await API.post("maintenance/requests/", {
        title: title.trim(),
        description: description.trim(),
        property: propertyId,
        unit: unitId,
      });

      setSuccess("Maintenance request submitted successfully! The management team has been alerted.");
      setTitle("");
      setDescription("");
    } catch (err) {
      console.error("Failed to post maintenance entry payload:", err);
      setError(err.response?.data?.error || "Failed to submit maintenance request. Verify backend server rules.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="maintenance-form" style={{ textAlign: "center", padding: "40px" }}>
        <p style={{ color: "#64748b", fontSize: "15px" }}>Verifying residency records...</p>
      </div>
    );
  }

  // 🚨 3. RENDER ACCESS DENIED CARD IF USER IS AN OWNER OR ADMIN
  if (!isTenant) {
    return (
      <div className="maintenance-form access-denied" style={{ padding: "30px", maxWidth: "600px", margin: "0 auto" }}>
        <div style={{ background: "#fff3cd", border: "1px solid #ffeeba", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
          <h3 style={{ color: "#856404", marginTop: 0, fontSize: "18px" }}>⚠️ Access Denied</h3>
          <p style={{ color: "#856404", marginBottom: 0, lineHeight: "1.5", fontSize: "14px" }}>
            This maintenance filing form is restricted strictly to active <strong>Tenants</strong>. 
            As an Owner or Admin, please use your management panel to manage assignments or monitor work completion matrices.
          </p>
        </div>
      </div>
    );
  }

  /* ================= RENDER ACTIVE TENANT FORM CONTENT ================= */
  return (
    <div className="maintenance-form" style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h2 style={{ color: "#1e293b", marginBottom: "10px" }}>Create Maintenance Request</h2>
      <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "20px" }}>
        Notice an issue within your unit? Submit a request here and our core property vendor operations squad will get on it.
      </p>

      {success && <p className="success" style={{ color: "#166534", background: "#dcfce7", padding: "10px 14px", borderRadius: "4px", fontSize: "14px" }}>{success}</p>}
      {error && <p className="error" style={{ color: "#991b1b", background: "#fee2e2", padding: "10px 14px", borderRadius: "4px", fontSize: "14px" }}>{error}</p>}

      <div className="tenant-location-badge" style={{
        padding: "12px 16px", 
        background: "#f8fafc", 
        borderRadius: "6px", 
        marginBottom: "20px",
        border: "1px solid #e2e8f0",
        borderLeft: "4px solid #2563eb",
        fontSize: "14px"
      }}>
        {tenantLease ? (
          <>
            <p style={{ margin: "0 0 5px 0", color: "#334155" }}>
              <strong>Property:</strong> {tenantLease.unit?.property?.name || tenantLease.property_name || "Assigned Asset"}
            </p>
            <p style={{ margin: "0", color: "#334155" }}>
              <strong>Your Unit:</strong> {tenantLease.unit?.unit_number || tenantLease.unit_number || "N/A"}
            </p>
          </>
        ) : (
          <p style={{ margin: "0", color: "#dc3545", fontWeight: "500" }}>
            ⚠️ No active lease profile detected. Requests cannot be completed until management links your account to a physical unit.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "600", color: "#475569" }}>Issue Headline</label>
          <input
            type="text"
            placeholder="What is the issue? (e.g., Water heater not heating up)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={!tenantLease || submitting}
            style={{ width: "100%", padding: "10px", fontSize: "14px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "600", color: "#475569" }}>Detailed Description</label>
          <textarea
            placeholder="Please describe details or exact room location of the maintenance issue..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows="5"
            disabled={!tenantLease || submitting}
            style={{ width: "100%", padding: "10px", fontSize: "14px", borderRadius: "4px", border: "1px solid #cbd5e1", resize: "vertical" }}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={!tenantLease || submitting}
          style={{
            background: (!tenantLease || submitting) ? "#94a3b8" : "#2563eb",
            color: "#fff",
            border: "none",
            padding: "12px",
            borderRadius: "4px",
            fontWeight: "600",
            cursor: (!tenantLease || submitting) ? "not-allowed" : "pointer",
            transition: "background 0.2s"
          }}
        >
          {submitting ? "Submitting Request..." : "Submit Maintenance Request"}
        </button>
      </form>
    </div>
  );
};

export default MaintenanceForm;