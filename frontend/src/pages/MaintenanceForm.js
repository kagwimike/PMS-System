import React, { useState, useEffect } from "react";
import API from "../services/api";
import "../styles/Maintenance.css";

const MaintenanceForm = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  // Track automated lease details from backend instead of raw property arrays
  const [tenantLease, setTenantLease] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Fetch the logged-in tenant's active lease profile data on mount
  useEffect(() => {
    const fetchTenantLeaseData = async () => {
      try {
        const res = await API.get("leases/tenant/");
        
        if (res.data && res.data.length > 0) {
          // Find their active lease row configuration layout
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
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title || !description) {
      setError("Please complete all requested data fields.");
      return;
    }

    try {
      // Clean payload payload targeting your exact view path: 'maintenance/'
      await API.post("maintenance/", {
        title,
        description,
        // Backend handles auto-mapping property/unit IDs dynamically via request user session!
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

  return (
    <div className="maintenance-form">
      <h2>Create Maintenance Request</h2>
      {success && <p className="success">{success}</p>}
      {error && <p className="error">{error}</p>}

      {/* Automated Location Preview Block instead of blank dropdown selections */}
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
          disabled={!tenantLease} // Block submission if they have no active space mapped
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