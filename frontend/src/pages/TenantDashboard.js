import React, { useEffect, useState } from "react";
import API from "../services/api"; 
import "../styles/TenantDashboard.css";

const TenantDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const isAdminOrOwner = user?.role === "ADMIN" || user?.role === "OWNER";

  const [leases, setLeases] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeases = async () => {
    try {
      const leaseRes = await API.get("/leases/tenant/");
      setLeases(leaseRes.data);
    } catch (err) {
      console.error("Error fetching leases:", err);
    }
  };

  const fetchRequests = async () => {
    try {
      const reqRes = await API.get("/maintenance/requests/");
      setRequests(reqRes.data);
    } catch (err) {
      console.error("Error fetching requests:", err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchLeases(), fetchRequests()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Only Owner/Admin can terminate leases
  const handleTerminate = async (leaseId) => {
    if (!isAdminOrOwner) return;

    const confirmTerminate = window.confirm(
      "Are you sure you want to terminate this lease?"
    );
    if (!confirmTerminate) return;

    try {
      await API.post(`/leases/${leaseId}/terminate/`);
      alert("Lease terminated successfully.");
      fetchLeases(); // Refresh leases
    } catch (error) {
      console.error("Termination error:", error.response || error);
      alert(
        error.response?.data?.error || "Failed to terminate lease."
      );
    }
  };

  if (loading) return <p style={{ padding: "40px" }}>Loading...</p>;

  return (
    <div className="tenant-dashboard">
      <h2>Tenant Dashboard</h2>

      {/* ================= LEASES ================= */}
      <section>
        <h3>My Leases</h3>
        {leases.length === 0 ? (
          <p>No active leases.</p>
        ) : (
          <div className="cards-container">
            {leases.map((lease) => (
              <div className="card" key={lease.id}>
                <p><strong>Property:</strong> {lease.property?.name || "No Property Assigned"}</p>
                <p><strong>Unit:</strong> {lease.unit?.name || "N/A"}</p>
                <p><strong>Start:</strong> {lease.start_date}</p>
                <p><strong>End:</strong> {lease.end_date}</p>
                <p><strong>Status:</strong> {lease.status}</p>

                {/* Terminate button only for Owner/Admin */}
                {isAdminOrOwner && lease.status !== "TERMINATED" && (
                  <button
                    className="terminate-btn"
                    onClick={() => handleTerminate(lease.id)}
                  >
                    Terminate Lease
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ================= MAINTENANCE REQUESTS ================= */}
      <section>
        <h3>Maintenance Requests</h3>
        {requests.length === 0 ? (
          <p>No requests submitted.</p>
        ) : (
          <div className="cards-container">
            {requests.map((req) => (
              <div className="card request-card" key={req.id}>
                <p><strong>Title:</strong> {req.title}</p>
                <p><strong>Description:</strong> {req.description}</p>
                <p><strong>Status:</strong> {req.status}</p>

                {req.vendor ? (
                  <div className="vendor-box">
                    <p><strong>Assigned Vendor:</strong> {req.vendor?.name || "Unknown Vendor"}</p>
                    <p>Phone: {req.vendor?.phone || "No phone listed"}</p>
                    <p>Email: {req.vendor?.email || "No email listed"}</p>
                  </div>
                ) : (
                  <p className="no-vendor"><em>Waiting for vendor assignment...</em></p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default TenantDashboard;