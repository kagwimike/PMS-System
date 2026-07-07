import React, { useState, useEffect } from "react";
import api from "../services/api";
import "../styles/Dashboards.css"; // or your preferred style layout

const OwnerInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ totalCollected: 0, pendingAmount: 0 });

  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        const res = await api.get("invoices/owner_global/");
        setInvoices(res.data.invoices || []);
        setMetrics({
          totalCollected: res.data.total_collected || 0,
          pendingAmount: res.data.pending_amount || 0,
        });
      } catch (error) {
        console.error("Error fetching global owner invoices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceData();
  }, []);

  if (loading) return <div className="loading">Loading Global Invoice Registry...</div>;

  return (
    <div className="dashboard-container" style={{ padding: "30px" }}>
      <div className="dashboard-header">
        <h2>Global Invoices Management</h2>
        <p>Monitor status, generate late fees, and track incoming tenant payments.</p>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid" style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
        <div className="metric-card" style={{ background: "#e6f4ea", padding: "20px", borderRadius: "8px", flex: 1 }}>
          <h3>Total Collected</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", color: "#137333" }}>KES {metrics.totalCollected.toLocaleString()}</p>
        </div>
        <div className="metric-card" style={{ background: "#fce8e6", padding: "20px", borderRadius: "8px", flex: 1 }}>
          <h3>Pending Receivables</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", color: "#c5221f" }}>KES {metrics.pendingAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Invoices Data Table */}
      <div className="table-responsive" style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #eee" }}>
              <th style={{ padding: "12px" }}>Invoice ID</th>
              <th style={{ padding: "12px" }}>Tenant</th>
              <th style={{ padding: "12px" }}>Property / Unit</th>
              <th style={{ padding: "12px" }}>Amount Due</th>
              <th style={{ padding: "12px" }}>Due Date</th>
              <th style={{ padding: "12px" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: "20px", textAlign: "center", color: "#777" }}>No invoices found in registry.</td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "12px", fontWeight: "500" }}>#{inv.invoice_number}</td>
                  <td style={{ padding: "12px" }}>{inv.tenant_name}</td>
                  <td style={{ padding: "12px" }}>{inv.property_title}</td>
                  <td style={{ padding: "12px" }}>KES {inv.amount.toLocaleString()}</td>
                  <td style={{ padding: "12px" }}>{new Date(inv.due_date).toLocaleDateString()}</td>
                  <td style={{ padding: "12px" }}>
                    <span className={`badge ${inv.status.toLowerCase()}`} style={{
                      padding: "6px 12px", 
                      borderRadius: "12px", 
                      fontSize: "12px",
                      fontWeight: "bold",
                      backgroundColor: inv.status === "PAID" ? "#e6f4ea" : inv.status === "PENDING" ? "#fef7e0" : "#fce8e6",
                      color: inv.status === "PAID" ? "#137333" : inv.status === "PENDING" ? "#b06000" : "#c5221f"
                    }}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OwnerInvoices;