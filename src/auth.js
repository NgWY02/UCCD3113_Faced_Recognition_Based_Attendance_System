import React from "react";
import { Navigate } from "react-router-dom";

// Higher-order component to protect admin routes
export function AdminRoute({ children }) {
  const isAdminLoggedIn = sessionStorage.getItem("adminUsername") === "admin1";

  if (!isAdminLoggedIn) {
    // Redirect to login page if admin is not logged in
    return <Navigate to="/admin/login" />;
  }

  return children;
}

// Function to check if admin is logged in
export function isAdminAuthenticated() {
  return sessionStorage.getItem("adminUsername") === "admin1";
}