import React, { useState, useEffect } from "react";
import API from "../services/api";
import "../styles/Maintenance.css";

const MaintenanceForm = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await API.get("properties/");
        setProperties(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProperties();
  }, []);

  useEffect(() => {
    const fetchUnits = async () => {
      if (!selectedProperty) return;
      try {
        const res = await API.get(`units/?property=${selectedProperty}`);
        setUnits(res.data.filter((u) => u.status === "VACANT"));
      } catch (err) {
        console.error(err);
      }
    };
    fetchUnits();
  }, [selectedProperty]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !selectedProperty || !selectedUnit) {
      setError("Please fill all fields");
      return;
    }

    try {
      await API.post("maintenance/requests/", {
        title,
        description,
        property: selectedProperty,
        unit: selectedUnit,
      });
      setSuccess("Maintenance request created!");
      setError("");
      setTitle("");
      setDescription("");
      setSelectedProperty("");
      setSelectedUnit("");
    } catch (err) {
      console.error(err);
      setError("Failed to create request");
    }
  };

  return (
    <div className="maintenance-form">
      <h2>Create Maintenance Request</h2>
      {success && <p className="success">{success}</p>}
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <select
          value={selectedProperty}
          onChange={(e) => setSelectedProperty(e.target.value)}
          required
        >
          <option value="">Select Property</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
          required
        >
          <option value="">Select Unit</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>{u.unit_number}</option>
          ))}
        </select>
        <button type="submit">Submit Request</button>
      </form>
    </div>
  );
};

export default MaintenanceForm;
