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
      console.error("❌ [LEASE FORM] Error fetching properties:", err);
    }
  };

  const fetchTenants = async () => {
    try {
      const res = await API.get("tenants/");
      setTenants(res.data);
    } catch (err) {
      console.error("❌ [LEASE FORM] Error fetching tenants:", err);
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
      console.log(`📡 [LEASE FORM] Loading vacant units for Property ID: ${propertyId}`);
      const res = await API.get(`units/?property=${propertyId}`);

      // Only VACANT units
      const vacantUnits = res.data.filter(
        (unit) => unit.status === "VACANT"
      );

      console.log(`📋 [LEASE FORM] Found ${vacantUnits.length} vacant units:`, vacantUnits);
      setUnits(vacantUnits);
      setSelectedUnit("");
    } catch (err) {
      console.error("❌ [LEASE FORM] Error loading units:", err);
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
      SUBMIT HANDLER
  ============================ */

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    let tenantId = selectedTenant;

    console.log("🚀 [SUBMIT START] Processing lease form submission...");

    try {
      /* ---------- CREATE TENANT INLINE ---------- */
      if (creatingTenant) {
        const tenantPayload = {
          name: tenantName,
          email: tenantEmail,
          phone: tenantPhone,
          id_number: tenantIdNumber,
        };
        
        console.log("👤 [TENANT CREATION] Attempting inline tenant post. Payload:", tenantPayload);

        try {
          const tenantRes = await API.post("tenants/", tenantPayload);
          tenantId = tenantRes.data.id;
          console.log(`✅ [TENANT CREATION] New tenant created successfully with ID: ${tenantId}`, tenantRes.data);
          setTenants((prev) => [...prev, tenantRes.data]);

        } catch (err) {
          console.warn("⚠️ [TENANT CREATION] Primary inline request failed. Checking fallback conditions...", err.response?.data);
          
          // If email already exists, fetch that tenant instead
          if (err.response?.data?.email) {
            try {
              console.log(`🔍 [TENANT LOOKUP] Fetching existing tenant via email fallback: ${tenantEmail}`);
              const existing = await API.get(`tenants/?email=${tenantEmail}`);

              if (existing.data.length > 0) {
                tenantId = existing.data[0].id;
                console.log(`🎯 [TENANT LOOKUP] Matched existing record. Using Tenant ID: ${tenantId}`);
              } else {
                console.error("❌ [TENANT LOOKUP] Server rejected creation due to existing email, but lookup query returned empty data.");
                setError("Tenant email already exists.");
                return;
              }

            } catch (fetchErr) {
              console.error("❌ [TENANT FALLBACK CRITICAL] Failed to retrieve existing tenant data:", fetchErr);
              setError("Tenant already exists but could not retrieve.");
              return;
            }
          } else {
            console.error("❌ [TENANT CREATION CRITICAL] Inline tenant generation broke down completely:", err.response?.data);
            setError(JSON.stringify(err.response?.data));
            return;
          }
        }
      }

      /* ---------- CREATE LEASE (WITH PENDING TRIGGER) ---------- */
      const leasePayload = {
        property: selectedProperty,
        unit: selectedUnit,
        tenant: tenantId,
        start_date: startDate,
        end_date: endDate,
        rent_amount: rentAmount,
        status: "PENDING", 
      };

      console.log("📡 [LEASE API POST] Shipping payload to Django API backend server:", leasePayload);

      const response = await API.post("leases/", leasePayload);
      
      console.log("✅ [LEASE API SUCCESS] Server responded with code 201. Record created:", response.data);
      setSuccess("Lease dropped into ecosystem pending verification! Automated STK request sent.");

      /* ---------- AUTO REFRESH UNITS ---------- */
      console.log("🔄 [POST-SUBMIT REFRESH] Triggering component state synchronized reload...");
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
      console.log("🧹 [POST-SUBMIT CLEANUP] Form inputs successfully cleared and reset.");

    } catch (err) {
      console.error("💥 [LEASE CRITICAL EXCEPTION] Handshake pipeline failed completely.");
      
      if (err.response) {
        console.error(`📊 [SERVER ERROR] Status Received: ${err.response.status}`);
        console.error("📄 [SERVER ERROR Payload Body]:", err.response.data);
        setError(err.response.data?.detail || JSON.stringify(err.response.data));
      } else if (err.request) {
        console.error("📡 [NETWORK ERROR] No response received from target host backend endpoint:", err.request);
        setError("Network connection timed out. Verify your API local server state.");
      } else {
        console.error("⚙️ [SETUP ERROR] Exception occurred processing network lifecycle configurations:", err.message);
        setError("Something went wrong while initializing request setup parameters.");
      }
    }
  };

  /* ============================
      UI VIEWPORT RENDER
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