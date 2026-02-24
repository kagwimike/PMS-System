import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/MaintenanceVendorDashboard.css";


const MaintenanceDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    fetchData();
    setupWebSocket();
  }, []);

  const fetchData = async () => {
    const res = await axios.get("/api/maintenance/requests/");
    const vendorRes = await axios.get("/api/maintenance/vendors/");
    setRequests(res.data);
    setVendors(vendorRes.data);
  };

  const updateRequest = async (id, data) => {
    await axios.patch(`/api/maintenance/requests/${id}/`, data);
  };

  const setupWebSocket = () => {
    const socket = new WebSocket("ws://127.0.0.1:8000/ws/maintenance/");

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setRequests(prev =>
        prev.map(r => r.id === data.id ? { ...r, ...data } : r)
      );
    };
  };

  return (
    <div className="container">
      <h2>Maintenance Requests</h2>

      {requests.map(r => (
        <div key={r.id} className="card">
          <h4>{r.title}</h4>
          <p>Status: {r.status}</p>
          <p>Vendor: {r.vendor_name || "Unassigned"}</p>

          <select onChange={(e) =>
            updateRequest(r.id, { assigned_vendor: e.target.value })
          }>
            <option value="">Assign Vendor</option>
            {vendors.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>

          <div>
            <button onClick={() => updateRequest(r.id, { status: "IN_PROGRESS" })}>
              Start
            </button>
            <button onClick={() => updateRequest(r.id, { status: "COMPLETED" })}>
              Complete
            </button>
            <button onClick={() => updateRequest(r.id, { status: "CANCELLED" })}>
              Cancel
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MaintenanceDashboard;
