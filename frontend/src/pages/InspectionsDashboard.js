// src/pages/InspectionsDashboard.js
import React, { useState, useEffect } from "react";
import API from "../services/api";
import "../styles/InspectionsDashboard.css";

const InspectionsDashboard = () => {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedInspectionId, setExpandedInspectionId] = useState(null);

  const fetchInspections = async () => {
    try {
      const res = await API.get("inspections/");
      if (Array.isArray(res.data)) {
        setInspections(res.data);
      } else if (res.data && Array.isArray(res.data.results)) {
        setInspections(res.data.results);
      } else {
        setInspections([]);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching inspections:", err);
      setError("Failed to load inspections data log.");
      setLoading(false);
    }
  };

  const handleToggleRow = (id) => {
    setExpandedInspectionId(expandedInspectionId === id ? null : id);
  };

  const handleResolveDamage = async (damageId, inspectionId) => {
    try {
      await API.patch(`damages/${damageId}/`, { resolved: true });
      // Instantly refresh localized state cache
      setInspections((prev) =>
        prev.map((ins) => {
          if (ins.id === inspectionId) {
            return {
              ...ins,
              damages: ins.damages.map((dmg) =>
                dmg.id === damageId ? { ...dmg, resolved: true } : dmg
              ),
            };
          }
          return ins;
        })
      );
    } catch (err) {
      console.error("Failed to update damage resolution state:", err);
      alert("Error closing damage record.");
    }
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  if (loading) return <p className="loading">Loading inspections record tree...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="inspections-dashboard" style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "between", alignItems: "center", marginBottom: "20px" }}>
        <h2>Inspections & Asset Audit Records</h2>
      </div>

      {inspections.length === 0 ? (
        <p style={{ color: "#64748b", fontStyle: "italic" }}>No property walkthrough items registered.</p>
      ) : (
        <div style={{ overflowX: "auto", background: "#fff", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <table className="inspections-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ padding: "14px 16px" }}>Unit Info</th>
                <th style={{ padding: "14px 16px" }}>Resident User</th>
                <th style={{ padding: "14px 16px" }}>Walkthrough Category</th>
                <th style={{ padding: "14px 16px" }}>Execution Date</th>
                <th style={{ padding: "14px 16px" }}>Condition Baseline</th>
                <th style={{ padding: "14px 16px" }}>Status</th>
                <th style={{ padding: "14px 16px", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inspections.map((i) => {
                const hasDamages = i.damages && i.damages.length > 0;
                const totalDamageCost = hasDamages 
                  ? i.damages.reduce((acc, current) => acc + parseFloat(current.cost || 0), 0)
                  : 0;

                return (
                  <React.Fragment key={i.id}>
                    <tr style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }} onClick={() => handleToggleRow(i.id)}>
                      <td style={{ padding: "14px 16px", fontWeight: "600", color: "#1e293b" }}>
                        Unit {i.unit_number || "N/A"}
                        <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "400" }}>{i.property_title}</div>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#334155" }}>
                        {i.tenant_name || "Vacant / Unassigned"}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                          background: i.inspection_type === "CHECKIN" ? "#e0f2fe" : i.inspection_type === "CHECKOUT" ? "#fee2e2" : "#f1f5f9",
                          color: i.inspection_type === "CHECKIN" ? "#0369a1" : i.inspection_type === "CHECKOUT" ? "#b91c1c" : "#475569"
                        }}>
                          {i.inspection_type_display}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#475569" }}>
                        {i.date ? new Date(i.date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : "N/A"}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: "600", color: i.condition_score >= 90 ? "#16a34a" : "#ca8a04" }}>
                          {i.condition_score} / 100
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700",
                          background: i.status === "PASSED" ? "#dcfce7" : i.status === "ISSUES_FOUND" ? "#fef9c3" : "#e2e8f0",
                          color: i.status === "PASSED" ? "#15803d" : i.status === "ISSUES_FOUND" ? "#a16207" : "#475569"
                        }}>
                          {i.status_display}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <button style={{
                          background: "none", border: "none", color: "#4f46e5", fontWeight: "600", cursor: "pointer", fontSize: "13px"
                        }}>
                          {expandedInspectionId === i.id ? "Hide Details ▲" : "View Breakdown ▼"}
                        </button>
                      </td>
                    </tr>

                    {/* Collapsible Actionable Breakdown Drawer */}
                    {expandedInspectionId === i.id && (
                      <tr style={{ background: "#f8fafc" }}>
                        <td colSpan="7" style={{ padding: "20px", borderBottom: "1px solid #e2e8f0" }}>
                          <div style={{ paddingBottom: "12px", borderBottom: "1px solid #e2e8f0", marginBottom: "12px" }}>
                            <strong>Auditor Inspector Notes:</strong>
                            <p style={{ margin: "6px 0 0 0", color: "#475569", fontSize: "13px" }}>{i.notes || "No structural notations made during this walkthrough."}</p>
                          </div>

                          {hasDamages ? (
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                                <span style={{ fontWeight: "700", fontSize: "14px", color: "#0f172a" }}>Itemized Structural Damages Liability Log</span>
                                <span style={{ fontWeight: "700", color: "#b91c1c" }}>Total Financial Exposure: KES {totalDamageCost.toLocaleString()}</span>
                              </div>
                              <div style={{ display: "grid", gap: "10px" }}>
                                {i.damages.map((dmg) => (
                                  <div key={dmg.id} style={{
                                    background: "#fff", padding: "12px", borderRadius: "6px", border: "1px solid #e2e8f0",
                                    display: "flex", justifyContent: "space-between", alignItems: "center"
                                  }}>
                                    <div>
                                      <div style={{ fontWeight: "600", fontSize: "13px" }}>{dmg.description}</div>
                                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                                        Allocation target: <span style={{ fontWeight: "600" }}>{dmg.charge_target_display}</span>
                                      </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                      <span style={{ fontWeight: "700", color: "#1e293b" }}>KES {parseFloat(dmg.cost).toLocaleString()}</span>
                                      {dmg.resolved ? (
                                        <span style={{ color: "#16a34a", fontSize: "12px", fontWeight: "600" }}>✓ Resolved / Repaired</span>
                                      ) : (
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); handleResolveDamage(dmg.id, i.id); }}
                                          style={{
                                            background: "#ef4444", color: "#fff", border: "none", padding: "4px 8px", 
                                            borderRadius: "4px", fontSize: "11px", cursor: "pointer", fontWeight: "600"
                                          }}
                                        >
                                          Mark Repaired
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p style={{ margin: 0, color: "#16a34a", fontSize: "13px", fontWeight: "600" }}>✓ Excellent. No asset damage markers appended to this checklist.</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InspectionsDashboard;