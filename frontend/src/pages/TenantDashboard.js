import React, { useEffect, useState } from "react";
import API from "../services/api";
import { FaEye, FaTrash, FaArrowUp, FaArrowDown, FaChevronLeft, FaChevronRight, FaCheckCircle, FaWhatsapp } from "react-icons/fa";
import "../styles/TenantDashboard.css";

const TenantDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const isAdminOrOwner = user?.role === "ADMIN" || user?.role === "OWNER";

  const [leases, setLeases] = useState([]);
  const [requests, setRequests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State for reporting new damage
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDesc, setTicketDesc] = useState("");
  const [ticketFile, setTicketFile] = useState(null);
  const [submittingTicket, setSubmittingTicket] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [paymentSort, setPaymentSort] = useState({
    field: "date",
    direction: "desc",
  });

  const itemsPerPage = 5;

  /* ================= FETCH (RESILIENT PATTERN) ================= */
  const fetchData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        API.get("/leases/tenant/"),
        API.get("/maintenance/requests/"),
        API.get("/payments/tenant/"),
      ]);

      if (results[0].status === "fulfilled") {
        setLeases(results[0].value.data);
      } else {
        console.error("Lease Fetch Exception Trace:", results[0].reason);
        setLeases([]);
      }

      if (results[1].status === "fulfilled") {
        setRequests(results[1].value.data);
      } else {
        console.error("Maintenance Fetch Exception Trace:", results[1].reason);
        setRequests([]);
      }

      if (results[2].status === "fulfilled") {
        setPayments(results[2].value.data);
      } else {
        console.warn("Payments 404/Network failure handled gracefully:", results[2].reason);
        try {
          const fallbackPayRes = await API.get(`/payments/?tenant=${user?.id}`);
          setPayments(fallbackPayRes.data);
        } catch (fallbackErr) {
          console.error("Payments fallback request also rejected:", fallbackErr);
          setPayments([]);
        }
      }
    } catch (err) {
      console.error("Unexpected failure across asynchronous thread array:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ================= SUBMIT MAINTENANCE & WHATSAPP REDIRECT ================= */
  const handleReportDamage = async (e) => {
    e.preventDefault();
    if (leases.length === 0) return alert("You must have an active linked lease to file tickets.");

    setSubmittingTicket(true);
    const activeLease = leases[0]; // Binding automatically to the tenant's current active unit property key

    const formData = new FormData();
    formData.append("title", ticketTitle);
    formData.append("description", ticketDesc);
    formData.append("property", activeLease.unit?.property?.id || activeLease.property?.id);
    formData.append("unit", activeLease.unit?.id);
    if (ticketFile) {
      formData.append("damage_photo", ticketFile);
    }

    try {
      // 1. Log structural file information securely in your Django database
      await API.post("/maintenance/requests/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Maintenance ticket successfully logged in system!");

      // 2. Open WhatsApp Click-to-Chat string sequence dynamically
      const landlordPhone = "254700000000"; // 👈 Replace with your real phone number layout format (no spaces or '+' sign)
      const messageText = `🚨 *NEW DAMAGE REPORT* 🚨\n\n*Tenant:* ${user.first_name} ${user.last_name}\n*Issue:* ${ticketTitle}\n*Details:* ${ticketDesc}\n\nLogged in the PMS portal. Please review the profile dashboard image upload link.`;
      
      const whatsappUrl = `https://wa.me/${landlordPhone}?text=${encodeURIComponent(messageText)}`;
      window.open(whatsappUrl, "_blank");

      // Reset form controls
      setTicketTitle("");
      setTicketDesc("");
      setTicketFile(null);
      fetchData(); // Hot-reload request updates list view container layout
    } catch (err) {
      console.error("Failed to post damage entry payload:", err);
      alert("Error reporting maintenance issue.");
    } finally {
      setSubmittingTicket(false);
    }
  };

  /* ================= VERIFY COMPLETED TASK & SEND EMAIL ================= */
  const handleVerifyTask = async (id) => {
    if (!window.confirm("Confirm this vendor maintenance task is completed up to your standards?")) return;
    try {
      // Hits the custom patch view to flip status and automatically trigger the Landlord email dispatch
      await API.patch(`/maintenance/requests/${id}/`, { status: "VERIFIED" });
      alert("Task verified. Automatic notification email sent out to landlord!");
      fetchData();
    } catch (err) {
      console.error("Verification error handshake:", err);
      alert("Failed to submit verification confirmation status modification.");
    }
  };

  /* ================= TERMINATE ================= */
  const handleTerminate = async (leaseId) => {
    if (!isAdminOrOwner) return;
    if (!window.confirm("Are you sure you want to terminate this lease?")) return;
    try {
      await API.post(`/leases/${leaseId}/terminate/`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to terminate lease.");
    }
  };

  /* ================= BADGES ================= */
  const getStatusClass = (status) => `status ${status?.toLowerCase().replace(/ /g, "-") || "pending"}`;
  const getPriorityClass = (priority) => `priority ${priority?.toLowerCase() || "medium"}`;
  const getPaymentStatusClass = (status) => `payment-status ${status?.toLowerCase() || "unpaid"}`;

  /* ================= SORT PAYMENTS ================= */
  const handleSort = (field) => {
    setPaymentSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedPayments = [...payments].sort((a, b) => {
    let valA = a[paymentSort.field];
    let valB = b[paymentSort.field];
    if (paymentSort.field === "date") {
      valA = new Date(valA);
      valB = new Date(valB);
    }
    if (paymentSort.direction === "asc") return valA > valB ? 1 : -1;
    return valA < valB ? 1 : -1;
  });

  /* ================= SUMMARY CALC ================= */
  const totalRent = leases.reduce((sum, lease) => sum + (parseFloat(lease.rent_amount) || 0), 0);
  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const outstanding = totalRent - totalPaid;

  /* ================= PAGINATION ================= */
  const totalPages = Math.max(1, Math.ceil(requests.length / itemsPerPage));
  const paginatedRequests = requests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return <p className="loading">Loading dashboard profile...</p>;

  if (user?.role === "TENANT" && leases.length === 0) {
    return (
      <div className="unlinked-tenant-container" style={{ textAlign: "center", padding: "60px 20px" }}>
        <div className="unlinked-card" style={{ background: "#fff", maxWidth: "600px", margin: "0 auto", padding: "40px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          <h2>Welcome to Your Portal, {user.first_name || "Tenant"}!</h2>
          <p style={{ color: "#666", lineHeight: "1.6", marginBottom: "25px" }}>
            Your account setup is complete. However, your dashboard metrics and lease details will remain inactive until your landlord links your profile to your physical unit.
          </p>
          <div style={{ background: "#f4f6f9", display: "inline-block", padding: "12px 24px", borderRadius: "6px", border: "1px solid #e1e6eb" }}>
            <span style={{ color: "#4b5563", fontSize: "14px" }}>Provide this registration email to your landlord:</span>
            <br />
            <strong style={{ color: "#1f2937", fontSize: "16px" }}>{user.email}</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tenant-dashboard">
      {/* ================= SUMMARY CARD COUNTERS ================= */}
      <div className="summary-grid">
        <div className="summary-card">
          <h4>Total Rent Obligations</h4>
          <h2>${totalRent.toFixed(2)}</h2>
        </div>
        <div className="summary-card">
          <h4>Total Paid Amount</h4>
          <h2 className="green">${totalPaid.toFixed(2)}</h2>
        </div>
        <div className="summary-card">
          <h4>Outstanding Balance</h4>
          <h2 className="red">${outstanding.toFixed(2)}</h2>
        </div>
      </div>

      {/* ================= LOG NEW DAMAGE / MAINTENANCE TICKET FORM ================= */}
      <div className="card damage-reporting-card" style={{ marginBottom: "25px" }}>
        <h3>Report New Asset Damage / Maintenance</h3>
        <form onSubmit={handleReportDamage} style={{ display: "grid", gap: "15px", marginTop: "15px" }}>
          <div style={{ display: "flex", gap: "15px" }}>
            <input 
              type="text" 
              placeholder="Title (e.g. Broken Bathroom Faucet)" 
              value={ticketTitle} 
              onChange={(e) => setTicketTitle(e.target.value)} 
              required 
              style={{ flex: 1, padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setTicketFile(e.target.files[0])} 
              style={{ padding: "6px" }}
            />
          </div>
          <textarea 
            placeholder="Provide a description of the issue to the maintenance logs network..." 
            value={ticketDesc} 
            onChange={(e) => setTicketDesc(e.target.value)} 
            required 
            rows="3"
            style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc", resize: "vertical" }}
          />
          <button type="submit" disabled={submittingTicket} className="whatsapp-submit-btn" style={{ background: "#25D366", color: "#fff", fontWeight: "bold", border: "none", padding: "12px", borderRadius: "5px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <FaWhatsapp size={18} /> {submittingTicket ? "Processing Records..." : "File Request & Share on WhatsApp"}
          </button>
        </form>
      </div>

      <div className="dashboard-grid">
        {/* ================= LEASES VIEWBOX ================= */}
        <div className="card">
          <h3>My Leases & Unit Inspections</h3>
          {leases.map((lease) => (
            <div key={lease.id} className="lease-box">
              <p><strong>Property:</strong> {lease.unit?.property?.name || "Unassigned Asset"}</p>
              <p><strong>Unit Number:</strong> {lease.unit?.unit_number || "N/A"}</p>
              <p><strong>Start Date:</strong> {lease.start_date}</p>
              <p><strong>End Date:</strong> {lease.end_date}</p>
              <div style={{ margin: "10px 0" }}>
                <span className={getStatusClass(lease.status)}>{lease.status}</span>
              </div>
              {isAdminOrOwner && lease.status !== "TERMINATED" && (
                <button className="terminate-btn" onClick={() => handleTerminate(lease.id)}>
                  <FaTrash /> Terminate
                </button>
              )}
            </div>
          ))}
        </div>

        {/* ================= MAINTENANCE TRACKING ENGINE ================= */}
        <div className="card">
          <h3>Maintenance Requests</h3>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan="4" className="no-data" style={{ textAlign: "center" }}>No logs recorded.</td>
                </tr>
              ) : (
                paginatedRequests.map((req) => (
                  <tr key={req.id}>
                    <td>{req.title}</td>
                    <td>
                      <span className={getStatusClass(req.status)}>{req.status}</span>
                    </td>
                    <td>
                      <span className={getPriorityClass(req.priority)}>{req.priority}</span>
                    </td>
                    <td style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <FaEye className="action-icon" title="View Details" />
                      
                      {/* ✅ TRIGGERS EMAIL NOTIFICATION WHEN TENANT APPROVES WORK DONE */}
                      {(req.status === "COMPLETED" || req.status === "COMPLETED_BY_VENDOR") && (
                        <FaCheckCircle 
                          className="action-icon check-verify-icon" 
                          style={{ color: "#2563eb", cursor: "pointer" }}
                          title="Verify Completion"
                          onClick={() => handleVerifyTask(req.id)}
                        />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {requests.length > itemsPerPage && (
            <div className="pagination-controls" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "15px" }}>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="pag-btn">
                <FaChevronLeft /> Prev
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="pag-btn">
                Next <FaChevronRight />
              </button>
            </div>
          )}
        </div>

        {/* ================= PAYMENT HISTORY ================= */}
        <div className="card full-width">
          <h3>Payment History</h3>
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort("date")} style={{ cursor: "pointer" }}>
                  Date {paymentSort.field === "date" && (paymentSort.direction === "asc" ? <FaArrowUp /> : <FaArrowDown />)}
                </th>
                <th onClick={() => handleSort("amount")} style={{ cursor: "pointer" }}>
                  Amount {paymentSort.field === "amount" && (paymentSort.direction === "asc" ? <FaArrowUp /> : <FaArrowDown />)}
                </th>
                <th>Method</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedPayments.length === 0 ? (
                <tr>
                  <td colSpan="4" className="no-data" style={{ textAlign: "center" }}>No transaction history.</td>
                </tr>
              ) : (
                sortedPayments.map((pay) => (
                  <tr key={pay.id}>
                    <td>{pay.date}</td>
                    <td>${parseFloat(pay.amount).toFixed(2)}</td>
                    <td>{pay.method}</td>
                    <td>
                      <span className={getPaymentStatusClass(pay.status)}>{pay.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TenantDashboard;