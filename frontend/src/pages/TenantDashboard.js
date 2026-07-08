import React, { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import { 
  FaEye, FaTrash, FaArrowUp, FaArrowDown, 
  FaChevronLeft, FaChevronRight, FaCheckCircle, 
  FaWhatsapp, FaCreditCard, FaTimes, FaTools, FaSpinner, FaPlus 
} from "react-icons/fa";
import "../styles/TenantDashboard.css";

const TenantDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const isAdminOrOwner = user?.role === "ADMIN" || user?.role === "OWNER";

  // Data States
  const [leases, setLeases] = useState([]);
  const [requests, setRequests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Visibility States
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Form & Action States
  const [phoneNumber, setPhoneNumber] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [isPolling, setIsPolling] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // New Maintenance Ticket Form State
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDesc, setTicketDesc] = useState("");
  const [ticketFile, setTicketFile] = useState(null);
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [paymentSort, setPaymentSort] = useState({ field: "date", direction: "desc" });
  const itemsPerPage = 5;

  /* ================= FETCH DATA FROM SERVER ================= */
  const fetchData = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const results = await Promise.allSettled([
        API.get("/leases/tenant/"),
        API.get("/maintenance/requests/"),
        API.get("/payments/history/"), 
        API.get("/payments/invoices/"), 
      ]);

      if (results[0].status === "fulfilled") setLeases(results[0].value.data);
      if (results[2].status === "fulfilled") setPayments(results[2].value.data);

      if (results[1].status === "fulfilled") {
        const ticketData = results[1].value.data;
        setRequests(ticketData);
        if (selectedTicket) {
          const updatedTicket = ticketData.find(t => t.id === selectedTicket.id);
          if (updatedTicket) setSelectedTicket(updatedTicket);
        }
      }

      if (results[3].status === "fulfilled") {
        const rawInvoices = Array.isArray(results[3].value.data) 
          ? results[3].value.data 
          : results[3].value.data.results || [];

        const activeUnpaid = rawInvoices.filter(inv => {
          const statusStr = String(inv.status || "").toUpperCase();
          return statusStr !== "PAID" && statusStr !== "COMPLETED";
        });
        setUnpaidInvoices(activeUnpaid);

        // Turn on auto-refresh if an activation/initial invoice is pending
        const hasPendingActivation = activeUnpaid.some(inv => 
          String(inv.description || "").toLowerCase().includes("activation") || 
          String(inv.description || "").toLowerCase().includes("initial")
        );
        setIsPolling(hasPendingActivation);
      } else {
        setIsPolling(false);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [selectedTicket]);

  useEffect(() => {
    fetchData(true);
  }, []);

  // Long-polling check to auto-update when M-Pesa completes
  useEffect(() => {
    let intervalId;
    if (isPolling) {
      intervalId = setInterval(() => {
        fetchData(false); 
      }, 4000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPolling, fetchData]);

  /* ================= M-PESA STK PUSH LOGIC ================= */
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
      const errorMsg = err.response?.data?.error || "Payment connection failed. Please try again.";
      setPaymentMessage(`❌ ${errorMsg}`);
    } finally {
      setProcessingPayment(false);
    }
  };

  /* ================= NEW MAINTENANCE REQUEST MODAL SUBMIT ================= */
  const handleReportDamage = async (e) => {
    e.preventDefault();
    if (leases.length === 0) return alert("You must have an active lease to report maintenance issues.");

    setSubmittingTicket(true);
    const activeLease = leases[0];

    const formData = new FormData();
    formData.append("title", ticketTitle);
    formData.append("description", ticketDesc);
    formData.append("property", activeLease.unit?.property?.id || activeLease.property?.id || "");
    formData.append("unit", activeLease.unit?.id || "");
    if (ticketFile) formData.append("damage_photo", ticketFile);

    try {
      await API.post("/maintenance/requests/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Maintenance request submitted successfully.");

      // Optional: Open Landlord WhatsApp notification
      const landlordPhone = "254700000000"; 
      const messageText = `🚨 *NEW MAINTENANCE REQUEST* 🚨\n\n*Tenant:* ${user.first_name} ${user.last_name}\n*Issue:* ${ticketTitle}\n*Details:* ${ticketDesc}`;
      const whatsappUrl = `https://wa.me/${landlordPhone}?text=${encodeURIComponent(messageText)}`;
      window.open(whatsappUrl, "_blank");

      // Reset Form and close modal
      setTicketTitle("");
      setTicketDesc("");
      setTicketFile(null);
      setIsReportModalOpen(false);
      fetchData(false);
    } catch (err) {
      console.error("Error submitting ticket:", err);
      alert("Could not save maintenance request. Please verify your form values.");
    } finally {
      setSubmittingTicket(false);
    }
  };

  /* ================= UPDATE TICKET STATUS ================= */
  const handleUpdateTicketStatus = async (id, targetStatus) => {
    const confirmationMessages = {
      "IN_PROGRESS": "Mark this request as In Progress?",
      "COMPLETED": "Mark this issue as Completed? Management will be notified to inspect.",
      "VERIFIED": "Confirm that this maintenance work has been finished to your satisfaction?"
    };

    if (!window.confirm(confirmationMessages[targetStatus] || `Change status to ${targetStatus}?`)) return;

    setUpdatingStatus(true);
    try {
      await API.patch(`/maintenance/requests/${id}/`, { status: targetStatus });
      await fetchData(false);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update status.");
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

  /* ================= LAYOUT SORTING & STYLING HELPERS ================= */
  const handleSort = (field) => {
    setPaymentSort((prev) => ({
      ...prev,
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getStatusClass = (status) => `status ${status?.toLowerCase().replace(/_/g, "-").replace(/ /g, "-") || "pending"}`;
  const getPriorityClass = (priority) => `priority ${priority?.toLowerCase() || "medium"}`;

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

  const totalRent = leases.reduce((sum, lease) => sum + (parseFloat(lease.rent_amount) || 0), 0);
  const totalPaid = payments
    .filter((p) => p.is_confirmed === true || p.status === "PAID" || p.status === "COMPLETED")
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const outstanding = totalRent - totalPaid;

  const totalPages = Math.max(1, Math.ceil(requests.length / itemsPerPage));
  const paginatedRequests = requests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <p className="loading">Loading your dashboard...</p>;

  if (user?.role === "TENANT" && leases.length === 0) {
    return (
      <div className="unlinked-tenant-container">
        <div className="unlinked-card">
          <h2>Welcome, {user.first_name || "Tenant"}!</h2>
          <p className="unlinked-notice">
            Your profile has been created successfully. Your dashboard and payment history will become active as soon as your landlord links your account to your rental unit.
          </p>
          <div className="unlinked-email-box">
            <span className="email-label">Provide this email to your landlord:</span>
            <br />
            <strong className="email-value">{user.email}</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tenant-dashboard">
      
      {/* 📱 ACTIVE MPESA STK PROMPT LISTENER NOTICE */}
      {isPolling && (
        <div className="alert alert-warning processing-banner" style={{ background: "#fff3cd", borderLeft: "5px solid #ffc107", padding: "15px", marginBottom: "20px", borderRadius: "4px" }}>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ border: "3px solid #f3f3f3", borderTop: "3px solid #ffc107", borderRadius: "50%", width: "20px", height: "20px", animation: "spin 1s linear infinite" }}></div>
            <div>
              <strong>M-Pesa Payment Request Sent</strong>
              <p style={{ margin: "5px 0 0 0", color: "#664d03", fontSize: "14px" }}>Check your mobile phone for the M-Pesa PIN prompt. The system will automatically refresh your dashboard once paid.</p>
            </div>
          </div>
        </div>
      )}

      {/* ================= ACCOUNT ACCOUNT METRICS OVERVIEW ================= */}
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

      {/* ================= UNPAID INVOICES SECTION ================= */}
      <div className="card outstanding-invoices-card">
        <h3>Pending Invoices</h3>
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
                  <td colSpan="5" className="no-data-msg">🎉 All invoices are fully settled! No pending balances due.</td>
                </tr>
              ) : (
                unpaidInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="bold-text">#INV-{inv.id}</td>
                    <td className="muted-text">{inv.description || "Monthly Rent"}</td>
                    <td className="amount-due-text">KSh {parseFloat(inv.balance_due || inv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="muted-text">{inv.due_date}</td>
                    <td>
                      <button 
                        onClick={() => setSelectedInvoice(inv)}
                        className="mpesa-pay-btn"
                        disabled={isPolling}
                      >
                        <FaCreditCard size={12} /> {isPolling ? "Processing..." : "Pay via M-Pesa"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* ================= LEASES VIEWBOX ================= */}
        <div className="card">
          <h3>Lease Information</h3>
          {leases.map((lease) => (
            <div key={lease.id} className="lease-box">
              <p><strong>Property:</strong> {lease.unit?.property?.name || "Unassigned Property"}</p>
              <p><strong>Unit Number:</strong> {lease.unit?.unit_number || "N/A"}</p>
              <p><strong>Start Date:</strong> {lease.start_date}</p>
              <p><strong>End Date:</strong> {lease.end_date}</p>
              <div className="badge-container" style={{ margin: "10px 0" }}>
                <span className={getStatusClass(lease.status)}>{lease.status}</span>
              </div>
              {isAdminOrOwner && lease.status !== "TERMINATED" && (
                <button className="terminate-btn" onClick={() => handleTerminate(lease.id)}>
                  <FaTrash /> Terminate Lease
                </button>
              )}
            </div>
          ))}
        </div>

        {/* ================= MAINTENANCE LIST PANEL ================= */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h3>Maintenance Requests</h3>
            <button onClick={() => setIsReportModalOpen(true)} className="mpesa-pay-btn" style={{ background: "#3498db" }}>
              <FaPlus /> Report Damage
            </button>
          </div>
          
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
                  <td colSpan="4" className="no-data">No records found.</td>
                </tr>
              ) : (
                paginatedRequests.map((req) => (
                  <tr key={req.id}>
                    <td>{req.title}</td>
                    <td><span className={getStatusClass(req.status)}>{req.status?.replace(/_/g, " ")}</span></td>
                    <td><span className={getPriorityClass(req.priority)}>{req.priority}</span></td>
                    <td className="action-cell">
                      <FaEye className="action-icon" title="View Details" onClick={() => setSelectedTicket(req)} />
                      {(req.status === "COMPLETED" || req.status === "COMPLETED_BY_VENDOR") && (
                        <FaCheckCircle className="action-icon check-verify-icon" title="Verify Work" onClick={() => handleUpdateTicketStatus(req.id, "VERIFIED")} />
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

        {/* ================= PAYMENT HISTORY LEDGER ================= */}
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
                <th>Payment Method</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedPayments.length === 0 ? (
                <tr>
                  <td colSpan="4" className="no-data">No previous transactions recorded.</td>
                </tr>
              ) : (
                sortedPayments.map((p) => (
                  <tr key={p.id}>
                    <td>{p.date || p.created_at?.split("T")[0] || "N/A"}</td>
                    <td className="bold-text">KSh {parseFloat(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>{p.payment_method || "M-Pesa"}</td>
                    <td>
                      <span className={p.is_confirmed || p.status === "PAID" ? "status active" : "status pending"}>
                        {p.status || (p.is_confirmed ? "PAID" : "PENDING")}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: LIPA NA M-PESA CHECKOUT ================= */}
      {selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button onClick={() => setSelectedInvoice(null)} className="modal-close-btn"><FaTimes /></button>
            <h3 className="modal-title"><FaCreditCard /> Lipa Na M-Pesa</h3>
            
            <div className="modal-summary-box">
              <p><strong>Invoice:</strong> #INV-{selectedInvoice.id}</p>
              <p><strong>Amount:</strong> KSh {parseFloat(selectedInvoice.balance_due || selectedInvoice.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>

            <form onSubmit={handleInitiateSTK} className="modal-form">
              <div className="form-group">
                <label className="input-label">M-Pesa Phone Number</label>
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
                  {processingPayment ? "Sending Prompt..." : "Pay Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REPORT MAINTENANCE / DAMAGE ================= */}
      {isReportModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button onClick={() => setIsReportModalOpen(false)} className="modal-close-btn"><FaTimes /></button>
            <h3 className="modal-title"><FaTools /> Report Maintenance / Damage</h3>
            
            <form onSubmit={handleReportDamage} className="modal-form" style={{ textAlign: "left", marginTop: "15px" }}>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label className="input-label">Issue Title</label>
                <input 
                  type="text" 
                  placeholder="e.g., Broken bathroom tap, water leakage" 
                  value={ticketTitle} 
                  onChange={(e) => setTicketTitle(e.target.value)} 
                  required 
                  className="modal-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label className="input-label">Detailed Description</label>
                <textarea 
                  placeholder="Please describe the issue so the technician comes prepared..." 
                  value={ticketDesc} 
                  onChange={(e) => setTicketDesc(e.target.value)} 
                  required 
                  rows="4"
                  className="modal-input"
                  style={{ resize: "vertical" }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label className="input-label">Upload Picture of Damage (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setTicketFile(e.target.files[0])} 
                  className="modal-input"
                  style={{ padding: "8px" }}
                />
              </div>

              <div className="modal-action-buttons">
                <button type="button" onClick={() => setIsReportModalOpen(false)} disabled={submittingTicket} className="btn-cancel">Cancel</button>
                <button type="submit" disabled={submittingTicket} className="btn-submit-payment" style={{ background: "#27ae60" }}>
                  {submittingTicket ? "Submitting..." : "Submit & Notify Landlord"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: TICKET TRACKING DETAILS ================= */}
      {selectedTicket && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button onClick={() => setSelectedTicket(null)} className="modal-close-btn"><FaTimes /></button>
            <h3 className="modal-title"><FaTools /> Request Information</h3>
            
            <div className="modal-details-body" style={{ textAlign: "left", marginTop: "15px" }}>
              <p><strong>Title:</strong> {selectedTicket.title}</p>
              <p><strong>Description:</strong> {selectedTicket.description}</p>
              <p><strong>Reported On:</strong> {selectedTicket.created_at ? selectedTicket.created_at.split("T")[0] : "N/A"}</p>
              
              <div style={{ display: "flex", gap: "15px", margin: "10px 0" }}>
                <span>Status: <strong className={getStatusClass(selectedTicket.status)}>{selectedTicket.status?.replace(/_/g, " ")}</strong></span>
                <span>Priority: <strong className={getPriorityClass(selectedTicket.priority)}>{selectedTicket.priority}</strong></span>
              </div>

              {selectedTicket.damage_photo && (
                <div style={{ margin: "15px 0" }}>
                  <strong>Uploaded Image:</strong>
                  <img 
                    src={selectedTicket.damage_photo} 
                    alt="Damage Evidence" 
                    style={{ width: "100%", maxHeight: "200px", objectFit: "cover", borderRadius: "6px", marginTop: "5px", border: "1px solid #ddd" }}
                  />
                </div>
              )}

              <hr style={{ margin: "15px 0", border: "0", borderTop: "1px solid #eee" }} />

              <h4 style={{ marginBottom: "10px" }}>Assigned Technician / Vendor</h4>
              {selectedTicket.vendor ? (
                <div style={{ background: "#f8f9fa", padding: "12px", borderRadius: "6px", borderLeft: "4px solid #3498db" }}>
                  <p style={{ margin: "4px 0" }}><strong>Name:</strong> {selectedTicket.vendor.name || `${selectedTicket.vendor.first_name || ""} ${selectedTicket.vendor.last_name || ""}`.trim()}</p>
                  {(selectedTicket.vendor.phone_number || selectedTicket.vendor.phone) && (
                    <p style={{ margin: "4px 0" }}><strong>Phone Contact:</strong> {selectedTicket.vendor.phone_number || selectedTicket.vendor.phone}</p>
                  )}
                  <p style={{ margin: "4px 0" }}><strong>Technician Notes:</strong> {selectedTicket.vendor_notes || "No notes added yet."}</p>
                  
                  <div style={{ marginTop: "15px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {selectedTicket.status === "PENDING" && (
                      <button type="button" disabled={updatingStatus} style={{ background: "#3498db", color: "#fff", border: "0", padding: "8px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }} onClick={() => handleUpdateTicketStatus(selectedTicket.id, "IN_PROGRESS")}>
                        Mark In Progress
                      </button>
                    )}
                    {(selectedTicket.status === "PENDING" || selectedTicket.status === "IN_PROGRESS") && (
                      <button type="button" disabled={updatingStatus} style={{ background: "#2ecc71", color: "#fff", border: "0", padding: "8px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }} onClick={() => handleUpdateTicketStatus(selectedTicket.id, "COMPLETED")}>
                        Mark Completed
                      </button>
                    )}
                    {(selectedTicket.status === "COMPLETED" || selectedTicket.status === "COMPLETED_BY_VENDOR") && (
                      <button type="button" disabled={updatingStatus} style={{ background: "#27ae60", color: "#fff", border: "0", padding: "8px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }} onClick={() => handleUpdateTicketStatus(selectedTicket.id, "VERIFIED")}>
                        Verify & Close Request
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p style={{ fontStyle: "italic", color: "#7f8c8d", background: "#fdfefe", padding: "10px", borderRadius: "4px", border: "1px dashed #bdc3c7" }}>
                  ⏳ Waiting for administration to assign a technician to this task.
                </p>
              )}
            </div>

            <div style={{ marginTop: "20px" }}>
              <button type="button" onClick={() => setSelectedTicket(null)} className="btn-cancel" style={{ width: "100%" }}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TenantDashboard;