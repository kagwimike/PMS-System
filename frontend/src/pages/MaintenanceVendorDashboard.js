import React, { useEffect, useState } from "react";
import API from "../services/api";
import "../styles/MaintenanceVendorDashboard.css";


const MaintenanceDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [vendors, setVendors] = useState([]);
  
  // New Vendor Form State
  const [newVendor, setNewVendor] = useState({ name: "", email: "", phone: "" });
  const [isSubmittingVendor, setIsSubmittingVendor] = useState(false);

  useEffect(() => {
    fetchData();
    setupWebSocket();
  }, []);

  const fetchData = async () => {
    try {
      const res = await API.get("maintenance/requests/");
      const vendorRes = await API.get("maintenance/vendors/");
      setRequests(res.data);
      setVendors(vendorRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  const assignVendor = async (id, vendorId) => {
    try {
      await API.post(`maintenance/requests/${id}/assign/`, { vendor: vendorId });
      fetchData(); // Refresh to see updated status and vendor
    } catch (error) {
      console.error("Failed to assign vendor:", error);
    }
  };

  const updateRequestStatus = async (id, status) => {
    try {
      await API.patch(`maintenance/requests/${id}/`, { status });
      fetchData();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleAddVendor = async (e) => {
    e.preventDefault();
    setIsSubmittingVendor(true);
    try {
      await API.post("maintenance/vendors/", newVendor);
      setNewVendor({ name: "", email: "", phone: "" });
      fetchData(); // Refresh vendor list
    } catch (error) {
      console.error("Failed to add vendor:", error);
      alert("Failed to add vendor.");
    } finally {
      setIsSubmittingVendor(false);
    }
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
      <h2>Maintenance Management</h2>

      <div className="card vendor-form-card" style={{ marginBottom: '20px', padding: '15px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
        <h4 style={{ marginTop: 0 }}>Add New Vendor</h4>
        <form onSubmit={handleAddVendor} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" placeholder="Vendor Name" value={newVendor.name} onChange={(e) => setNewVendor({...newVendor, name: e.target.value})} required style={{ padding: '8px', flex: 1, minWidth: '150px' }} />
          <input type="email" placeholder="Email" value={newVendor.email} onChange={(e) => setNewVendor({...newVendor, email: e.target.value})} required style={{ padding: '8px', flex: 1, minWidth: '150px' }} />
          <input type="text" placeholder="Phone" value={newVendor.phone} onChange={(e) => setNewVendor({...newVendor, phone: e.target.value})} style={{ padding: '8px', flex: 1, minWidth: '150px' }} />
          <button type="submit" disabled={isSubmittingVendor} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: isSubmittingVendor ? 'not-allowed' : 'pointer' }}>
            {isSubmittingVendor ? "Adding..." : "Add Vendor"}
          </button>
        </form>
      </div>

      <h3>Active Requests</h3>

      {requests.map(r => (
        <div key={r.id} className="card">
          <h4>{r.title}</h4>
          <p>Status: {r.status}</p>
          <p>Vendor: {r.vendor_name || "Unassigned"}</p>

          <select onChange={(e) => assignVendor(r.id, e.target.value)} defaultValue="">
            <option value="" disabled>Assign Vendor</option>
            {vendors.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>

          <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
            <button onClick={() => updateRequestStatus(r.id, "IN_PROGRESS")}>
              Start Work
            </button>
            <button onClick={() => updateRequestStatus(r.id, "COMPLETED")}>
              Mark Completed
            </button>
            <button onClick={() => updateRequestStatus(r.id, "CANCELLED")}>
              Cancel Request
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MaintenanceDashboard;
