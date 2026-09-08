import React, { useEffect, useState } from "react";
import API from "../services/api";
import { Link } from "react-router-dom";
import ManageUnits from "./ManageUnits";
import PropertyTypeChart from "./Dashboard/PropertyTypeChart";
import RevenueOverviewChart from "./Dashboard/RevenueOverviewChart";
import ExpensesChart from "./Dashboard/ExpensesChart";
import ActionCenterTable from "./Dashboard/ActionCenterTable";

import {
  FaChevronLeft,
  FaFileInvoiceDollar,
  FaPlus,
  FaTools,
  FaChartLine,
  FaBuilding,
  FaWarehouse
} from "react-icons/fa";

import "../styles/OwnerDashboard.css";

const OwnerDashboard = () => {
  const [properties, setProperties] = useState([]);
  const [allLeases, setAllLeases] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedPriorities, setSelectedPriorities] = useState({});
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [propRes, leaseRes, maintRes, vendorRes] = await Promise.all([
        API.get("properties/"),
        API.get("leases/"),
        API.get("maintenance/requests/"),
        API.get("maintenance/vendors/")
      ]);

      setProperties(propRes.data || []);
      setAllLeases(leaseRes.data || []);
      setMaintenanceRequests(
        Array.isArray(maintRes.data) ? maintRes.data : maintRes.data?.results || []
      );
      setVendors(
        Array.isArray(vendorRes.data) ? vendorRes.data : vendorRes.data?.results || []
      );
      setError("");
    } catch (err) {
      console.error("Data synchronization error:", err);
      setError("Failed to fetch live management data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAssignVendor = async (requestId, vendorId) => {
    if (!vendorId || actionLoading) return;
    const priority = selectedPriorities[requestId] || "MEDIUM";

    setActionLoading(true);
    try {
      await API.post(`maintenance/requests/${requestId}/assign/`, {
        vendor: vendorId,
        priority
      });
      await fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || "Could not complete vendor assignment.");
    } finally {
      setActionLoading(false);
    }
  };

  const activeLeasesCount = allLeases.filter((lease) => lease.status === "ACTIVE").length;
  const totalUnits = properties.reduce((sum, property) => sum + Number(property.total_units || 0), 0);
  const totalRevenue = allLeases
    .filter((lease) => lease.status === "ACTIVE")
    .reduce((sum, lease) => sum + Number(lease.rent_amount || lease.unit?.rent_price || 0), 0);
  const occupancyRate = totalUnits ? Math.round((activeLeasesCount / totalUnits) * 100) : 0;
  const openTasks = maintenanceRequests.filter((ticket) => ticket.status === "PENDING" || ticket.status === "IN_PROGRESS").length;

  const propertyCards = properties.map((property) => {
    const activeOnProperty = allLeases.filter(
      (lease) => lease.unit?.property?.id === property.id && lease.status === "ACTIVE"
    ).length;
    const total = Number(property.total_units || 0);
    const occupancy = total ? Math.round((activeOnProperty / total) * 100) : 0;
    return {
      id: property.id,
      name: property.name,
      city: property.city,
      country: property.country,
      type: property.property_type || "Residential",
      totalUnits: total,
      occupiedUnits: activeOnProperty,
      occupancy,
      availableUnits: Math.max(0, total - activeOnProperty)
    };
  });

  if (loading) {
    return (
      <div className="owner-dashboard-shell loading-screen">
        <div className="loading-card">
          <span>Loading portfolio data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="owner-dashboard-shell loading-screen">
        <div className="error-card">{error}</div>
      </div>
    );
  }

  if (selectedProperty) {
    const propertyMetrics = propertyCards.find((item) => item.id === selectedProperty.id) || {};

    return (
      <div className="owner-dashboard-shell owner-dashboard-container">
        <div className="page-banner">
          <div className="page-banner-copy">
            <button onClick={() => setSelectedProperty(null)} className="back-button">
              <FaChevronLeft /> Portfolio
            </button>
            <h2>{selectedProperty.name}</h2>
          </div>
          <div className="page-banner-actions">
            <Link to="/owner/add-property" className="pill-button primary">+ New Asset</Link>
            <Link to="/properties" className="pill-button outline">Library</Link>
          </div>
        </div>

        <div className="detail-grid">
          <div className="glass-card detail-summary-card">
            <div className="section-title-row">
              <h3>Snapshot</h3>
              <span className="status-pill active">{propertyMetrics.type}</span>
            </div>

            <div className="detail-metrics-grid">
              <div className="metric-tile">
                <span>Units</span>
                <strong>{propertyMetrics.totalUnits}</strong>
              </div>
              <div className="metric-tile">
                <span>Occupied</span>
                <strong>{propertyMetrics.occupiedUnits}</strong>
              </div>
              <div className="metric-tile">
                <span>Available</span>
                <strong>{propertyMetrics.availableUnits}</strong>
              </div>
              <div className="metric-tile">
                <span>Occupancy Rate</span>
                <strong>{propertyMetrics.occupancy}%</strong>
              </div>
            </div>

            <div className="secondary-meta-row">
              <div>
                <span className="meta-label">Location</span>
                <p>{selectedProperty.city}, {selectedProperty.country}</p>
              </div>
              <div>
                <span className="meta-label">Leases</span>
                <p>{propertyMetrics.occupiedUnits} active</p>
              </div>
            </div>
          </div>

          <div className="glass-card detail-panel-card">
            <div className="section-title-row">
              <h3>Unit Management</h3>
              <span className="status-pill info">Live</span>
            </div>
            <ManageUnits propertyId={selectedProperty.id} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="owner-dashboard-shell owner-dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-branding">
          <h1>Portfolio Dashboard</h1>
        </div>

        <div className="header-actions">
          <Link to="/owner/add-property" className="pill-button primary">
            <FaPlus /> Add Property
          </Link>
          <Link to="/owner/properties" className="pill-button outline">
            Portfolio
          </Link>
        </div>
      </header>

      <section className="summary-panel grid-cols-1 md:grid-cols-2 xl:grid-cols-5">
        <div className="metric-card glass-card">
          <div className="metric-icon accent-blue"><FaBuilding /></div>
          <div>
            <p className="metric-label">Properties</p>
            <strong>{properties.length}</strong>
          </div>
        </div>
        <div className="metric-card glass-card">
          <div className="metric-icon accent-green"><FaWarehouse /></div>
          <div>
            <p className="metric-label">Occupied Units</p>
            <strong>{activeLeasesCount}</strong>
          </div>
        </div>
        <div className="metric-card glass-card">
          <div className="metric-icon accent-pink"><FaChartLine /></div>
          <div>
            <p className="metric-label">Occupancy</p>
            <strong>{occupancyRate}%</strong>
          </div>
        </div>
        <div className="metric-card glass-card">
          <div className="metric-icon accent-amber"><FaTools /></div>
          <div>
            <p className="metric-label">Open Tasks</p>
            <strong>{openTasks}</strong>
          </div>
        </div>
        <div className="metric-card glass-card highlighted-card">
          <div className="metric-icon accent-white"><FaFileInvoiceDollar /></div>
          <div>
            <p className="metric-label">Monthly Revenue</p>
            <strong>KSh {totalRevenue.toLocaleString()}</strong>
          </div>
        </div>
      </section>

      <section className="dashboard-grid layout-grid-2">
        <div className="glass-card portfolio-summary-card">
          <div className="section-title-row">
            <h3>Analytics & Revenue</h3>
            <span className="status-pill active">Live</span>
          </div>

          <div className="portfolio-chart-grid">
            <div className="chart-card chart-card-large">
              <PropertyTypeChart properties={properties} />
            </div>
            <div className="chart-card chart-card-large">
              <RevenueOverviewChart leases={allLeases} />
            </div>
            <div className="chart-card chart-card-small">
              <ExpensesChart requests={maintenanceRequests} />
            </div>
          </div>
        </div>

        <div className="glass-card quick-portfolio-card">
          <div className="section-title-row">
            <h3>Properties</h3>
            <span className="status-pill info">{properties.length} assets</span>
          </div>

          {propertyCards.length === 0 ? (
            <div className="empty-state-card">
              <p>No properties available.</p>
              <Link to="/owner/add-property" className="pill-button primary">Add Property</Link>
            </div>
          ) : (
            <div className="property-card-grid">
              {propertyCards.slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedProperty(properties.find((property) => property.id === item.id))}
                  className="property-card"
                >
                  <div className="property-card-header">
                    <div>
                      <h4>{item.name}</h4>
                      <p>{item.city}, {item.country}</p>
                    </div>
                    <span className="pill-button outline small">Manage</span>
                  </div>
                  <div className="property-card-stats">
                    <span>{item.occupiedUnits}/{item.totalUnits} Occ.</span>
                    <span>{item.availableUnits} Vacant</span>
                  </div>
                  <div className="property-card-footer">
                    <span className={`status-pill ${item.occupancy > 80 ? 'active' : item.occupancy > 40 ? 'warning' : 'offline'}`}>{item.occupancy}%</span>
                    <span className="detail-type">{item.type}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-grid layout-grid-2 lower-panel-grid">
        <div className="glass-card maintenance-workflow-card">
          <div className="section-title-row">
            <h3>Maintenance Tasks</h3>
            <span className="status-pill warning">{openTasks} pending</span>
          </div>

          {maintenanceRequests.length === 0 ? (
            <div className="empty-state-card">
              <p>No maintenance requests.</p>
            </div>
          ) : (
            <div className="maintenance-list">
              {maintenanceRequests.slice(0, 4).map((ticket) => (
                <div key={ticket.id} className="maintenance-item-card">
                  <div className="maintenance-item-head">
                    <div>
                      <h4>{ticket.title}</h4>
                      <p>{ticket.property_name} · Unit {ticket.unit_number}</p>
                    </div>
                    <span className={`status-pill ${ticket.status === 'COMPLETED' || ticket.status === 'VERIFIED' ? 'active' : ticket.status === 'IN_PROGRESS' ? 'warning' : 'offline'}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <div className="maintenance-item-meta">
                    <span className="meta-chip">Priority: {ticket.priority || 'MEDIUM'}</span>
                    <span className="meta-chip">Vendor: {ticket.vendor?.name || ticket.assigned_vendor_name || 'Unassigned'}</span>
                  </div>
                  {ticket.status === 'PENDING' && (
                    <div className="maintenance-actions">
                      <select
                        value={selectedPriorities[ticket.id] || 'MEDIUM'}
                        disabled={actionLoading}
                        onChange={(e) => setSelectedPriorities({ ...selectedPriorities, [ticket.id]: e.target.value })}
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                      <select
                        value={ticket.assigned_vendor || ''}
                        disabled={actionLoading}
                        onChange={(e) => handleAssignVendor(ticket.id, e.target.value)}
                      >
                        <option value="">Assign vendor</option>
                        {vendors.map((vendor) => (
                          <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card lease-overview-card">
          <div className="section-title-row">
            <h3>Lease Tracker</h3>
            <span className="status-pill info">{allLeases.length} total</span>
          </div>
          <ActionCenterTable properties={properties} leases={allLeases} />
        </div>
      </section>
    </div>
  );
};

export default OwnerDashboard;