import React, { useState, useEffect } from "react";
import API from "../services/api";
import "../styles/LeaseForm.css";

const LeaseForm = () => {
  /* ============================
     STATE
  ============================ */

  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);

  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedTenant, setSelectedTenant] = useState("");

  const [creatingTenant, setCreatingTenant] = useState(false);

  const [tenantName, setTenantName] = useState("");
  const [tenantEmail, setTenantEmail] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [tenantIdNumber, setTenantIdNumber] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rentAmount, setRentAmount] = useState("");

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  /* ============================
     FETCH INITIAL DATA
  ============================ */

  useEffect(() => {
    fetchProperties();
    fetchTenants();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await API.get("properties/");
      setProperties(res.data);
    } catch (err) {
      console.error("Error fetching properties:", err);
    }
  };

  const fetchTenants = async () => {
    try {
      const res = await API.get("tenants/");
      setTenants(res.data);
    } catch (err) {
      console.error("Error fetching tenants:", err);
    }
  };

  /* ============================
     LOAD UNITS WHEN PROPERTY CHANGES
  ============================ */

  useEffect(() => {
    if (!selectedProperty) {
      setUnits([]);
      setSelectedUnit("");
      return;
    }

    loadUnits(selectedProperty);
  }, [selectedProperty]);

  const loadUnits = async (propertyId) => {
    try {
      const res = await API.get(`units/?property=${propertyId}`);

      // Only VACANT units
      const vacantUnits = res.data.filter(
        (unit) => unit.status === "VACANT"
      );

      setUnits(vacantUnits);
      setSelectedUnit("");
    } catch (err) {
      console.error("Error loading units:", err);
      setUnits([]);
    }
  };

  /* ============================
     TENANT TOGGLE
  ============================ */

  const handleTenantToggle = () => {
    setCreatingTenant(!creatingTenant);
    setSelectedTenant("");
    setTenantName("");
    setTenantEmail("");
    setTenantPhone("");
    setTenantIdNumber("");
  };

  /* ============================
     SUBMIT
  ============================ */

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    let tenantId = selectedTenant;

    try {
      /* ---------- CREATE TENANT INLINE ---------- */
      if (creatingTenant) {
  try {
    const tenantRes = await API.post("tenants/", {
      name: tenantName,
      email: tenantEmail,
      phone: tenantPhone,
      id_number: tenantIdNumber,
    });

    tenantId = tenantRes.data.id;
    setTenants((prev) => [...prev, tenantRes.data]);

  } catch (err) {
    // If email already exists, fetch that tenant instead
    if (err.response?.data?.email) {
      try {
        const existing = await API.get(
          `tenants/?email=${tenantEmail}`
        );

        if (existing.data.length > 0) {
          tenantId = existing.data[0].id;
        } else {
          setError("Tenant email already exists.");
          return;
        }

      } catch (fetchErr) {
        setError("Tenant already exists but could not retrieve.");
        return;
      }
    } else {
      setError(JSON.stringify(err.response?.data));
      return;
    }
  }
}


      /* ---------- CREATE LEASE ---------- */
      await API.post("leases/", {
        property: selectedProperty,
        unit: selectedUnit,
        tenant: tenantId,
        start_date: startDate,
        end_date: endDate,
        rent_amount: rentAmount,
      });

      setSuccess("Lease created successfully!");

      /* ---------- AUTO REFRESH UNITS (STATUS UPDATE) ---------- */
      await loadUnits(selectedProperty);

      /* ---------- RESET FORM ---------- */
      setSelectedUnit("");
      setSelectedTenant("");
      setCreatingTenant(false);
      setTenantName("");
      setTenantEmail("");
      setTenantPhone("");
      setTenantIdNumber("");
      setStartDate("");
      setEndDate("");
      setRentAmount("");

    } catch (err) {
      console.error("Lease creation error:", err.response || err);
      setError(
        err.response?.data?.detail ||
          "Something went wrong while creating lease."
      );
    }
  };

  /* ============================
     UI
  ============================ */

  return (
    <div className="lease-form-container">
      <h2 className="page-title">Create Lease</h2>

      {success && <p className="success-message">{success}</p>}
      {error && <p className="error-message">{error}</p>}

      <form className="lease-form" onSubmit={handleSubmit}>
        {/* PROPERTY */}
        <select
          value={selectedProperty}
          onChange={(e) => setSelectedProperty(e.target.value)}
          className="form-select"
          required
        >
          <option value="">Select Property</option>
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.name}
            </option>
          ))}
        </select>

        {/* UNIT */}
        <select
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
          className="form-select"
          required
          disabled={!selectedProperty || units.length === 0}
        >
          <option value="">
            {units.length === 0
              ? "No Vacant Units Available"
              : "Select Unit"}
          </option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.unit_number}
            </option>
          ))}
        </select>

        {/* TENANT SECTION */}
        <div className="tenant-section">
          <label>
            <input
              type="checkbox"
              checked={creatingTenant}
              onChange={handleTenantToggle}
            />
            Create New Tenant
          </label>

          {creatingTenant ? (
            <>
              <input
                type="text"
                placeholder="Tenant Name"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Tenant Email"
                value={tenantEmail}
                onChange={(e) => setTenantEmail(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Tenant Phone"
                value={tenantPhone}
                onChange={(e) => setTenantPhone(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="ID / Passport Number"
                value={tenantIdNumber}
                onChange={(e) => setTenantIdNumber(e.target.value)}
                required
              />
            </>
          ) : (
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              required
            >
              <option value="">Select Tenant</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name} ({tenant.id_number})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* DATES */}
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          required
        />

        {/* RENT */}
        <input
          type="number"
          placeholder="Rent Amount"
          value={rentAmount}
          onChange={(e) => setRentAmount(e.target.value)}
          required
        />

        <button type="submit">Create Lease</button>
      </form>
    </div>
  );
};

export default LeaseForm;  