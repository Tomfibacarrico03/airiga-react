import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute2 = ({ children }) => {
  const { user, loading } = useAuth();

  const currentURL = window.location.href;
  if (user != null) {
    console.log(user);
    return children;
  }
  return <Navigate to="/Login" />;
};

export default ProtectedRoute2;
