import React, { useState, useEffect } from "react";
import API from "../services/api";
import "../styles/AddProperty.css";

const AddProperty = () => {
  // ------------------ Property Fields ------------------
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [propertyType, setPropertyType] = useState("APARTMENT");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [totalUnits, setTotalUnits] = useState(1);
  const [description, setDescription] = useState("");

  // ------------------ Amenities ------------------
  const [amenities, setAmenities] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [newAmenity, setNewAmenity] = useState("");

  // ------------------ Images ------------------
  const [images, setImages] = useState([]);

  // ------------------ Units ------------------
  const [units, setUnits] = useState([]);

  // ------------------ Feedback ------------------
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // ------------------ Fetch Amenities ------------------
  useEffect(() => {
    const fetchAmenities = async () => {
      try {
        const res = await API.get("amenities/");
        setAmenities(res.data);
      } catch (err) {
        console.error("Error fetching amenities:", err);
      }
    };
    fetchAmenities();
  }, []);

  // ------------------ Handlers ------------------
  const handleImageChange = (e) => setImages([...e.target.files]);

  const handleAmenityChange = (e) => {
    const value = e.target.value;
    setSelectedAmenities((prev) =>
      prev.includes(value) ? prev.filter((id) => id !== value) : [...prev, value]
    );
  };

  const handleAddNewAmenity = () => {
    const trimmed = newAmenity.trim();
    if (!trimmed) return;

    const tempId = `new-${Date.now()}`;
    setAmenities([...amenities, { id: tempId, name: trimmed }]);
    setSelectedAmenities([...selectedAmenities, tempId]);
    setNewAmenity("");
  };

  // ------------------ Units Handlers ------------------
  const handleAddUnit = () => {
    setUnits([
      ...units,
      { unit_number: "", floor: "", bedrooms: 1, window_panes: 0, bulbs: 0, rent_price: 0 },
    ]);
  };

  const handleUnitChange = (index, field, value) => {
    const newUnits = [...units];
    newUnits[index][field] = value;
    setUnits(newUnits);
  };

  const handleRemoveUnit = (index) => {
    const newUnits = [...units];
    newUnits.splice(index, 1);
    setUnits(newUnits);
  };

  // ------------------ Submit Form ------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!images.length) {
      setError("Please upload at least one image");
      setSuccess("");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("address", address);
    formData.append("property_type", propertyType);
    formData.append("city", city);
    formData.append("country", country);
    formData.append("total_units", totalUnits);
    formData.append("description", description);

    selectedAmenities.forEach((id) => formData.append("amenities", id));
    images.forEach((img) => formData.append("images", img));

    // Add units dynamically
    units.forEach((unit, idx) => {
      Object.keys(unit).forEach((key) => {
        formData.append(`units[${idx}][${key}]`, unit[key]);
      });
    });

    try {
      await API.post("properties/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess("Property created successfully!");
      setError("");

      // Reset form
      setName("");
      setAddress("");
      setPropertyType("APARTMENT");
      setCity("");
      setCountry("");
      setTotalUnits(1);
      setDescription("");
      setSelectedAmenities([]);
      setImages([]);
      setUnits([]);
    } catch (err) {
      console.error("Property creation error:", err.response || err);
      setError(err.response?.data?.address ? "Address is required" : "Failed to create property");
      setSuccess("");
    }
  };

  // ------------------ JSX ------------------
  return (
    <div className="add-property-container">
      <h2 className="page-title">Add New Property</h2>

      {success && <p className="success-message">{success}</p>}
      {error && <p className="error-message">{error}</p>}

      <form className="property-form" onSubmit={handleSubmit}>
        {/* Property Fields */}
        <input type="text" placeholder="Property Name" value={name} onChange={(e) => setName(e.target.value)} className="form-input" required />
        <input type="text" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} className="form-input" required />
        <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="form-select">
          <option value="APARTMENT">Apartment</option>
          <option value="HOTEL">Hotel</option>
          <option value="AIRBNB">Airbnb</option>
        </select>
        <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="form-input" required />
        <input type="text" placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} className="form-input" required />
        <input type="number" placeholder="Total Units" value={totalUnits} onChange={(e) => setTotalUnits(e.target.value)} min={1} className="form-input" required />
        <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="form-textarea" />

        {/* Amenities */}
        <div className="amenities-group">
          <label className="label-title">Amenities:</label>
          <div className="add-amenity">
            <input type="text" placeholder="Add new amenity" value={newAmenity} onChange={(e) => setNewAmenity(e.target.value)} className="form-input" />
            <button type="button" className="add-amenity-btn" onClick={handleAddNewAmenity}>Add</button>
          </div>
          <div className="amenities-list">
            {amenities.map((a) => (
              <label key={a.id} className="amenity-item">
                <input type="checkbox" value={a.id} checked={selectedAmenities.includes(a.id.toString())} onChange={handleAmenityChange} />
                {a.name}
              </label>
            ))}
          </div>
        </div>

        {/* Images */}
        <div className="images-group">
          <label className="label-title">Images:</label>
          <input type="file" multiple onChange={handleImageChange} className="form-file-input" />
        </div>

        {/* Units Section */}
        <div className="units-group">
          <h3>Units</h3>
          {units.map((unit, idx) => (
            <div key={idx} className="unit-item">
              <input type="text" placeholder="Unit Number" value={unit.unit_number} onChange={(e) => handleUnitChange(idx, "unit_number", e.target.value)} className="form-input" />
              <input type="number" placeholder="Floor" value={unit.floor} onChange={(e) => handleUnitChange(idx, "floor", e.target.value)} className="form-input" />
              <input type="number" placeholder="Bedrooms" value={unit.bedrooms} onChange={(e) => handleUnitChange(idx, "bedrooms", e.target.value)} className="form-input" />
              <input type="number" placeholder="Window Panes" value={unit.window_panes} onChange={(e) => handleUnitChange(idx, "window_panes", e.target.value)} className="form-input" />
              <input type="number" placeholder="Bulbs" value={unit.bulbs} onChange={(e) => handleUnitChange(idx, "bulbs", e.target.value)} className="form-input" />
              <input type="number" placeholder="Rent Price" value={unit.rent_price} onChange={(e) => handleUnitChange(idx, "rent_price", e.target.value)} className="form-input" />
              <button type="button" className="remove-unit-btn" onClick={() => handleRemoveUnit(idx)}>Remove Unit</button>
            </div>
          ))}
          <button type="button" className="add-unit-btn" onClick={handleAddUnit}>Add Unit</button>
        </div>

        <button type="submit" className="submit-btn">Add Property</button>
      </form>
    </div>
  );
};

export default AddProperty;
