import React, { useEffect, useState } from "react";
import API from "../services/api";
import { FaFileInvoiceDollar, FaRegClock, FaCheckCircle, FaSpinner } from "react-icons/fa";

const TenantInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [phoneNumbers, setPhoneNumbers] = useState({});
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });

  const fetchInvoices = async () => {
    try {
      const res = await API.get("payments/invoices/");
      setInvoices(res.data);
    } catch (err) {
      console.error("Failed to fetch billing ledger:", err);
      showBanner("Failed to retrieve outstanding statements. Please refresh.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handlePhoneChange = (invoiceId, value) => {
    setPhoneNumbers((prev) => ({
      ...prev,
      [invoiceId]: value,
    }));
  };

  const showBanner = (text, type) => {
    setStatusMessage({ text, type });
    if (type !== "pending") {
      setTimeout(() => setStatusMessage({ text: "", type: "" }), 7000);
    }
  };

  // 📲 Helper to cleanly format numbers to 254XXXXXXXXX format for Daraja API
  const normalizePhoneNumber = (phone) => {
    let cleaned = phone.replace(/\D/g, ""); // strip non-numeric characters
    if (cleaned.startsWith("0")) {
      cleaned = "254" + cleaned.slice(1);
    } else if (cleaned.startsWith("+")) {
      cleaned = cleaned.replace("+", "");
    } else if (!cleaned.startsWith("254") && cleaned.length === 9) {
      cleaned = "254" + cleaned;
    }
    return cleaned;
  };

  const handlePayment = async (invoiceId, balanceDue) => {
    const rawPhone = phoneNumbers[invoiceId] || "";
    
    if (!rawPhone.trim()) {
      showBanner("Please provide an active M-Pesa phone number to initiate payment.", "error");
      return;
    }

    const formattedPhone = normalizePhoneNumber(rawPhone);
    if (formattedPhone.length !== 12 || !formattedPhone.startsWith("254")) {
      showBanner("Invalid Safaricom mobile number format. Use 07XXXXXXXX or 01XXXXXXXX.", "error");
      return;
    }

    setProcessingId(invoiceId);
    showBanner("Sending STK Push initialization packet...", "info");

    try {
      // ✅ Hits your production endpoint cleanly mapping the parameters
      const res = await API.post(`payments/invoices/${invoiceId}/pay/`, {
        amount: balanceDue,
        payment_method: "MPESA",
        phone_number: formattedPhone
      });

      if (res.data.status === "PENDING_PIN" || res.data.Status === "PENDING") {
        showBanner("📲 STK Push sent! Please enter your M-Pesa PIN on your phone now.", "pending");
        
        // Polling loop buffer fallback delay for backend webhook sync
        setTimeout(async () => {
          await fetchInvoices();
          showBanner("Ledger statement updated successfully via Safaricom logs.", "success");
        }, 12000);
        
      } else {
        showBanner("Transaction processed successfully.", "success");
        fetchInvoices();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Transaction could not be initialized.";
      showBanner(errorMsg, "error");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
        {/* Inject CSS Keyframes directly to run animations inside inline objects */}
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
          .spinning-loader { animation: spin 1s linear infinite; }
          .pulsing-loader { animation: pulse 1.5s infinite; }
        `}</style>
        <FaSpinner className="spinning-loader" style={{ fontSize: "24px", marginBottom: "10px" }} />
        <p>Loading financial balances...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0", maxWidth: "850px", margin: "0 auto" }}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .pulsing-loader { animation: pulse 1.5s infinite; }
      `}</style>

      {/* Dynamic Status Notifications Banner */}
      {statusMessage.text && (
        <div style={{
          padding: "12px 16px", borderRadius: "6px", marginBottom: "20px", fontSize: "14px", fontWeight: "500", display: "flex", alignItems: "center", gap: "10px",
          background: statusMessage.type === "error" ? "#fee2e2" : statusMessage.type === "success" ? "#dcfce7" : "#e0f2fe",
          color: statusMessage.type === "error" ? "#991b1b" : statusMessage.type === "success" ? "#166534" : "#0369a1",
          border: `1px solid ${statusMessage.type === "error" ? "#fca5a5" : statusMessage.type === "success" ? "#86efac" : "#7dd3fc"}`
        }}>
          {statusMessage.type === "success" ? <FaCheckCircle /> : statusMessage.type === "pending" ? <FaRegClock className="pulsing-loader" /> : "🔔"}
          {statusMessage.text}
        </div>
      )}

      <h3 style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 0 20px 0", color: "#1e293b" }}>
        <FaFileInvoiceDollar color="#2563eb" /> Your Outstanding Statements
      </h3>

      {invoices.length === 0 ? (
        <p style={{ fontStyle: "italic", color: "#64748b", textAlign: "center", padding: "30px", background: "#f8fafc", borderRadius: "6px", border: "1px dashed #cbd5e1" }}>
          No active statements generated for your account.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "15px" }}>
          {invoices.map((inv) => {
            const balance = parseFloat(inv.balance_due || 0);
            const isPaid = inv.status === "PAID" || balance <= 0;

            return (
              <div key={inv.id} style={{ 
                border: "1px solid #e2e8f0", padding: "15px", borderRadius: "6px", display: "flex", 
                justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px",
                borderLeft: isPaid ? "5px solid #16a34a" : "5px solid #dc2626"
              }}>
                <div style={{ flex: "1", minWidth: "250px" }}>
                  <h4 style={{ margin: "0 0 6px 0", color: "#1e293b", fontSize: "16px" }}>
                    {inv.invoice_type} — {inv.property_name || "Property Asset"} <span style={{ color: "#64748b", fontWeight: "normal" }}>(Unit {inv.unit_number || "N/A"})</span>
                  </h4>
                  <p style={{ margin: "0 0 8px 0", color: "#64748b", fontSize: "13px" }}>Due Date: {inv.due_date}</p>
                  <div style={{ display: "flex", gap: "20px", fontSize: "13px", background: "#f8fafc", padding: "6px 12px", borderRadius: "4px", width: "fit-content" }}>
                    <span><strong style={{ color: "#475569" }}>Billed:</strong> KSh {parseFloat(inv.amount || 0).toLocaleString()}</span>
                    <span><strong style={{ color: "#16a34a" }}>Paid:</strong> KSh {parseFloat(inv.amount_paid || 0).toLocaleString()}</span>
                    <span><strong style={{ color: isPaid ? "#16a34a" : "#dc2626" }}>Balance:</strong> KSh {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px", minWidth: "200px" }}>
                  <span style={{
                    padding: "4px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", letterSpacing: "0.5px",
                    background: isPaid ? "#dcfce7" : "#fee2e2",
                    color: isPaid ? "#166534" : "#991b1b"
                  }}>{inv.status}</span>

                  {!isPaid && (
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input 
                        type="tel" 
                        placeholder="e.g. 0712345678" 
                        value={phoneNumbers[inv.id] || ""}
                        onChange={(e) => handlePhoneChange(inv.id, e.target.value)}
                        style={{ padding: "8px 10px", fontSize: "13px", borderRadius: "4px", border: "1px solid #cbd5e1", width: "150px" }}
                      />
                      <button
                        onClick={() => handlePayment(inv.id, balance)}
                        disabled={processingId !== null}
                        style={{
                          background: processingId === inv.id ? "#64748b" : "#16a34a", 
                          color: "#fff", border: "none", padding: "8px 14px",
                          borderRadius: "4px", cursor: "pointer", fontSize: "13px", fontWeight: "600",
                          transition: "background 0.2s"
                        }}
                      >
                        {processingId === inv.id ? "Sending..." : `Pay KSh ${balance}`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TenantInvoices;