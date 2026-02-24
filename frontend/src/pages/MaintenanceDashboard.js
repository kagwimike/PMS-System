import React, { useState, useEffect } from "react";
import API from "../services/api";
import "../styles/Maintenance.css";

const MaintenanceDashboard = ({ readOnly }) => {
  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    try {
      const res = await API.get("maintenance/requests/");
      setRequests(res.data);
    } catch (err) {
      console.error("Error fetching maintenance requests:", err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div className="maintenance-dashboard">
      <h2>Maintenance Requests</h2>
      {!readOnly && (
        <a href="/maintenance/new" className="btn-add">
          Create New Request
        </a>
      )}

      <table className="requests-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Property</th>
            <th>Unit</th>
            <th>Status</th>
            <th>Vendor</th>
            <th>Tenant</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id}>
              <td>{r.title}</td>
              <td>{r.property_name}</td>
              <td>{r.unit_number}</td>
              <td>{r.status}</td>
              <td>{r.assigned_vendor_name || "-"}</td>
              <td>{r.tenant_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MaintenanceDashboard;
