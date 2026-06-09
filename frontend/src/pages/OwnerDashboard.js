import React, { useEffect, useState } from "react";
import API from "../services/api";
import { Link } from "react-router-dom";
import ManageUnits from "./ManageUnits"; 
import { 
  FaBuilding, 
  FaMapMarkerAlt, 
  FaChevronLeft, 
  FaFileInvoiceDollar, 
  FaTrash, 
  FaPlus, 
  FaTools, 
  FaUserTie 
} from "react-icons/fa";
import "../styles/OwnerDashboard.css";

const OwnerDashboard = () => {
  const [properties, setProperties] = useState([]);
  const [allLeases, setAllLeases] = useState([]); 
  const [maintenanceRequests, setMaintenanceRequests] = useState([]); 
  const [vendors, setVendors] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [selectedProperty, setSelectedProperty] = useState(null);

  // Defensive, segmented data-fetching strategy
  const fetchDashboardData = async () => {
    setLoading(true);
    
    // 1. Fetch CRITICAL baseline data (Dashboard crashes only if these fail)
    try {
      const [propRes, leaseRes] = await Promise.all([
        API.get("properties/"),
        API.get("leases/")
      ]);
      setProperties(propRes.data);
      setAllLeases(leaseRes.data);
      setError("");
    } catch (err) {
      console.error("Critical dashboard core synchronization error:", err);
      setError("Failed to fetch critical property and lease records.");
      setLoading(false);
      return; 
    }

    // 2. Fetch maintenance tickets independently with standard/paginated array checking
    try {
      const maintRes = await API.get("maintenance/requests/");
      
      if (Array.isArray(maintRes.data)) {
        setMaintenanceRequests(maintRes.data);
      } else if (maintRes.data && Array.isArray(maintRes.data.results)) {
        setMaintenanceRequests(maintRes.data.results);
      } else {
        setMaintenanceRequests([]); 
      }
    } catch (err) {
      console.error("Maintenance tracking system endpoint down or unreachable:", err);
      setMaintenanceRequests([]); 
    }

    // 3. Fetch vendor list independently with standard/paginated array checking
    try {
      const vendorRes = await API.get("maintenance/vendors/");
      
      if (Array.isArray(vendorRes.data)) {
        setVendors(vendorRes.data);
      } else if (vendorRes.data && Array.isArray(vendorRes.data.results)) {
        setVendors(vendorRes.data.results);
      } else {
        setVendors([]);
      }
    } catch (err) {
      console.error("Vendor directory missing or endpoint returned 404:", err);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  /* ================= LEASE TERMINATION HANDLER ================= */
  const handleTerminateLease = async (leaseId) => {
    if (!window.confirm("Are you sure you want to terminate this tenant's lease? This will update their unit status back to VACANT.")) {
      return;
    }
    try {
      await API.post(`/leases/${leaseId}/terminate/`);
      fetchDashboardData(); 
    } catch (error) {
      alert(error.response?.data?.error || "Failed to terminate lease.");
    }
  };

  /* ================= VENDOR ASSIGNMENT PATCH HANDLER ================= */
  const handleAssignVendor = async (requestId, vendorId) => {
    try {
      // Fixed endpoint route matching the Django DefaultRouter requests architecture
      await API.patch(`maintenance/requests/${requestId}/`, {
        assigned_vendor: vendorId || null,
        status: vendorId ? "IN_PROGRESS" : "PENDING"
      });
      fetchDashboardData(); 
    } catch (err) {
      console.error("Failed to assign vendor:", err.response?.data);
      alert(err.response?.data?.error || "Could not assign vendor to request.");
    }
  };

  if (loading) return <p className="loading">Loading dashboard elements...</p>;
  if (error) return <p className="error-message">{error}</p>;

  /* ================= VIEW 1: MANAGE UNITS SUB-VIEW ================= */
  if (selectedProperty) {
    return (
      <div className="owner-dashboard-container">
        <button 
          onClick={() => setSelectedProperty(null)}
          style={{
            background: "none", border: "none", color: "#2563eb", cursor: "pointer",
            fontSize: "16px", display: "flex", alignItems: "center", gap: "8px",
            marginBottom: "20px", fontWeight: "500"
          }}
        >
          <FaChevronLeft /> Back to Properties Overview
        </button>
        
        <div className="property-header" style={{ marginBottom: "20px", borderBottom: "1px solid #e2e8f0", paddingBottom: "15px" }}>
          <h2 style={{ margin: "0 0 5px 0", color: "#1e293b" }}>Managing Units for: {selectedProperty.name}</h2>
          <p style={{ color: "#64748b", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
            <FaMapMarkerAlt /> {selectedProperty.city}, {selectedProperty.country}
          </p>
        </div>

        <ManageUnits propertyId={selectedProperty.id} />
      </div>
    );
  }

  /* ================= VIEW 2: OVERVIEW GRID VIEW ================= */
  return (
    <div className="owner-dashboard-container" style={{ padding: "20px" }}>
      
      {/* Header Panel */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h2 style={{ margin: 0, color: "#1e293b" }}>Your Properties Overview</h2>
        <Link to="/owner/add-property" className="add-property-btn" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <FaPlus size={12} /> Add New Property
        </Link>
      </div>

      {/* Properties Card Grid */}
      <div className="properties-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px", marginBottom: "40px" }}>
        {properties.length === 0 ? (
          <p style={{ color: "#64748b", fontStyle: "italic" }}>No registered properties found.</p>
        ) : (
          properties.map((prop) => (
            <div 
              key={prop.id} 
              className="property-card" 
              style={{ 
                border: "1px solid #e1e6eb", borderRadius: "8px", padding: "20px", 
                background: "#fff", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s"
              }}
              onClick={() => setSelectedProperty(prop)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "none";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#2563eb", marginBottom: "12px" }}>
                <FaBuilding size={20} />
                <h3 style={{ margin: 0, color: "#111827", fontSize: "18px" }}>{prop.name}</h3>
              </div>
              
              <p style={{ margin: "6px 0", color: "#4b5563", fontSize: "14px" }}><strong>Type:</strong> {prop.property_type}</p>
              <p style={{ margin: "6px 0", color: "#4b5563", display: "flex", alignItems: "center", gap: "4px", fontSize: "14px" }}>
                <FaMapMarkerAlt size={14} color="#64748b" /> {prop.city}, {prop.country}
              </p>
              
              <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "#6b7280" }}>Capacity Layout:</span>
                <strong style={{ color: "#2563eb", fontSize: "14px" }}>{prop.total_units} Units</strong>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ================= MAINTENANCE REQUEST TICKETS MONITOR ================= */}
      <div className="owner-maintenance-section" style={{ background: "#fff", padding: "25px", borderRadius: "8px", border: "1px solid #e1e6eb", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", marginBottom: "40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", color: "#eab308" }}>
          <FaTools size={22} />
          <h3 style={{ margin: 0, color: "#1e293b", fontSize: "18px" }}>Incoming Tenant Maintenance Tasks</h3>
        </div>

        {maintenanceRequests.length === 0 ? (
          <p style={{ color: "#64748b", fontStyle: "italic", fontSize: "14px", margin: 0 }}>
            No unresolved maintenance requests logged for your units right now.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "15px" }}>
            {maintenanceRequests.map((ticket) => (
              <div key={ticket.id} style={{ padding: "18px", border: "1px solid #e2e8f0", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "15px" }}>
                <div>
                  <h4 style={{ margin: "0 0 6px 0", color: "#0f172a", fontSize: "16px" }}>{ticket.title}</h4>
                  <p style={{ margin: "0 0 12px 0", color: "#475569", fontSize: "14px" }}>{ticket.description}</p>
                  
                  <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", fontSize: "12px", color: "#64748b" }}>
                    <span><strong>Tenant:</strong> {ticket.tenant_name || "Unknown Tenant"}</span>
                    <span><strong>Location:</strong> {ticket.property_name} — Unit {ticket.unit_number}</span>
                    <span><strong>Logged:</strong> {new Date(ticket.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: "220px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: "600" }}>Status:</span>
                    <span style={{
                      padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold",
                      background: ticket.status === "COMPLETED" ? "#dcfce7" : ticket.status === "IN_PROGRESS" ? "#fef9c3" : "#fee2e2",
                      color: ticket.status === "COMPLETED" ? "#166534" : ticket.status === "IN_PROGRESS" ? "#854d0e" : "#991b1b"
                    }}>{ticket.status}</span>
                  </div>

                  {/* Vendor Assignment Dropdown Selector */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "12px", color: "#475569", fontWeight: "500", display: "flex", alignItems: "center", gap: "4px" }}>
                      <FaUserTie size={11} /> Dispatch Specialized Vendor:
                    </label>
                    <select
                      value={ticket.assigned_vendor || ""}
                      onChange={(e) => handleAssignVendor(ticket.id, e.target.value)}
                      style={{ padding: "6px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#fff", cursor: "pointer" }}
                    >
                      <option value="">-- Assign Vendor --</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= GLOBAL LEASE MONITOR ================= */}
      <div className="owner-leases-section" style={{ background: "#fff", padding: "25px", borderRadius: "8px", border: "1px solid #e1e6eb", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", color: "#2563eb" }}>
          <FaFileInvoiceDollar size={22} />
          <h3 style={{ margin: 0, color: "#1e293b", fontSize: "18px" }}>Active Tenant Leases (Global Monitor)</h3>
        </div>

        {allLeases.length === 0 ? (
          <p style={{ color: "#64748b", fontStyle: "italic", fontSize: "14px", margin: 0 }}>
            No active tenant leases found. Select an available vacant property unit box above to check a tenant in.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "5px" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "2px solid #f1f5f9", color: "#64748b", fontSize: "13px" }}>
                  <th style={{ padding: "12px 8px" }}>Tenant Profile</th>
                  <th style={{ padding: "12px 8px" }}>Property Location</th>
                  <th style={{ padding: "12px 8px" }}>Base Rent Amount</th>
                  <th style={{ padding: "12px 8px" }}>Lease Timeline</th>
                  <th style={{ padding: "12px 8px" }}>Status</th>
                  <th style={{ padding: "12px 8px", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allLeases.map((lease) => {
                  const isActive = lease.status === "ACTIVE";
                  return (
                    <tr key={lease.id} style={{ borderBottom: "1px solid #f1f5f9", fontSize: "14px", color: "#334155" }}>
                      <td style={{ padding: "14px 8px" }}>
                        <strong style={{ color: "#0f172a" }}>{lease.tenant?.first_name} {lease.tenant?.last_name}</strong>
                        <br />
                        <span style={{ fontSize: "12px", color: "#64748b" }}>{lease.tenant?.email}</span>
                      </td>
                      <td style={{ padding: "14px 8px" }}>
                        <span style={{ fontWeight: "500" }}>{lease.unit?.property?.name}</span>
                        <br />
                        <span style={{ fontSize: "12px", color: "#475569", fontWeight: "600" }}>Unit {lease.unit?.unit_number}</span>
                      </td>
                      <td style={{ padding: "14px 8px", fontWeight: "600", color: "#0f172a" }}>
                        ${parseFloat(lease.rent_amount || lease.unit?.rent_price).toFixed(2)}/mo
                      </td>
                      <td style={{ padding: "14px 8px", fontSize: "13px", color: "#334155" }}>
                        {lease.start_date} <span style={{ color: "#94a3b8" }}>➔</span> {lease.end_date}
                      </td>
                      <td style={{ padding: "14px 8px" }}>
                        <span style={{ 
                          padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold",
                          background: isActive ? "#dcfce7" : "#fee2e2",
                          color: isActive ? "#166534" : "#991b1b"
                        }}>
                          {lease.status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 8px", textAlign: "center" }}>
                        {isActive && (
                          <button 
                            onClick={() => handleTerminateLease(lease.id)}
                            style={{ 
                              background: "#ef4444", color: "#fff", border: "none", padding: "6px 12px", 
                              borderRadius: "4px", cursor: "pointer", display: "inline-flex", 
                              alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600",
                              transition: "background 0.2s"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#b91c1c"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "#ef4444"}
                          >
                            <FaTrash size={11} /> Terminate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default OwnerDashboard;