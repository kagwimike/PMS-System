import React, { useEffect, useState } from "react";
import API from "../services/api";
import { toast } from "react-toastify";
import "../styles/LeaseList.css";

const LeaseList = () => {
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [terminatingId, setTerminatingId] = useState(null);

  useEffect(() => {
    fetchLeases();
  }, []);

  const fetchLeases = async () => {
    try {
      setLoading(true);
      const res = await API.get("leases/");
      setLeases(res.data);
    } catch (err) {
      toast.error("Failed to load leases.");
    } finally {
      setLoading(false);
    }
  };

  const handleTerminate = async (leaseId) => {
    const confirmTerminate = window.confirm(
      "Are you sure you want to terminate this lease?"
    );

    if (!confirmTerminate) return;

    try {
      setTerminatingId(leaseId);

      await API.post(`leases/${leaseId}/terminate/`);

      // Optimistic UI update (no full reload)
      setLeases((prevLeases) =>
        prevLeases.map((lease) =>
          lease.id === leaseId
            ? { ...lease, status: "TERMINATED" }
            : lease
        )
      );

      toast.success("Lease terminated successfully.");
    } catch (err) {
      toast.error(
        err.response?.data?.detail || "Failed to terminate lease."
      );
    } finally {
      setTerminatingId(null);
    }
  };

  const renderStatusBadge = (status) => {
    const className =
      status === "ACTIVE"
        ? "status-badge active"
        : "status-badge terminated";

    return <span className={className}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="lease-list-container">
        <h2>Leases</h2>
        <p>Loading leases...</p>
      </div>
    );
  }

  return (
    <div className="lease-list-container">
      <h2 className="page-title">Leases</h2>

      {leases.length === 0 ? (
        <p className="empty-state">No leases found.</p>
      ) : (
        <div className="table-wrapper">
          <table className="lease-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Unit</th>
                <th>Tenant</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {leases.map((lease) => (
                <tr key={lease.id}>
                  <td>{lease.property_name}</td>
                  <td>{lease.unit_number}</td>
                  <td>{lease.tenant_name}</td>
                  <td>{renderStatusBadge(lease.status)}</td>
                  <td>
                    {lease.status === "ACTIVE" ? (
                      <button
                        className="terminate-btn"
                        disabled={terminatingId === lease.id}
                        onClick={() => handleTerminate(lease.id)}
                      >
                        {terminatingId === lease.id
                          ? "Terminating..."
                          : "Terminate"}
                      </button>
                    ) : (
                      <span className="no-action">—</span>
                    )}
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

export default LeaseList;