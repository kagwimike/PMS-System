// src/pages/DepositSummary.js
import React, { useState, useEffect } from "react";
import API from "../services/api";
import "../styles/DepositSummary.css";

const DepositSummary = () => {
  const [leases, setLeases] = useState([]);
  const [selectedLease, setSelectedLease] = useState("");
  const [inspections, setInspections] = useState([]);

  useEffect(() => {
    const fetchLeases = async () => {
      try {
        const res = await API.get("leases/");
        if (Array.isArray(res.data)) {
          setLeases(res.data);
        } else if (res.data && Array.isArray(res.data.results)) {
          setLeases(res.data.results);
        }
      } catch (err) {
        console.error("Error loading lease datasets:", err);
      }
    };
    fetchLeases();
  }, []);

  // Fetch all inspections to map historical damage claims for the selected lease scope
  useEffect(() => {
    if (!selectedLease) {
      setInspections([]);
      return;
    }
    
    API.get(`inspections/`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        // Filter local inspections bound strictly to this lease profile identity
        const filtered = data.filter((insp) => Number(insp.lease) === Number(selectedLease));
        setInspections(filtered);
      })
      .catch((err) => console.error("Error linking structural inspections for allocation:", err));
  }, [selectedLease]);

  const selectedLeaseObj = leases.find((l) => l.id === Number(selectedLease));

  // Compute ONLY damages legally designated for security deposit deduction
  const actionableDamagesList = inspections.flatMap(insp => insp.damages || [])
    .filter(dmg => dmg.charge_target === 'TENANT_DEPOSIT');

  const totalDeductibleDamages = actionableDamagesList.reduce(
    (acc, dmg) => acc + parseFloat(dmg.cost || 0), 0
  );

  const depositAmount = parseFloat(selectedLeaseObj?.security_deposit || selectedLeaseObj?.deposit || 0);
  const finalRefundSettlement = depositAmount - totalDeductibleDamages;

  return (
    <div className="deposit-summary-container" style={{ padding: "30px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2>Security Deposit Reconciliation Engine</h2>
        <p style={{ color: "#64748b" }}>Calculate financial move-out payouts automatically using structural asset audit variables.</p>
      </div>

      <div style={{ marginBottom: "24px", display: "flex", flexDirection: "column", gap: "6px" }}>
        <label style={{ fontWeight: "600", fontSize: "14px" }}>Select Lease Active File:</label>
        <select
          value={selectedLease}
          onChange={(e) => setSelectedLease(e.target.value)}
          style={{ padding: "12px", borderRadius: "6px", border: "1px solid #cbd5e1", width: "100%", background: "#fff" }}
        >
          <option value="">-- Choose Account Unit to Reconcile --</option>
          {leases.map((l) => (
            <option key={l.id} value={l.id}>
              Unit {l.unit?.unit_number || l.unit_number || `ID #${l.id}`} - Tenant: {l.tenant?.username || "Active Resident"}
            </option>
          ))}
        </select>
      </div>

      {selectedLease && selectedLeaseObj && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
          <div style={{ background: "#0f172a", color: "#fff", padding: "16px 20px" }}>
            <h3 style={{ margin: 0, fontSize: "16px" }}>Statement of Account Settlement</h3>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>Lease Reference Index: #{selectedLeaseObj.id}</span>
          </div>

          <div style={{ padding: "20px" }}>
            {/* Ledger Line Balance Breakdown */}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px dashed #e2e8f0" }}>
              <span style={{ color: "#475569" }}>Initial Escrow Escaped Deposit Posted:</span>
              <span style={{ fontWeight: "600", color: "#0f172a" }}>KES {depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px dashed #e2e8f0" }}>
              <span style={{ color: "#b91c1c" }}>Total Deductible Move-Out Asset Damage Liability:</span>
              <span style={{ fontWeight: "600", color: "#b91c1c" }}>- KES {totalDeductibleDamages.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "20px 0 10px 0", marginTop: "10px" }}>
              <span style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>Net Refundable Payout Due:</span>
              <span style={{ fontSize: "18px", fontWeight: "800", color: finalRefundSettlement >= 0 ? "#16a34a" : "#b91c1c" }}>
                KES {finalRefundSettlement.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Itemized Claims Sub-table Block */}
          <div style={{ background: "#f8fafc", padding: "20px", borderTop: "1px solid #e2e8f0" }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", uppercase: "true", color: "#475569", letterSpacing: "0.05em" }}>Itemized Deductions Audit Trail</h4>
            {actionableDamagesList.length === 0 ? (
              <p style={{ margin: 0, fontSize: "13px", color: "#16a34a", fontStyle: "italic" }}>✓ Zero deposit deductions logged against this user's asset threshold.</p>
            ) : (
              <div style={{ display: "grid", gap: "8px" }}>
                {actionableDamagesList.map((dmg) => (
                  <div key={dmg.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", background: "#fff", padding: "8px 12px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                    <span style={{ color: "#334155" }}>{dmg.description}</span>
                    <span style={{ fontWeight: "600", color: "#0f172a" }}>KES {parseFloat(dmg.cost).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DepositSummary;