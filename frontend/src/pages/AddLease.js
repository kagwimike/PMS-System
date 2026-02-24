// src/pages/AddLease.js
import React, { useState, useEffect } from "react";
import API from "../services/api";
import "../styles/AddLease.css";

const AddLease = () => {
  // Form fields
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);

  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedTenant, setSelectedTenant] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [notes, setNotes] = useState("");

  // Feedback
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Fetch properties & tenants on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const propsRes = await API.get("properties/");
        setProperties(propsRes.data);

        const tenantsRes = await API.get("users/?role=tenant"); // Assuming your API can filter by role
        setTenants(tenantsRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  // Fetch units when property changes
  useEffect(() => {
    if (!selectedProperty) return;

    const fetchUnits = async () => {
      try {
        const res = await API.get(`properties/${selectedProperty}/units/`);
        // Only show VACANT units
        const vacantUnits = res.data.filter((u) => u.status === "VACANT");
        setUnits(vacantUnits);
        setSelectedUnit(""); // Reset selected unit
      } catch (err) {
        console.error("Error fetching units:", err);
      }
    };
    fetchUnits();
  }, [selectedProperty]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProperty || !selectedUnit || !selectedTenant || !startDate || !endDate) {
      setError("Please fill in all required fields");
      setSuccess("");
      return;
    }

    const data = {
      unit: selectedUnit,
      tenant: selectedTenant,
      start_date: startDate,
      end_date: endDate,
      rent_amount: rentAmount || undefined,
      deposit_amount: depositAmount || undefined,
      notes: notes || "",
    };

    try {
      await API.post("leases/", data);
      setSuccess("Lease created successfully! Unit status updated automatically.");
      setError("");

      // Reset form
      setSelectedProperty("");
      setUnits([]);
      setSelectedUnit("");
      setSelectedTenant("");
      setStartDate("");
      setEndDate("");
      setRentAmount("");
      setDepositAmount("");
      setNotes("");
    } catch (err) {
      console.error("Lease creation error:", err.response || err);
      setError(err.response?.data?.non_field_errors || "Failed to create lease");
      setSuccess("");
    }
  };

  return (
    <div className="add-lease-container">
      <h2 className="page-title">Add New Lease</h2>

      {success && <p className="success-message">{success}</p>}
      {error && <p className="error-message">{error}</p>}

      <form className="lease-form" onSubmit={handleSubmit}>
        {/* Property */}
        <select
          value={selectedProperty}
          onChange={(e) => setSelectedProperty(e.target.value)}
          className="form-select"
          required
        >
          <option value="">Select Property</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.total_units} units)
            </option>
          ))}
        </select>

        {/* Unit */}
        <select
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
          className="form-select"
          required
          disabled={!selectedProperty || units.length === 0}
        >
          <option value="">Select Unit (VACANT only)</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.unit_number} - Floor {u.floor} - {u.bedrooms} BR
            </option>
          ))}
        </select>

        {/* Tenant */}
        <select
          value={selectedTenant}
          onChange={(e) => setSelectedTenant(e.target.value)}
          className="form-select"
          required
        >
          <option value="">Select Tenant</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.username} ({t.email})
            </option>
          ))}
        </select>

        {/* Dates */}
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="form-input"
          required
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="form-input"
          required
        />

        {/* Rent & Deposit */}
        <input
          type="number"
          placeholder="Rent Amount"
          value={rentAmount}
          onChange={(e) => setRentAmount(e.target.value)}
          className="form-input"
        />
        <input
          type="number"
          placeholder="Deposit Amount"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          className="form-input"
        />

        {/* Notes */}
        <textarea
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="form-textarea"
        />

        <button type="submit" className="submit-btn">
          Create Lease
        </button>
      </form>
    </div>
  );
};

export default AddLease;
