import React, { useEffect, useState } from "react";
import API from "../services/api";
import { FaFileInvoiceDollar, FaWallet, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

const TenantInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");

  const fetchInvoices = async () => {
    try {
      // ✅ Hits our new role-isolated endpoint: GET /api/payments/invoices/
      const res = await API.get("payments/invoices/");
      setInvoices(res.data);
    } catch (err) {
      console.error("Failed to fetch billing ledger:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handlePayment = async (invoiceId, balanceDue) => {
    setProcessingId(invoiceId);
    try {
      // ✅ Hits our custom action endpoint: POST /api/payments/invoices/{id}/pay/
      await API.post(`payments/invoices/${invoiceId}/pay/`, {
        amount: balanceDue,
        payment_method: "MPESA",
        phone_number: phoneNumber || null
      });

      alert("🎉 Payment processed successfully! Checking reconciliation records...");
      fetchInvoices(); // Refresh balances dynamically
    } catch (err) {
      alert(err.response?.data?.error || "Transaction declined.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <p>Loading financial balances...</p>;

  return (
    <div style={{ padding: "20px", background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
      <h3 style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 0 20px 0" }}>
        <FaFileInvoiceDollar color="#2563eb" /> Your Outstanding Statements
      </h3>

      {invoices.length === 0 ? (
        <p style={{ fontStyle: "italic", color: "#64748b" }}>No active statements generated for your account.</p>
      ) : (
        <div style={{ display: "grid", gap: "15px" }}>
          {invoices.map((inv) => (
            <div key={inv.id} style={{ border: "1px solid #e2e8f0", padding: "15px", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <h4 style={{ margin: "0 0 5px 0" }}>{inv.invoice_type} — {inv.property_name} (Unit {inv.unit_number})</h4>
                <p style={{ margin: "0 0 5px 0", color: "#64748b", fontSize: "14px" }}>Due Date: {inv.due_date}</p>
                <div style={{ display: "flex", gap: "15px", fontSize: "13px" }}>
                  <span><strong>Billed:</strong> ${inv.amount}</span>
                  <span style={{ color: "#16a34a" }}><strong>Paid:</strong> ${inv.amount_paid}</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
                <span style={{
                  padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold",
                  background: inv.status === "PAID" ? "#dcfce7" : "#fee2e2",
                  color: inv.status === "PAID" ? "#166534" : "#991b1b"
                }}>{inv.status}</span>

                {inv.status !== "PAID" && (
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input 
                      type="text" 
                      placeholder="M-Pesa No. (Optional)" 
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      style={{ padding: "6px", fontSize: "13px", borderRadius: "4px", border: "1px solid #cbd5e1", width: "140px" }}
                    />
                    <button
                      onClick={() => handlePayment(inv.id, inv.balance_due)}
                      disabled={processingId === inv.id}
                      style={{
                        background: "#16a34a", color: "#fff", border: "none", padding: "6px 12px",
                        borderRadius: "4px", cursor: "pointer", fontSize: "13px", fontWeight: "600"
                      }}
                    >
                      {processingId === inv.id ? "Processing..." : `Pay $${inv.balance_due}`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TenantInvoices;