import React from "react";
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
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  // Get user from localStorage (or use context if you have it)
  const user = JSON.parse(localStorage.getItem("user"));

  // Owner/Admin routes
  const adminRoutes = [
    <Route key="inspections" path="/inspections" element={<InspectionsDashboard />} />,
    <Route key="create-inspection" path="/create-inspection" element={<InspectionForm />} />,
    <Route key="damage" path="/damage" element={<DamageForm />} />,
    <Route key="deposit-summary" path="/deposit-summary" element={<DepositSummary />} />,
  ];

  // Tenant read-only routes
  const tenantRoutes = [
    <Route key="inspections" path="/inspections" element={<InspectionsDashboard readOnly={true} />} />,
    <Route key="deposit-summary" path="/deposit-summary" element={<DepositSummary readOnly={true} />} />,
  ];

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/properties" element={<PropertyList />} />
        <Route path="/" element={<Home />} />
        <Route path="/leases/add" element={<AddLease />} />
        <Route path="/create-lease" element={<LeaseForm />} />
        <Route path="/properties/add" element={<AddProperty />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/owner" element={<OwnerDashboard />} />
        <Route path="/tenant" element={<TenantDashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/owner/properties" element={<OwnerProperties />} />
        <Route path="/owner/add-property" element={<AddProperty />} />
        <Route path="/maintenance" element={<MaintenanceDashboard />} />
        <Route path="/maintenance/new" element={<MaintenanceForm />} />
        <Route path="/about" element={<About />} />
       


        {/* ================= Maintenance & Vendors ================= */}

{user?.role === "OWNER" || user?.role === "ADMIN" ? (
  <>
    <Route path="/maintenance" element={<MaintenanceVendorDashboard />} />
    {/* <Route path="/maintenance/new" element={<MaintenanceForm />} /> */}
    <Route path="/vendors" element={<VendorDashboard />} />
  </>
) : (
  <>
    {/* Tenants can only view maintenance (read-only) */}
    <Route
      path="/maintenance"
      element={<MaintenanceDashboard readOnly={true} />}
    />
  </>
)}



        {/* Conditional routes for inspections & damage */}
        {user?.role === "OWNER" || user?.role === "ADMIN" ? adminRoutes : tenantRoutes}

        {/* Fallback for unmatched routes */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      
      <Footer />
    </Router>
  );
}

export default App; 