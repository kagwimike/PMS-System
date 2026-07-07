import React, { useState, useEffect } from "react";
import api from "../services/api";

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await api.get("payments/history/");
        setPayments(res.data || []);
      } catch (error) {
        console.error("Error retrieving transactional history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  if (loading) return <div className="loading">Processing Payment Ledgers...</div>;

  return (
    <div className="dashboard-container" style={{ padding: "30px" }}>
      <div className="dashboard-header" style={{ marginBottom: "20px" }}>
        <h2>Transaction Statement History</h2>
        <p>A consolidated, real-time ledger of all parsed system transfers, M-Pesa receipts, and Stripe settlements.</p>
      </div>

      <div className="table-responsive" style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #eee" }}>
              <th style={{ padding: "12px" }}>Reference ID</th>
              <th style={{ padding: "12px" }}>Invoice Ref</th>
              <th style={{ padding: "12px" }}>Method</th>
              <th style={{ padding: "12px" }}>Amount Settled</th>
              <th style={{ padding: "12px" }}>Clearance Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: "20px", textAlign: "center", color: "#777" }}>No transactions recorded yet.</td>
              </tr>
            ) : (
              payments.map((pay) => (
                <tr key={pay.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "12px", color: "#1a73e8", fontWeight: "bold" }}>{pay.transaction_reference}</td>
                  <td style={{ padding: "12px" }}>#{pay.invoice_number}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      background: pay.payment_method === "M-PESA" ? "#4caf50" : "#6772e5",
                      color: "#fff",
                      fontSize: "11px",
                      fontWeight: "bold"
                    }}>
                      {pay.payment_method}
                    </span>
                  </td>
                  <td style={{ padding: "12px", fontWeight: "600", color: "#137333" }}>
                    KES {pay.amount_paid.toLocaleString()}
                  </td>
                  <td style={{ padding: "12px" }}>{new Date(pay.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentHistory;