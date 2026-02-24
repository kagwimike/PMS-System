import React, { useEffect, useState } from "react";
import API from "../services/api";
import "../styles/styles.css";

const VendorDashboard = () => {
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch vendors from backend
  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await API.get("maintenance/vendors/");
      console.log("Vendors fetched:", res.data); // debug log
      setVendors(res.data);
    } catch (err) {
      console.error("Error fetching vendors:", err.response?.data || err.message);
      setMessage("Failed to fetch vendors. Make sure you are logged in.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle vendor creation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await API.post("maintenance/vendors/", form);
      console.log("Vendor added:", res.data);
      setForm({ name: "", email: "", phone: "" });
      setMessage("Vendor added successfully!");
      fetchVendors();
    } catch (err) {
      console.error("Error adding vendor:", err.response?.data || err.message);
      setMessage("Failed to add vendor. Check console for details.");
    }
  };

  return (
    <div className="container">
      <h2>Vendor Management</h2>

      {message && <p className="message">{message}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
        />
        <button type="submit">Add Vendor</button>
      </form>

      <h3>Vendor List</h3>
      {loading ? (
        <p>Loading vendors...</p>
      ) : vendors.length === 0 ? (
        <p>No vendors found.</p>
      ) : (
        <ul>
          {vendors.map((v) => (
            <li key={v.id}>
              {v.name} - {v.email} {v.phone && `- ${v.phone}`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default VendorDashboard;