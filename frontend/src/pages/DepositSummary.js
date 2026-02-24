// src/pages/DepositSummary.js
import React, { useState, useEffect } from "react";
import API from "../services/api";
import "../styles/DepositSummary.css";

const DepositSummary = () => {
  const [leases, setLeases] = useState([]);
  const [selectedLease, setSelectedLease] = useState(null);

  useEffect(() => {
    const fetchLeases = async () => {
      try {
        const res = await API.get("leases/");
        setLeases(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchLeases();
  }, []);

  const selectedLeaseObj = leases.find((l) => l.id === Number(selectedLease));

  const totalDamages = selectedLeaseObj?.inspections?.reduce((acc, insp) => {
    if (insp.damages) {
      return acc + insp.damages.reduce((dAcc, d) => dAcc + Number(d.cost), 0);
    }
    return acc;
  }, 0) || 0;

  const depositAmount = selectedLeaseObj?.deposit || 0;
  const remainingDeposit = depositAmount - totalDamages;

  return (
    <div className="deposit-summary-container">
      <h2>Deposit Summary</h2>
      <select
        value={selectedLease || ""}
        onChange={(e) => setSelectedLease(e.target.value)}
      >
        <option value="">Select Lease</option>
        {leases.map((l) => (
          <option key={l.id} value={l.id}>
            {l.unit.unit_number} - {l.tenant.name}
          </option>
        ))}
      </select>

      {selectedLease && (
        <div className="deposit-details">
          <p>Deposit Paid: ${depositAmount}</p>
          <p>Total Damages: ${totalDamages}</p>
          <p>Remaining Deposit: ${remainingDeposit}</p>
        </div>
      )}
    </div>
  );
};

export default DepositSummary;
