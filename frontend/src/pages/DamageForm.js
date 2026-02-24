// src/pages/DamageForm.js
import React, { useState, useEffect } from "react";
import API from "../services/api";
import "../styles/DamageForm.css";

const DamageForm = () => {
  const [inspections, setInspections] = useState([]);
  const [selectedInspection, setSelectedInspection] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [photo, setPhoto] = useState(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInspections = async () => {
      try {
        const res = await API.get("inspections/");
        setInspections(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchInspections();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInspection) {
      setError("Select an inspection first");
      return;
    }

    const formData = new FormData();
    formData.append("inspection", selectedInspection);
    formData.append("description", description);
    formData.append("cost", cost);
    if (photo) formData.append("photo", photo);

    try {
      await API.post("damages/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess("Damage recorded!");
      setError("");
      setDescription("");
      setCost("");
      setPhoto(null);
      setSelectedInspection("");
    } catch (err) {
      console.error(err);
      setError("Failed to create damage");
      setSuccess("");
    }
  };

  return (
    <div className="damage-form-container">
      <h2>Record Damage</h2>
      {success && <p className="success-message">{success}</p>}
      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit} className="damage-form">
        <select
          value={selectedInspection}
          onChange={(e) => setSelectedInspection(e.target.value)}
          required
        >
          <option value="">Select Inspection</option>
          {inspections.map((i) => (
            <option key={i.id} value={i.id}>
              {i.lease.unit.unit_number} - {i.inspection_type}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <input
          type="number"
          placeholder="Cost"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          required
        />

        <input
          type="file"
          onChange={(e) => setPhoto(e.target.files[0])}
          accept="image/*"
        />

        <button type="submit">Add Damage</button>
      </form>
    </div>
  );
};

export default DamageForm;
