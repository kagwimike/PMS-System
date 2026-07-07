import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ user, allowedRoles, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Normalize both the user's role and allowedRoles array to uppercase
  const userRoleNormalized = user?.role?.toUpperCase();
  const rolesAllowedNormalized = allowedRoles.map(role => role.toUpperCase());

  if (allowedRoles && !rolesAllowedNormalized.includes(userRoleNormalized)) {
    // If unauthorized for this component, fall back gracefully instead of clearing the state
    return <Navigate to={`/${user?.role?.toLowerCase()}`} replace />;
  }

  return children;
};

export default ProtectedRoute;