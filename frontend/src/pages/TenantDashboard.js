import React, { useEffect, useState } from "react";
import API from "../services/api";
import { 
  FaEye, FaTrash, FaArrowUp, FaArrowDown, 
  FaChevronLeft, FaChevronRight, FaCheckCircle, 
  FaWhatsapp, FaCreditCard, FaTimes, FaTools, FaSpinner 
} from "react-icons/fa";
import "../styles/TenantDashboard.css";

const TenantDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const isAdminOrOwner = user?.role === "ADMIN" || user?.role === "OWNER";

  const [leases, setLeases] = useState([]);
  const [requests, setRequests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Additions for Automated M-Pesa Tracking
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [isPolling, setIsPolling] = useState(false);

  // State for Viewing Maintenance Request / Vendor Details & Updating Progress
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

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

  /* ================= FETCH DATA LOGIC (AUTOMATED HANDSHAKE) ================= */
  const fetchData = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const results = await Promise.allSettled([
        API.get("/leases/tenant/"),
        API.get("/maintenance/requests/"),
        API.get("/payments/history/"), 
        API.get("/payments/invoices/"), 
      ]);

      if (results[0].status === "fulfilled") {
        setLeases(results[0].value.data);
      } else {
        console.error("Lease Fetch Exception Trace:", results[0].reason);
        setLeases([]);
      }

      if (results[1].status === "fulfilled") {
        const ticketData = results[1].value.data;
        setRequests(ticketData);
        
        // Dynamic Modal State Sync: Keeps the popup updated if data reloads mid-view
        if (selectedTicket) {
          const updatedTicket = ticketData.find(t => t.id === selectedTicket.id);
          if (updatedTicket) setSelectedTicket(updatedTicket);
        }
      } else {
        console.error("Maintenance Fetch Exception Trace:", results[1].reason);
        setRequests([]);
      }

      if (results[2].status === "fulfilled") {
        setPayments(results[2].value.data);
      } else {
        console.error("Payments Ledger Engine Error Handled Gracefully:", results[2].reason);
        setPayments([]);
      }

      /* === INVOICE MANAGEMENT & POLLING DETECTOR === */
      if (results[3].status === "fulfilled") {
        const rawInvoices = Array.isArray(results[3].value.data) 
          ? results[3].value.data 
          : results[3].value.data.results || [];

        const activeUnpaid = rawInvoices.filter(inv => {
          const statusStr = String(inv.status || "").toUpperCase();
          return statusStr !== "PAID" && statusStr !== "COMPLETED";
        });

        setUnpaidInvoices(activeUnpaid);

        const currentOnboardingFeePending = activeUnpaid.some(inv => 
          String(inv.description || "").toLowerCase().includes("activation") || 
          String(inv.description || "").toLowerCase().includes("initial")
        );

        if (currentOnboardingFeePending) {
          setIsPolling(true);
        } else {
          setIsPolling(false);
        }
      } else {
        console.error("Invoice Query Handshake Failed:", results[3].reason);
        setUnpaidInvoices([]);
        setIsPolling(false);
      }
    } catch (err) {
      console.error("Unexpected failure across asynchronous thread array:", err);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
  }, []);

  useEffect(() => {
    let intervalId;
    if (isPolling) {
      intervalId = setInterval(() => {
        console.log("⚙️ Syncing ledger allocations with validation webhook logs...");
        fetchData(false); 
      }, 4000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    }
  }, [isPolling]);

  /* ================= RUN BACKUP MANUAL EXPRESS CHECKOUT IF PUSH DROPPED ================= */
  const handleInitiateSTK = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    
    setProcessingPayment(true);
    setPaymentMessage("");

    let formattedPhone = phoneNumber.trim().replace(/\s+/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.replace("+", "");
    } else if (formattedPhone.startsWith("7") || formattedPhone.startsWith("1")) {
      formattedPhone = "254" + formattedPhone;
    }

    try {
      const response = await API.post(`/payments/invoices/${selectedInvoice.id}/pay/`, {
        phone_number: formattedPhone,                
        amount: parseFloat(selectedInvoice.balance_due || selectedInvoice.amount), 
      });

      if (response.data.message) {
        setPaymentMessage(`✨ ${response.data.message}`);
        setIsPolling(true); 
        setTimeout(() => {
          setSelectedInvoice(null);
          setPhoneNumber("");
          setPaymentMessage("");
        }, 4000);
      }
    } catch (err) {
      console.error("Payment pipeline execution error logic:", err);
      const errorMsg = err.response?.data?.error || "Connection dropped. Verify config params.";
      setPaymentMessage(`❌ ${errorMsg}`);
    } finally {
      setProcessingPayment(false);
    }
  };

  /* ================= SUBMIT MAINTENANCE & WHATSAPP REDIRECT ================= */
  const handleReportDamage = async (e) => {
    e.preventDefault();
    if (leases.length === 0) return alert("You must have an active linked lease to file tickets.");

    setSubmittingTicket(true);
    const activeLease = leases[0];

    const formData = new FormData();
    formData.append("title", ticketTitle);
    formData.append("description", ticketDesc);
    formData.append("property", activeLease.unit?.property?.id || activeLease.property?.id || "");
    formData.append("unit", activeLease.unit?.id || "");
    if (ticketFile) {
      formData.append("damage_photo", ticketFile);
    }

    try {
      await API.post("/maintenance/requests/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Maintenance ticket successfully logged in system!");

      const landlordPhone = "254700000000"; 
      const messageText = `🚨 *NEW DAMAGE REPORT* 🚨\n\n*Tenant:* ${user.first_name} ${user.last_name}\n*Issue:* ${ticketTitle}\n*Details:* ${ticketDesc}\n\nLogged in the PMS portal. Please review the profile dashboard image upload link.`;
      
      const whatsappUrl = `https://wa.me/${landlordPhone}?text=${encodeURIComponent(messageText)}`;
      window.open(whatsappUrl, "_blank");

      setTicketTitle("");
      setTicketDesc("");
      setTicketFile(null);
      fetchData(false);
    } catch (err) {
      console.error("❌ Failed to post damage entry payload:", err);
      if (err.response && err.response.data) {
        const serverErrors = err.response.data;
        if (typeof serverErrors === "object") {
          const errorDetails = Object.entries(serverErrors)
            .map(([field, messages]) => `${field.toUpperCase()}: ${Array.isArray(messages) ? messages.join(" ") : messages}`)
            .join("\n");
          alert(`❌ Form Rejection (HTTP 400 Bad Request):\n\n${errorDetails}`);
        } else {
          alert(`❌ Server Configuration Exception: ${JSON.stringify(serverErrors)}`);
        }
      } else {
        alert("❌ Error reporting maintenance issue. Connection dropped or gateway unresolvable.");
      }
    } finally {
      setSubmittingTicket(false);
    }
  };

  /* ================= TENANT PROGRESS TRACKING MUTATIONS ================= */
  const handleUpdateTicketStatus = async (id, targetStatus) => {
    const confirmationMessages = {
      "IN_PROGRESS": "Confirm you want to flag this ticket as actively IN PROGRESS?",
      "COMPLETED": "Mark this issue as complete? This notifies management for inspection.",
      "VERIFIED": "Confirm this vendor maintenance task is completed up to your standards?"
    };

    if (!window.confirm(confirmationMessages[targetStatus] || `Change task status to ${targetStatus}?`)) return;

    setUpdatingStatus(true);
    try {
      await API.patch(`/maintenance/requests/${id}/`, { status: targetStatus });
      alert(`Status updated to ${targetStatus.replace(/_/g, " ")} successfully!`);
      await fetchData(false);
    } catch (err) {
      console.error("Progress transformation error handshake:", err);
      alert(err.response?.data?.error || "Failed to submit progress mutation. Check API permissions.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  /* ================= TERMINATE LEASE ROUTINE ================= */
  const handleTerminate = async (leaseId) => {
    if (!isAdminOrOwner) return;
    if (!window.confirm("Are you sure you want to terminate this lease?")) return;
    try {
      await API.post(`/leases/${leaseId}/terminate/`);
      fetchData(true);
    } catch (error) {
      alert(error.response?.data?.error || "Failed to terminate lease.");
    }
  };

  /* ================= HELPER BADGE CLASS CONVERSIONS ================= */
  const getStatusClass = (status) => `status ${status?.toLowerCase().replace(/_/g, "-").replace(/ /g, "-") || "pending"}`;
  const getPriorityClass = (priority) => `priority ${priority?.toLowerCase() || "medium"}`;
  const getPaymentStatusClass = (status) => `payment-status ${status?.toLowerCase() || "unpaid"}`;

  /* ================= SORT MANAGEMENT SYSTEM ================= */
  const handleSort = (field) => {
    setPaymentSort((prev) => ({
      ...prev,
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

  /* ================= CALCULATION CARD COMPILATIONS ================= */
  const totalRent = leases.reduce((sum, lease) => sum + (parseFloat(lease.rent_amount) || 0), 0);
  const totalPaid = payments
    .filter((p) => p.is_confirmed === true || p.status === "PAID" || p.status === "COMPLETED")
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const outstanding = totalRent - totalPaid;

  /* ================= PAGINATION CONFIG ================= */
  const totalPages = Math.max(1, Math.ceil(requests.length / itemsPerPage));
  const paginatedRequests = requests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return <p className="loading">Loading dashboard profile...</p>;

  if (user?.role === "TENANT" && leases.length === 0) {
    return (
      <div className="unlinked-tenant-container">
        <div className="unlinked-card">
          <h2>Welcome to Your Portal, {user.first_name || "Tenant"}!</h2>
          <p className="unlinked-notice">
            Your account setup is complete. However, your dashboard metrics and lease details will remain inactive until your landlord links your profile to your physical unit.
          </p>
          <div className="unlinked-email-box">
            <span className="email-label">Provide this registration email to your landlord:</span>
            <br />
            <strong className="email-value">{user.email}</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tenant-dashboard">
      
      {/* 🚀 AUTOMATED REAL-TIME VERIFICATION ALERT CARD */}
      {isPolling && (
        <div className="alert alert-warning processing-banner" style={{ background: "#fff3cd", borderLeft: "5px solid #ffc107", padding: "15px", marginBottom: "20px", borderRadius: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="spinner-mini" style={{ border: "3px solid #f3f3f3", borderTop: "3px solid #ffc107", borderRadius: "50%", width: "20px", height: "20px", animation: "spin 1s linear infinite" }}></div>
            <div>
              <strong>⚡ Instant Activation STK Prompt Triggered!</strong>
              <p style={{ margin: "5px 0 0 0", color: "#664d03" }}>Please input your M-Pesa PIN on your mobile device. The system is listening in real time to activate your lease instantly upon transaction completion.</p>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUMMARY CARD COUNTERS ================= */}
      <div className="summary-grid">
        <div className="summary-card">
          <h4>Total Rent Obligations</h4>
          <h2>KSh {totalRent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
        </div>
        <div className="summary-card">
          <h4>Total Paid Amount</h4>
          <h2 className="green">KSh {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
        </div>
        <div className="summary-card">
          <h4>Outstanding Balance</h4>
          <h2 className="red">KSh {outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
        </div>
      </div>

      {/* ================= 💳 UNPAID INVOICES / BILLING SECTION ================= */}
      <div className="card outstanding-invoices-card">
        <h3>Outstanding Pending Invoices</h3>
        <div className="responsive-table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Invoice Ref</th>
                <th>Description</th>
                <th>Amount Due</th>
                <th>Due Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {unpaidInvoices.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-data-msg">🎉 All rent payments are fully settled! No pending balances.</td>
                </tr>
              ) : (
                unpaidInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="bold-text">#INV-{inv.id}</td>
                    <td className="muted-text">{inv.description || "Monthly Rental Charge"}</td>
                    <td className="amount-due-text">KSh {parseFloat(inv.balance_due || inv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="muted-text">{inv.due_date}</td>
                    <td>
                      <button 
                        onClick={() => setSelectedInvoice(inv)}
                        className="mpesa-pay-btn"
                        disabled={isPolling}
                      >
                        <FaCreditCard size={12} /> {isPolling ? "Awaiting Callback..." : "Pay via M-Pesa"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= POPUP OVERLAY MODAL WINDOW (M-PESA) ================= */}
      {selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button onClick={() => setSelectedInvoice(null)} className="modal-close-btn">
              <FaTimes />
            </button>
            <h3 className="modal-title"><FaCreditCard /> Lipa Na M-Pesa Online</h3>
            
            <div className="modal-summary-box">
              <p><strong>Reference:</strong> #INV-{selectedInvoice.id}</p>
              <p><strong>Total Charge:</strong> KSh {parseFloat(selectedInvoice.balance_due || selectedInvoice.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>

            <form onSubmit={handleInitiateSTK} className="modal-form">
              <div className="form-group">
                <label className="input-label">Safaricom Handset Phone Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. 0712345678 or 254712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="modal-input"
                />
              </div>

              {paymentMessage && (
                <div className={`payment-feedback-msg ${paymentMessage.includes("❌") ? "error-msg" : "success-msg"}`}>
                  {paymentMessage}
                </div>
              )}

              <div className="modal-action-buttons">
                <button type="button" onClick={() => setSelectedInvoice(null)} disabled={processingPayment} className="btn-cancel">Cancel</button>
                <button type="submit" disabled={processingPayment} className="btn-submit-payment">
                  {processingPayment ? "Requesting STK Pushes..." : "Send Payment Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 🔧 POPUP OVERLAY MODAL WINDOW (TICKET DETAILS & PROGRESS INTERFACE) ================= */}
      {selectedTicket && (
        <div className="modal-overlay">
          <div className="modal-content maintenance-details-modal">
            <button onClick={() => setSelectedTicket(null)} className="modal-close-btn">
              <FaTimes />
            </button>
            <h3 className="modal-title"><FaTools /> Maintenance Job Progress</h3>
            
            <div className="modal-details-body" style={{ textAlign: "left", marginTop: "15px" }}>
              <p style={{ margin: "8px 0" }}><strong>Issue Title:</strong> {selectedTicket.title}</p>
              <p style={{ margin: "8px 0" }}><strong>Description:</strong> {selectedTicket.description}</p>
              <p style={{ margin: "8px 0" }}><strong>Reported Date:</strong> {selectedTicket.created_at ? selectedTicket.created_at.split("T")[0] : selectedTicket.date || "N/A"}</p>
              
              <div style={{ display: "flex", gap: "15px", margin: "12px 0" }}>
                <span>Status: <strong className={getStatusClass(selectedTicket.status)}>{selectedTicket.status?.replace(/_/g, " ")}</strong></span>
                <span>Priority: <strong className={getPriorityClass(selectedTicket.priority)}>{selectedTicket.priority}</strong></span>
              </div>

              {selectedTicket.damage_photo && (
                <div style={{ margin: "15px 0" }}>
                  <strong>Uploaded Visual Proof:</strong>
                  <img 
                    src={selectedTicket.damage_photo} 
                    alt="Damage Evidence" 
                    style={{ width: "100%", maxHeight: "200px", objectFit: "cover", borderRadius: "6px", marginTop: "5px", border: "1px solid #ddd" }}
                  />
                </div>
              )}

              <hr style={{ margin: "20px 0", border: "0", borderTop: "1px solid #eee" }} />

              {/* 📈 REAL-TIME TRACKING PROGRESS FLOWBAR BAR */}
              <h4 style={{ marginBottom: "15px", color: "#2c3e50" }}>Progress Pipeline</h4>
              <div className="progress-pipeline-wrapper" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", background: "#f8f9fa", padding: "12px", borderRadius: "8px" }}>
                {["PENDING", "IN_PROGRESS", "COMPLETED", "VERIFIED"].map((stage, idx, arr) => {
                  const stagesMap = { PENDING: 0, IN_PROGRESS: 1, COMPLETED: 2, VERIFIED: 3 };
                  const currentIdx = stagesMap[selectedTicket.status] ?? 0;
                  const isPassed = idx <= currentIdx;
                  
                  return (
                    <React.Fragment key={stage}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                        <div style={{
                          width: "24px", height: "24px", borderRadius: "50%", 
                          background: isPassed ? "#2ecc71" : "#dcdde1", color: "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "11px", fontWeight: "bold"
                        }}>
                          {idx + 1}
                        </div>
                        <span style={{ fontSize: "10px", marginTop: "4px", color: isPassed ? "#2c3e50" : "#7f8c8d", fontWeight: isPassed ? "600" : "4px" }}>
                          {stage.replace(/_/g, " ")}
                        </span>
                      </div>
                      {idx < arr.length - 1 && (
                        <div style={{ flex: 1, height: "3px", background: idx < currentIdx ? "#2ecc71" : "#dcdde1", margin: "0 4px", transform: "translateY(-8px)" }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* 🛠️ DISPATCHED VENDOR TIMELINE BOX */}
              <h4 style={{ marginBottom: "10px", color: "#2c3e50" }}>Dispatched Vendor Assignment</h4>
              {selectedTicket.vendor ? (
                <div className="vendor-info-box" style={{ background: "#f8f9fa", padding: "15px", borderRadius: "6px", borderLeft: "4px solid #3498db" }}>
                  <p style={{ margin: "5px 0" }}><strong>Service Provider:</strong> {selectedTicket.vendor.name || `${selectedTicket.vendor.first_name || ""} ${selectedTicket.vendor.last_name || ""}`.trim() || "Assigned Contractor"}</p>
                  {(selectedTicket.vendor.phone_number || selectedTicket.vendor.phone) && (
                    <p style={{ margin: "5px 0" }}><strong>Contact Line:</strong> {selectedTicket.vendor.phone_number || selectedTicket.vendor.phone}</p>
                  )}
                  <p style={{ margin: "5px 0" }}><strong>Resolution Updates:</strong> {selectedTicket.vendor_notes || selectedTicket.notes || "No operational log notes filed yet."}</p>
                  
                  {/* Interactive Status Actions for Tenant Context */}
                  <div className="tenant-tracking-actions" style={{ marginTop: "15px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {selectedTicket.status === "PENDING" && (
                      <button 
                        type="button"
                        disabled={updatingStatus}
                        className="btn-status-track"
                        style={{ background: "#3498db", color: "#fff", border: "0", padding: "8px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}
                        onClick={() => handleUpdateTicketStatus(selectedTicket.id, "IN_PROGRESS")}
                      >
                        {updatingStatus ? <FaSpinner className="spin" /> : "Mark as In Progress"}
                      </button>
                    )}

                    {(selectedTicket.status === "PENDING" || selectedTicket.status === "IN_PROGRESS") && (
                      <button 
                        type="button"
                        disabled={updatingStatus}
                        className="btn-status-track"
                        style={{ background: "#2ecc71", color: "#fff", border: "0", padding: "8px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}
                        onClick={() => handleUpdateTicketStatus(selectedTicket.id, "COMPLETED")}
                      >
                        {updatingStatus ? <FaSpinner className="spin" /> : "Mark as Completed"}
                      </button>
                    )}
                    
                    {(selectedTicket.status === "COMPLETED" || selectedTicket.status === "COMPLETED_BY_VENDOR") && (
                      <button 
                        type="button"
                        disabled={updatingStatus}
                        className="btn-status-track"
                        style={{ background: "#27ae60", color: "#fff", border: "0", padding: "8px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}
                        onClick={() => handleUpdateTicketStatus(selectedTicket.id, "VERIFIED")}
                      >
                        {updatingStatus ? <FaSpinner className="spin" /> : "Verify Standards Implementation"}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p style={{ fontStyle: "italic", color: "#7f8c8d", background: "#fdfefe", padding: "10px", borderRadius: "4px", border: "1px dashed #bdc3c7" }}>
                  ⏳ Your landlord is working to dispatch an on-site technician. Please check updates shortly.
                </p>
              )}
            </div>

            <div className="modal-action-buttons" style={{ marginTop: "20px" }}>
              <button type="button" onClick={() => setSelectedTicket(null)} className="btn-cancel" style={{ width: "100%" }}>Close Details View</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= LOG NEW DAMAGE / MAINTENANCE TICKET FORM ================= */}
      <div className="card damage-reporting-card">
        <h3>Report New Asset Damage / Maintenance</h3>
        <form onSubmit={handleReportDamage} className="damage-form">
          <div className="form-row">
            <input 
              type="text" 
              placeholder="Title (e.g. Broken Bathroom Faucet)" 
              value={ticketTitle} 
              onChange={(e) => setTicketTitle(e.target.value)} 
              required 
              className="text-input"
            />
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setTicketFile(e.target.files[0])} 
              className="file-input"
            />
          </div>
          <textarea 
            placeholder="Provide a description of the issue to the maintenance logs network..." 
            value={ticketDesc} 
            onChange={(e) => setTicketDesc(e.target.value)} 
            required 
            rows="3"
            className="textarea-input"
          />
          <button type="submit" disabled={submittingTicket} className="whatsapp-submit-btn">
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
              <div className="badge-container">
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
          <table className="dashboard-table">
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
                  <td colSpan="4" className="no-data">No logs recorded.</td>
                </tr>
              ) : (
                paginatedRequests.map((req) => (
                  <tr key={req.id}>
                    <td>{req.title}</td>
                    <td>
                      <span className={getStatusClass(req.status)}>{req.status?.replace(/_/g, " ")}</span>
                    </td>
                    <td>
                      <span className={getPriorityClass(req.priority)}>{req.priority}</span>
                    </td>
                    <td className="action-cell">
                      <FaEye 
                        className="action-icon" 
                        title="View Details & Track Vendor" 
                        onClick={() => setSelectedTicket(req)} 
                      />
                      {(req.status === "COMPLETED" || req.status === "COMPLETED_BY_VENDOR") && (
                        <FaCheckCircle 
                          className="action-icon check-verify-icon" 
                          title="Verify Completion"
                          onClick={() => handleUpdateTicketStatus(req.id, "VERIFIED")}
                        />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {requests.length > itemsPerPage && (
            <div className="pagination-controls">
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
          <table className="dashboard-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("date")} className="sortable-header">
                  Date {paymentSort.field === "date" && (paymentSort.direction === "asc" ? <FaArrowUp /> : <FaArrowDown />)}
                </th>
                <th onClick={() => handleSort("amount")} className="sortable-header">
                  Amount {paymentSort.field === "amount" && (paymentSort.direction === "asc" ? <FaArrowUp /> : <FaArrowDown />)}
                </th>
                <th>Method</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedPayments.length === 0 ? (
                <tr>
                  <td colSpan="4" className="no-data">No transaction history.</td>
                </tr>
              ) : (
                sortedPayments.map((pay) => (
                  <tr key={pay.id}>
                    <td>{pay.date || pay.created_at?.split("T")[0]}</td>
                    <td>KSh {parseFloat(pay.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>{pay.payment_method || pay.method || "MPESA"}</td>
                    <td>
                      <span className={pay.is_confirmed ? "payment-status paid" : getPaymentStatusClass(pay.status)}>
                        {pay.is_confirmed ? "CONFIRMED" : (pay.status || "PENDING")}
                      </span>
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