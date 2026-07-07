import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import TenantDashboard from "./pages/TenantDashboard";
import OwnerProperties from "./pages/OwnerProperties";
import AddProperty from "./pages/AddProperty";
import AddLease from "./pages/AddLease";
import LeaseForm from "./pages/LeaseForm";
import InspectionsDashboard from "./pages/InspectionsDashboard";
import InspectionForm from "./pages/InspectionForm";
import DamageForm from "./pages/DamageForm";
import DepositSummary from "./pages/DepositSummary";
import MaintenanceDashboard from "./pages/MaintenanceDashboard";
import MaintenanceForm from "./pages/MaintenanceForm";
import MaintenanceVendorDashboard from "./pages/MaintenanceVendorDashboard";
import VendorDashboard from "./pages/VendorDashboard";
import About from "./components/About";
import Footer from "./components/Footer";
import PropertyList from "./pages/PropertyList";

// Financial & Escrow Balance Sheet Components
import TenantInvoices from "./components/TenantInvoices"; 
import OwnerInvoices from "./pages/OwnerInvoices"; 
import PaymentHistory from "./pages/PaymentHistory"; 
import DepositRefundForm from "./pages/DepositRefundForm";
import TenantDepositView from "./pages/TenantDepositView";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUserSession = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Failed to parse user session metadata:", err);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUserSession();
    setLoading(false);
  }, []);

  if (loading) {
    return <div style={{ textAlign: "center", padding: "50px" }}>Initializing Application Session...</div>;
  }

  const isManagement = user?.role === "OWNER" || user?.role === "ADMIN";
  
  // Look up current lease context from state memory blocks
  const activeLeaseId = localStorage.getItem("active_lease_id") || 1;

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      
      <Navbar user={user} onLogout={refreshUserSession} />
      
      <Routes>
        {/* Core Global Paths */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/properties" element={<PropertyList />} />
        
        {/* Authentication Router Blocks */}
        <Route path="/login" element={<Login onLoginSuccess={refreshUserSession} />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboards */}
        <Route path="/admin" element={user ? <AdminDashboard /> : <Navigate to="/login" />} />
        <Route path="/owner" element={user ? <OwnerDashboard /> : <Navigate to="/login" />} />
        <Route path="/tenant" element={user ? <TenantDashboard /> : <Navigate to="/login" />} />

        {/* 📋 Operations Management */}
        <Route path="/leases/add" element={<AddLease />} />
        <Route path="/create-lease" element={<LeaseForm />} />
        <Route path="/properties/add" element={<AddProperty />} />
        <Route path="/owner/properties" element={<OwnerProperties />} />
        <Route path="/owner/add-property" element={<AddProperty />} />

        {/* 💳 Payments & Escrow Engine Routing Block */}
        {user?.role === "TENANT" ? (
          <>
            <Route path="/tenant/billing" element={<TenantInvoices />} />
            <Route path="/payment-history" element={<PaymentHistory />} />
            <Route path="/my-deposits" element={<TenantDepositView activeLeaseId={activeLeaseId} />} />
          </>
        ) : isManagement ? (
          <>
            <Route path="/owner/invoices" element={<OwnerInvoices />} />
            <Route path="/payment-history" element={<PaymentHistory />} />
            <Route path="/refund-deposit" element={<DepositRefundForm leaseId={activeLeaseId} />} />
          </>
        ) : (
          <Route path="/payment-history" element={<Navigate to="/login" />} />
        )}

        {/* 🔧 Conditional Maintenance Subtrees */}
        {isManagement ? (
          <>
            <Route path="/maintenance" element={<MaintenanceVendorDashboard />} />
            <Route path="/vendors" element={<VendorDashboard />} />
            <Route path="/maintenance/new" element={<MaintenanceForm />} />
          </>
        ) : (
          <>
            <Route path="/maintenance" element={<MaintenanceDashboard readOnly={true} />} />
            <Route path="/maintenance/new" element={<MaintenanceForm />} />
          </>
        )}

        {/* 🔍 Conditional Inspections/Damage Arrays */}
        {isManagement ? (
          <>
            <Route path="/inspections" element={<InspectionsDashboard />} />
            <Route path="/create-inspection" element={<InspectionForm />} />
            <Route path="/damage" element={<DamageForm />} />
            <Route path="/deposit-summary" element={<DepositSummary />} />
          </>
        ) : (
          <>
            <Route path="/inspections" element={<InspectionsDashboard readOnly={true} />} />
            <Route path="/deposit-summary" element={<DepositSummary readOnly={true} />} />
          </>
        )}

        {/* Global Catchall Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;