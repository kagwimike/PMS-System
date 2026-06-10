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
    
    // Extra guard protection on programmatic form submission
    if (!isTenant) {
      setError("Unauthorized. Owners/Admins cannot submit tenant maintenance claims.");
      return;
    }

    if (!title || !description) {
      setError("Please complete all requested data fields.");
      return;
    }

    try {
      await API.post("maintenance/", {
        title,
        description,
      });

      setSuccess("Maintenance request submitted successfully!");
      setError("");
      setTitle("");
      setDescription("");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to submit maintenance request.");
    }
  };

  if (loading) return <div className="maintenance-form"><p>Verifying residency records...</p></div>;

  // 🚨 3. RENDER ACCESS DENIED CARD IF USER IS AN OWNER OR ADMIN
  if (!isTenant) {
    return (
      <div className="maintenance-form access-denied" style={{ padding: "30px", textAlign: "center" }}>
        <div style={{ background: "#fff3cd", border: "1px solid #ffeeba", padding: "20px", borderRadius: "8px" }}>
          <h3 style={{ color: "#856404", marginTop: 0 }}>⚠️ Access Denied</h3>
          <p style={{ color: "#856404", marginBottom: 0, lineHeight: "1.5" }}>
            This maintenance filing form is restricted strictly to active <strong>Tenants</strong>. 
            As an Owner or Admin, please use your management panel to assign vendors or monitor task completion matrices.
          </p>
        </div>
      </div>
    );
  }

  /* ================= RENDER ACTIVE TENANT FORM CONTENT ================= */
  return (
    <div className="maintenance-form">
      <h2>Create Maintenance Request</h2>
      {success && <p className="success">{success}</p>}
      {error && <p className="error">{error}</p>}

      <div className="tenant-location-badge" style={{
        padding: "12px", 
        background: "#f4f6f9", 
        borderRadius: "6px", 
        marginBottom: "15px",
        borderLeft: "4px solid #007bff",
        fontSize: "14px"
      }}>
        {tenantLease ? (
          <>
            <p style={{ margin: "0 0 5px 0" }}><strong>Property:</strong> {tenantLease.property_name}</p>
            <p style={{ margin: "0" }}><strong>Your Unit:</strong> {tenantLease.unit_number}</p>
          </>
        ) : (
          <p style={{ margin: "0", color: "#dc3545" }}>
            ⚠️ No running active lease profile found. Please contact administration.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="What is the issue? (e.g., Water heater not running)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={!tenantLease}
        />
        <textarea
          placeholder="Please describe details or location of the maintenance issue..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          disabled={!tenantLease}
        />
        
        <button type="submit" disabled={!tenantLease}>
          Submit Request
        </button>
      </form>
    </div>
  );
};

export default MaintenanceForm;